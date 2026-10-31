import uuid
from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from apps.customers.models import Customer
from apps.invoices.models import Invoice

class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CARD = 'CARD', 'Credit / Debit Card'
        UPI = 'UPI', 'UPI'
        OTHER = 'OTHER', 'Other'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=30, choices=PaymentMethod.choices, default=PaymentMethod.CARD)
    payment_date = models.DateTimeField(default=timezone.now, db_index=True)
    transaction_reference = models.CharField(max_length=100, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUCCESS, db_index=True)
    notes = models.TextField(blank=True)
    is_reconciled = models.BooleanField(default=False)
    reconciled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date']

    def save(self, *args, **kwargs):
        if not self.transaction_reference:
            short_id = str(uuid.uuid4())[:10].upper()
            self.transaction_reference = f"TXN-{short_id}"
        if not self.customer_id and self.invoice:
            self.customer = self.invoice.customer

        is_new = self._state.adding
        super().save(*args, **kwargs)

        # Allocate payment to invoice if SUCCESS
        if self.status == self.Status.SUCCESS:
            self.allocate_to_invoice()

    def allocate_to_invoice(self):
        with transaction.atomic():
            inv = Invoice.objects.select_for_update().get(id=self.invoice.id)
            total_successful_payments = sum(
                (p.amount for p in inv.payments.filter(status=self.Status.SUCCESS)),
                Decimal('0.00')
            )
            inv.amount_paid = total_successful_payments
            inv.balance_due = max(Decimal('0.00'), inv.total_amount - inv.amount_paid)

            if inv.balance_due == Decimal('0.00') and inv.total_amount > Decimal('0.00'):
                inv.status = Invoice.Status.PAID
            elif inv.status == Invoice.Status.DRAFT:
                inv.status = Invoice.Status.CONFIRMED

            inv.save(update_fields=['amount_paid', 'balance_due', 'status', 'updated_at'])

    def __str__(self):
        return f"{self.transaction_reference} - ${self.amount} for {self.invoice.invoice_number} ({self.status})"

class ReconciliationRecord(models.Model):
    class Status(models.TextChoices):
        MATCHED = 'MATCHED', 'Matched'
        UNCERTAIN = 'UNCERTAIN', 'Needs Review'
        UNMATCHED = 'UNMATCHED', 'Unmatched'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    statement_reference = models.CharField(max_length=100)
    statement_date = models.DateField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    matched_payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='reconciliation_entries')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNMATCHED)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Statement {self.statement_reference} (${self.amount}) - {self.status}"
