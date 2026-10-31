import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings

class RevenueScenario(models.Model):
    class ScenarioType(models.TextChoices):
        BASELINE = 'BASELINE', 'Baseline'
        OPTIMISTIC = 'OPTIMISTIC', 'Optimistic'
        EXPECTED = 'EXPECTED', 'Expected'
        PESSIMISTIC = 'PESSIMISTIC', 'Pessimistic'
        CUSTOM = 'CUSTOM', 'Custom'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=150, db_index=True)
    description = models.TextField(blank=True)
    scenario_type = models.CharField(max_length=30, choices=ScenarioType.choices, default=ScenarioType.CUSTOM)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    # Parametric Inputs
    growth_rate_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('5.00'), help_text="Monthly customer acquisition growth %")
    churn_rate_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('3.00'), help_text="Monthly customer churn %")
    price_change_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Price adjustment %")
    discount_change_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text="Discount adjustment %")
    new_customers_monthly = models.PositiveIntegerField(default=10, help_text="Fixed monthly new customer base")
    # Computed Outputs
    baseline_mrr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    projected_mrr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    baseline_arr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    projected_arr = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    revenue_difference = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    percentage_change = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    projected_customer_count = models.PositiveIntegerField(default=0)
    projections_data = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.scenario_type}] (MRR: ${self.projected_mrr})"
