import uuid
from decimal import Decimal
from django.db import models
from apps.products.models import Product, ProductVariant

class SubscriptionPlan(models.Model):
    class BillingFrequency(models.TextChoices):
        DAILY = 'DAILY', 'Daily'
        WEEKLY = 'WEEKLY', 'Weekly'
        MONTHLY = 'MONTHLY', 'Monthly'
        YEARLY = 'YEARLY', 'Yearly'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        ARCHIVED = 'ARCHIVED', 'Archived'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150, db_index=True)
    code = models.CharField(max_length=50, unique=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='plans')
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True, related_name='plans')
    description = models.TextField(blank=True)
    billing_frequency = models.CharField(max_length=20, choices=BillingFrequency.choices, default=BillingFrequency.MONTHLY)
    plan_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Recurring price per cycle")
    setup_fee = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="One-time setup fee")
    trial_period_days = models.PositiveIntegerField(default=0)
    minimum_quantity = models.PositiveIntegerField(default=1)
    available_from = models.DateField(null=True, blank=True)
    available_until = models.DateField(null=True, blank=True)
    auto_close = models.BooleanField(default=False, help_text="Automatically close subscription on expiration")
    allow_pause = models.BooleanField(default=True, help_text="Customer/Staff can pause subscription")
    allow_early_closure = models.BooleanField(default=True)
    allow_renewal = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.billing_frequency} - ${self.plan_price})"

class PlanFeature(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='features')
    feature_text = models.CharField(max_length=255)
    is_included = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order']

    def __str__(self):
        return f"{self.plan.name} - {self.feature_text}"
