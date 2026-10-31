import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.db import models
from apps.customers.models import Customer
from apps.subscriptions.models import Subscription
from apps.products.models import Product

class Invoice(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True, blank=True, db_index=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='invoices')
    subscription = models.ForeignKey(Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    billing_period_start = models.DateField(null=True, blank=True)
    billing_period_end = models.DateField(null=True, blank=True)
    invoice_date = models.DateField(default=date.today, db_index=True)
    due_date = models.DateField(db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    currency = models.CharField(max_length=3, default='USD')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    # Immutable historical customer snapshots
    customer_name_snapshot = models.CharField(max_length=200, blank=True)
    customer_email_snapshot = models.EmailField(blank=True)
    billing_address_snapshot = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['subscription', 'billing_period_start', 'billing_period_end'],
                condition=~models.Q(status='CANCELLED') & models.Q(subscription__isnull=False),
                name='unique_subscription_billing_period_invoice'
            )
        ]

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            short_id = str(uuid.uuid4())[:8].upper()
            self.invoice_number = f"INV-{short_id}"
        if not self.due_date:
            days = self.customer.payment_terms_days if self.customer else 30
            self.due_date = self.invoice_date + timedelta(days=days)
        if not self.customer_name_snapshot and self.customer:
            self.customer_name_snapshot = self.customer.company_name
            self.customer_email_snapshot = self.customer.billing_email
            self.billing_address_snapshot = self.customer.billing_address

        self.balance_due = max(Decimal('0.00'), self.total_amount - self.amount_paid)

        if self.amount_paid >= self.total_amount and self.total_amount > Decimal('0.00'):
            self.status = self.Status.PAID
        elif self.status == self.Status.PAID and self.balance_due > Decimal('0.00'):
            self.status = self.Status.CONFIRMED

        super().save(*args, **kwargs)

    @property
    def is_overdue(self) -> bool:
        return self.status != self.Status.PAID and self.status != self.Status.CANCELLED and self.due_date < date.today() and self.balance_due > Decimal('0.00')

    @property
    def is_partially_paid(self) -> bool:
        return Decimal('0.00') < self.amount_paid < self.total_amount

    def recalculate_totals(self):
        subtotal = sum((line.subtotal for line in self.lines.all()), Decimal('0.00'))
        tax_total = sum((line.tax_amount for line in self.lines.all()), Decimal('0.00'))
        discount_total = sum((line.discount_amount for line in self.lines.all()), Decimal('0.00'))
        total_amount = sum((line.total_amount for line in self.lines.all()), Decimal('0.00'))

        self.subtotal = round(subtotal, 2)
        self.tax_total = round(tax_total, 2)
        self.discount_total = round(discount_total, 2)
        self.total_amount = round(total_amount, 2)
        self.balance_due = max(Decimal('0.00'), self.total_amount - self.amount_paid)
        self.save(update_fields=['subtotal', 'tax_total', 'discount_total', 'total_amount', 'balance_due', 'updated_at'])

    def __str__(self):
        return f"{self.invoice_number} - {self.customer_name_snapshot} (${self.total_amount}) [{self.status}]"

class InvoiceLine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='lines')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_name_snapshot = models.CharField(max_length=100, blank=True)
    tax_rate_snapshot = models.DecimalField(max_digits=6, decimal_places=4, default=Decimal('0.0000'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    def save(self, *args, **kwargs):
        self.subtotal = round(Decimal(self.quantity) * self.unit_price, 2)
        taxable = max(Decimal('0.00'), self.subtotal - self.discount_amount)
        if self.tax_rate_snapshot > Decimal('0.0000'):
            self.tax_amount = round((taxable * self.tax_rate_snapshot) / Decimal('100.00'), 2)
        self.total_amount = round(taxable + self.tax_amount, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} x {self.quantity} (${self.total_amount})"
