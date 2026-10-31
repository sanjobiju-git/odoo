import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings

class Customer(models.Model):
    class Status(models.TextChoices):
        LEAD = 'LEAD', 'Lead'
        ACTIVE = 'ACTIVE', 'Active'
        CHURNED = 'CHURNED', 'Churned'
        DELINQUENT = 'DELINQUENT', 'Delinquent'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_profile'
    )
    customer_code = models.CharField(max_length=30, unique=True, blank=True)
    company_name = models.CharField(max_length=200, db_index=True)
    billing_email = models.EmailField(db_index=True)
    phone = models.CharField(max_length=40, blank=True)
    tax_id = models.CharField(max_length=50, blank=True, help_text="VAT / GSTIN / Tax ID")
    currency = models.CharField(max_length=3, default='USD')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    payment_terms_days = models.PositiveIntegerField(default=30)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    billing_address = models.TextField(blank=True)
    shipping_address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.customer_code:
            # Generate deterministic customer code if not provided
            short_id = str(uuid.uuid4())[:8].upper()
            self.customer_code = f"CUST-{short_id}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.company_name} ({self.customer_code})"
