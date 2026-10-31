import uuid
from decimal import Decimal
from datetime import date
from django.db import models, transaction
from apps.customers.models import Customer
from apps.plans.models import SubscriptionPlan
from apps.products.models import Product
from apps.taxes.models import TaxRule
from apps.discounts.models import DiscountRule
from apps.plans.utils import calculate_next_billing_date

class Subscription(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        QUOTATION = 'QUOTATION', 'Quotation'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        ACTIVE = 'ACTIVE', 'Active'
        PAUSED = 'PAUSED', 'Paused'
        CLOSED = 'CLOSED', 'Closed'
        EXPIRED = 'EXPIRED', 'Expired'

    ALLOWED_TRANSITIONS = {
        Status.DRAFT: [Status.QUOTATION, Status.CONFIRMED, Status.CLOSED],
        Status.QUOTATION: [Status.CONFIRMED, Status.CLOSED],
        Status.CONFIRMED: [Status.ACTIVE, Status.CLOSED],
        Status.ACTIVE: [Status.PAUSED, Status.CLOSED, Status.EXPIRED],
        Status.PAUSED: [Status.ACTIVE, Status.CLOSED, Status.EXPIRED],
        Status.EXPIRED: [Status.ACTIVE, Status.CLOSED],
        Status.CLOSED: [],  # Terminal state
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription_number = models.CharField(max_length=50, unique=True, blank=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT, related_name='subscriptions')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    start_date = models.DateField(default=date.today)
    expiry_date = models.DateField(null=True, blank=True)
    next_billing_date = models.DateField(db_index=True)
    billing_frequency = models.CharField(max_length=20, choices=SubscriptionPlan.BillingFrequency.choices, default=SubscriptionPlan.BillingFrequency.MONTHLY)
    payment_terms_days = models.PositiveIntegerField(default=30)
    currency = models.CharField(max_length=3, default='USD')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    auto_renew = models.BooleanField(default=True)
    cancellation_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.subscription_number:
            short_id = str(uuid.uuid4())[:8].upper()
            self.subscription_number = f"SUB-{short_id}"
        if not self.next_billing_date and self.plan:
            self.next_billing_date = calculate_next_billing_date(self.start_date, self.plan.billing_frequency)
        if not self.billing_frequency and self.plan:
            self.billing_frequency = self.plan.billing_frequency
        super().save(*args, **kwargs)

    def transition_to(self, new_status: str, actor_email: str = 'system', reason: str = ''):
        """Enforces valid state machine transitions and logs audit trail."""
        valid_targets = self.ALLOWED_TRANSITIONS.get(self.status, [])
        if new_status not in valid_targets:
            raise ValueError(f"Invalid state transition from {self.status} to {new_status}. Allowed: {valid_targets}")

        prev_status = self.status
        self.status = new_status
        if reason:
            self.cancellation_reason = reason
        self.save(update_fields=['status', 'cancellation_reason', 'updated_at'])

        SubscriptionEvent.objects.create(
            subscription=self,
            event_type=f"STATUS_CHANGE_{new_status}",
            actor_email=actor_email,
            details=f"Status changed from {prev_status} to {new_status}. {reason}".strip()
        )

    def upgrade_or_downgrade(self, new_plan: SubscriptionPlan, actor_email: str = 'system'):
        """Switch subscription to a new tier/plan and adjust lines and pricing."""
        with transaction.atomic():
            old_plan_name = self.plan.name
            is_upgrade = new_plan.plan_price > self.plan.plan_price
            action_type = "UPGRADE" if is_upgrade else "DOWNGRADE"

            self.plan = new_plan
            self.billing_frequency = new_plan.billing_frequency
            self.next_billing_date = calculate_next_billing_date(date.today(), new_plan.billing_frequency)
            self.subtotal = new_plan.plan_price
            self.total_amount = new_plan.plan_price  # Recalculated with lines if any
            self.save(update_fields=['plan', 'billing_frequency', 'next_billing_date', 'subtotal', 'total_amount', 'updated_at'])

            # Update or replace line item
            line = self.lines.first()
            if line:
                line.plan = new_plan
                line.product = new_plan.product
                line.unit_price = new_plan.plan_price
                line.subtotal = new_plan.plan_price
                line.total_amount = new_plan.plan_price
                line.save()

            SubscriptionEvent.objects.create(
                subscription=self,
                event_type=f"PLAN_{action_type}",
                actor_email=actor_email,
                details=f"Plan changed from {old_plan_name} to {new_plan.name} (${new_plan.plan_price}/{new_plan.billing_frequency})."
            )

    def __str__(self):
        return f"{self.subscription_number} - {self.customer.company_name} ({self.status})"

class SubscriptionLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='lines')
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
        self.subtotal = round(Decimal(self.quantity) * self.unit_price, 2)
        if self.discount_rule:
            self.discount_amount = self.discount_rule.calculate_discount(self.subtotal)
        taxable = max(Decimal('0.00'), self.subtotal - self.discount_amount)
        if self.tax_rate:
            self.tax_amount = self.tax_rate.calculate_tax(taxable)
        self.total_amount = round(taxable + self.tax_amount, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x {self.quantity} (${self.total_amount})"

class SubscriptionEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=50, db_index=True)
    actor_email = models.CharField(max_length=150, default='system')
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} on {self.subscription.subscription_number} at {self.created_at}"
