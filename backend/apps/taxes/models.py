import uuid
from decimal import Decimal
from django.db import models
from apps.products.models import Product

class TaxRule(models.Model):
    class TaxType(models.TextChoices):
        PERCENTAGE = 'PERCENTAGE', 'Percentage'
        FIXED = 'FIXED', 'Fixed Amount'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, db_index=True, help_text="e.g. Standard VAT 20%, GST 18%")
    code = models.CharField(max_length=50, unique=True)
    rate_percentage = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal('0.0000'),
        help_text="Percentage rate (e.g. 18.0000 for 18%)"
    )
    tax_type = models.CharField(max_length=20, choices=TaxType.choices, default=TaxType.PERCENTAGE)
    fixed_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Fixed tax amount if FIXED type")
    applicable_products = models.ManyToManyField(Product, blank=True, related_name='tax_rules', help_text="Empty means applicable to all products")
    effective_start_date = models.DateField(null=True, blank=True)
    effective_end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def calculate_tax(self, taxable_amount: Decimal) -> Decimal:
        """Calculate tax amount rounded to 2 decimal places using Decimal arithmetic."""
        if self.status != self.Status.ACTIVE:
            return Decimal('0.00')
        if self.tax_type == self.TaxType.PERCENTAGE:
            tax = (taxable_amount * self.rate_percentage) / Decimal('100.00')
            return round(tax, 2)
        elif self.tax_type == self.TaxType.FIXED:
            return round(self.fixed_amount, 2)
        return Decimal('0.00')

    def __str__(self):
        return f"{self.name} ({self.rate_percentage}%)"
