import uuid
from decimal import Decimal
from django.db import models

class Product(models.Model):
    class ProductType(models.TextChoices):
        SOFTWARE = 'SOFTWARE', 'Software'
        SERVICE = 'SERVICE', 'Service'
        ADDON = 'ADDON', 'Add-on'
        HARDWARE = 'HARDWARE', 'Hardware'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        ARCHIVED = 'ARCHIVED', 'Archived'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, db_index=True)
    code = models.CharField(max_length=50, unique=True, help_text="Product Code / Slug")
    product_type = models.CharField(max_length=30, choices=ProductType.choices, default=ProductType.SOFTWARE)
    sales_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Base Sales Price")
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text="Internal Cost Price")
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class ProductVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=150, help_text="e.g. Standard, Premium, Odoo Integration")
    sku = models.CharField(max_length=80, unique=True)
    price_adjustment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Adjustment added to product base sales price (can be negative or positive)"
    )
    attributes = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    @property
    def effective_price(self):
        return self.product.sales_price + self.price_adjustment

    def __str__(self):
        return f"{self.product.name} - {self.name} (Adj: {self.price_adjustment})"
