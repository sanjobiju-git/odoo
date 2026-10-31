from rest_framework import serializers
from .models import Payment, ReconciliationRecord

class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'invoice_number', 'customer', 'customer_name',
            'amount', 'currency', 'payment_method', 'payment_date',
            'transaction_reference', 'status', 'notes', 'is_reconciled',
            'reconciled_at', 'created_at'
        ]
        read_only_fields = ['id', 'customer', 'is_reconciled', 'reconciled_at', 'created_at']

    def validate(self, attrs):
        invoice = attrs.get('invoice')
        amount = attrs.get('amount')
        if invoice and invoice.status == 'CANCELLED':
            raise serializers.ValidationError("Cannot record payment against a cancelled invoice.")
        if amount and amount <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return attrs

class ReconciliationRecordSerializer(serializers.ModelSerializer):
    matched_payment_ref = serializers.CharField(source='matched_payment.transaction_reference', read_only=True, default='')

    class Meta:
        model = ReconciliationRecord
        fields = [
            'id', 'statement_reference', 'statement_date', 'amount',
            'matched_payment', 'matched_payment_ref', 'status', 'review_notes', 'created_at'
        ]
