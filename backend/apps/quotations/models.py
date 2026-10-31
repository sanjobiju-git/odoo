import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.db import models, transaction
from django.conf import settings
from apps.customers.models import Customer
from apps.products.models import Product
from apps.plans.models import SubscriptionPlan
from apps.taxes.models import TaxRule
from apps.discounts.models import DiscountRule

class QuotationTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    default_validity_days = models.PositiveIntegerField(default=30)
    default_notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Quotation(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SENT = 'SENT', 'Sent'
        APPROVED = 'APPROVED', 'Approved'
        CONVERTED = 'CONVERTED', 'Converted to Subscription'
        EXPIRED = 'EXPIRED', 'Expired'
        REJECTED = 'REJECTED', 'Rejected'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quotation_number = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='quotations')
    template = models.ForeignKey(QuotationTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    valid_until = models.DateField()
    currency = models.CharField(max_length=3, default='USD')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    converted_subscription_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            short_id = str(uuid.uuid4())[:8].upper()
            self.quotation_number = f"QUO-{short_id}"
        if not self.valid_until:
            self.valid_until = date.today() + timedelta(days=30)
        super().save(*args, **kwargs)

    def recalculate_totals(self):
        """Recalculate subtotal, tax, discount, and total from line items using Decimal arithmetic."""
        subtotal = sum((line.subtotal for line in self.lines.all()), Decimal('0.00'))
        tax_total = sum((line.tax_amount for line in self.lines.all()), Decimal('0.00'))
        discount_total = sum((line.discount_amount for line in self.lines.all()), Decimal('0.00'))
        total_amount = sum((line.total_amount for line in self.lines.all()), Decimal('0.00'))

        self.subtotal = round(subtotal, 2)
        self.tax_total = round(tax_total, 2)
        self.discount_total = round(discount_total, 2)
        self.total_amount = round(total_amount, 2)
        self.save(update_fields=['subtotal', 'tax_total', 'discount_total', 'total_amount', 'updated_at'])

    def convert_to_subscription(self, start_date=None):
        """Atomic conversion from Quotation into active/confirmed Subscription."""
        from apps.subscriptions.models import Subscription, SubscriptionLine, SubscriptionEvent
        from apps.plans.utils import calculate_next_billing_date

        if self.status in [self.Status.CONVERTED, self.Status.EXPIRED, self.Status.REJECTED]:
            raise ValueError(f"Quotation cannot be converted from status {self.status}.")

        with transaction.atomic():
            first_line = self.lines.filter(plan__isnull=False).first()
            if not first_line:
                raise ValueError("Quotation must have at least one line with an associated Subscription Plan.")

            plan = first_line.plan
            effective_start = start_date or date.today()
            next_billing = calculate_next_billing_date(effective_start, plan.billing_frequency)

            subscription = Subscription.objects.create(
                customer=self.customer,
                plan=plan,
                status=Subscription.Status.CONFIRMED,
                start_date=effective_start,
                next_billing_date=next_billing,
                billing_frequency=plan.billing_frequency,
                currency=self.currency,
                subtotal=self.subtotal,
                tax_amount=self.tax_total,
                discount_amount=self.discount_total,
                total_amount=self.total_amount,
                payment_terms_days=self.customer.payment_terms_days,
                notes=f"Converted from Quotation {self.quotation_number}. {self.notes}".strip()
            )

            # Copy lines
            for line in self.lines.all():
                SubscriptionLine.objects.create(
                    subscription=subscription,
                    product=line.product,
                    plan=line.plan,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    tax_rate=line.tax_rate,
                    tax_amount=line.tax_amount,
                    discount_rule=line.discount_rule,
                    discount_amount=line.discount_amount,
                    subtotal=line.subtotal,
                    total_amount=line.total_amount,
                    description=line.description
                )

            # Mark quotation as converted
            self.status = self.Status.CONVERTED
            self.converted_subscription_id = subscription.id
            self.save(update_fields=['status', 'converted_subscription_id', 'updated_at'])

            SubscriptionEvent.objects.create(
                subscription=subscription,
                event_type='CONVERTED_FROM_QUOTATION',
                actor_email=self.created_by.email if self.created_by else 'system',
                details=f"Quotation {self.quotation_number} converted to subscription {subscription.subscription_number}."
            )

            return subscription

    def __str__(self):
        return f"{self.quotation_number} - {self.customer.company_name} (${self.total_amount})"

class QuotationLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=255, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_rate = models.ForeignKey(TaxRule, on_delete=models.SET_NULL, null=True, blank=True)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_rule = models.ForeignKey(DiscountRule, on_delete=models.SET_NULL, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        # Calculate subtotal = quantity * unit_price
        self.subtotal = round(Decimal(self.quantity) * self.unit_price, 2)
        # Calculate discount if rule attached
        if self.discount_rule:
            self.discount_amount = self.discount_rule.calculate_discount(self.subtotal)
        # Taxable amount = subtotal - discount
        taxable = max(Decimal('0.00'), self.subtotal - self.discount_amount)
        if self.tax_rate:
            self.tax_amount = self.tax_rate.calculate_tax(taxable)
        self.total_amount = round(taxable + self.tax_amount, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity} (${self.total_amount})"
