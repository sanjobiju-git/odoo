import uuid
from decimal import Decimal
from datetime import date
from django.db import transaction
from apps.subscriptions.models import Subscription, SubscriptionEvent
from apps.invoices.models import Invoice, InvoiceLine
from apps.plans.utils import calculate_next_billing_date
from .models import BillingEvent

def process_subscription_billing(subscription_id: uuid.UUID, billing_date: date = None) -> tuple[Invoice | None, str]:
    """
    Idempotent, transactional billing processor for an individual active subscription.
    Guarantees that duplicate invoices are never generated for the same billing cycle.
    """
    target_date = billing_date or date.today()

    with transaction.atomic():
        try:
            subscription = Subscription.objects.select_for_update().get(id=subscription_id)
        except Subscription.DoesNotExist:
            return None, "Subscription not found."

        if subscription.status != Subscription.Status.ACTIVE:
            return None, f"Subscription is in status {subscription.status}, not ACTIVE."

        if subscription.next_billing_date > target_date:
            return None, f"Skipped: Subscription is not due yet (Next billing: {subscription.next_billing_date})."

        period_start = subscription.next_billing_date
        period_end = calculate_next_billing_date(period_start, subscription.billing_frequency)

        # 1. Idempotency Check: Prevent duplicate invoices
        existing_invoice = Invoice.objects.filter(
            subscription=subscription,
            billing_period_start=period_start,
            billing_period_end=period_end
        ).exclude(status=Invoice.Status.CANCELLED).first()

        if existing_invoice:
            BillingEvent.objects.create(
                subscription=subscription,
                event_type='SKIPPED_DUPLICATE',
                status=BillingEvent.Status.SKIPPED,
                billing_period_start=period_start,
                billing_period_end=period_end,
                invoice_id=existing_invoice.id,
                details=f"Invoice {existing_invoice.invoice_number} already exists for period {period_start} to {period_end}."
            )
            return existing_invoice, "Skipped: Invoice already exists."

        # 2. Build Invoice
        customer = subscription.customer
        invoice = Invoice.objects.create(
            customer=customer,
            subscription=subscription,
            billing_period_start=period_start,
            billing_period_end=period_end,
            invoice_date=target_date,
            due_date=target_date + subscription.payment_terms_days * date.resolution,
            status=Invoice.Status.CONFIRMED,
            currency=subscription.currency,
            notes=f"Automated recurring billing for {subscription.plan.name} ({period_start} to {period_end})."
        )

        subtotal = Decimal('0.00')
        tax_total = Decimal('0.00')
        discount_total = Decimal('0.00')

        # 3. Copy Lines & Calculate with Decimal precision
        for sub_line in subscription.lines.all():
            line_subtotal = round(Decimal(sub_line.quantity) * sub_line.unit_price, 2)
            line_discount = Decimal('0.00')

            # Evaluate discount if rule exists
            if sub_line.discount_rule:
                is_eligible, _ = sub_line.discount_rule.is_eligible(line_subtotal, sub_line.quantity, sub_line.product, target_date)
                if is_eligible:
                    line_discount = sub_line.discount_rule.calculate_discount(line_subtotal)

            taxable = max(Decimal('0.00'), line_subtotal - line_discount)
            line_tax = Decimal('0.00')
            tax_name = ''
            tax_rate = Decimal('0.0000')

            if sub_line.tax_rate and sub_line.tax_rate.status == 'ACTIVE':
                tax_name = sub_line.tax_rate.name
                tax_rate = sub_line.tax_rate.rate_percentage
                line_tax = sub_line.tax_rate.calculate_tax(taxable)

            line_total = round(taxable + line_tax, 2)

            InvoiceLine.objects.create(
                invoice=invoice,
                product=sub_line.product,
                description=sub_line.description or f"{sub_line.product.name} ({subscription.plan.name})",
                quantity=sub_line.quantity,
                unit_price=sub_line.unit_price,
                discount_amount=line_discount,
                tax_name_snapshot=tax_name,
                tax_rate_snapshot=tax_rate,
                tax_amount=line_tax,
                subtotal=line_subtotal,
                total_amount=line_total
            )

            subtotal += line_subtotal
            tax_total += line_tax
            discount_total += line_discount

        # Final invoice totals
        invoice.subtotal = round(subtotal, 2)
        invoice.tax_total = round(tax_total, 2)
        invoice.discount_total = round(discount_total, 2)
        invoice.total_amount = round(subtotal - discount_total + tax_total, 2)
        invoice.balance_due = invoice.total_amount
        invoice.save(update_fields=['subtotal', 'tax_total', 'discount_total', 'total_amount', 'balance_due', 'updated_at'])

        # 4. Advance Subscription Next Billing Date
        subscription.next_billing_date = period_end

        # Check for auto-close expiration
        if subscription.expiry_date and subscription.next_billing_date >= subscription.expiry_date:
            if not subscription.auto_renew or subscription.plan.auto_close:
                subscription.status = Subscription.Status.CLOSED
                subscription.cancellation_reason = "Expired and auto-closed at end of period."

        subscription.save(update_fields=['next_billing_date', 'status', 'cancellation_reason', 'updated_at'])

        # 5. Audit Logging
        BillingEvent.objects.create(
            subscription=subscription,
            event_type='INVOICE_GENERATED',
            status=BillingEvent.Status.SUCCESS,
            billing_period_start=period_start,
            billing_period_end=period_end,
            invoice_id=invoice.id,
            details=f"Invoice {invoice.invoice_number} created for ${invoice.total_amount} {invoice.currency}."
        )

        SubscriptionEvent.objects.create(
            subscription=subscription,
            event_type='BILLED',
            actor_email='system_billing_engine',
            details=f"Billed cycle {period_start} to {period_end}. Invoice: {invoice.invoice_number}."
        )

        return invoice, "Success"

def run_recurring_billing_batch(billing_date: date = None, subscription_ids: list = None) -> dict:
    """
    Executes a complete batch recurring billing run.
    Evaluates all subscriptions due on or before `billing_date`.
    """
    target_date = billing_date or date.today()
    qs = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        next_billing_date__lte=target_date
    )
    if subscription_ids:
        qs = qs.filter(id__in=subscription_ids)

    total_evaluated = qs.count()
    invoices_created = 0
    skipped_duplicates = 0
    errors = []
    generated_invoices = []

    for sub in qs:
        try:
            invoice, message = process_subscription_billing(sub.id, target_date)
            if invoice and message == "Success":
                invoices_created += 1
                generated_invoices.append(invoice.invoice_number)
            elif "Skipped" in message:
                skipped_duplicates += 1
        except Exception as e:
            errors.append(f"Subscription {sub.subscription_number}: {str(e)}")
            BillingEvent.objects.create(
                subscription=sub,
                event_type='RUN_FAILED',
                status=BillingEvent.Status.FAILED,
                details=f"Billing error: {str(e)}"
            )

    return {
        "billing_date": str(target_date),
        "total_evaluated": total_evaluated,
        "invoices_created": invoices_created,
        "skipped_duplicates": skipped_duplicates,
        "generated_invoices": generated_invoices,
        "errors": errors
    }
