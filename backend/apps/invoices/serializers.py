from rest_framework import serializers
from .models import Invoice, InvoiceLine

class InvoiceLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True, default='')

    class Meta:
        model = InvoiceLine
        fields = [
            'id', 'product', 'product_name', 'description', 'quantity',
            'unit_price', 'discount_amount', 'tax_name_snapshot',
            'tax_rate_snapshot', 'tax_amount', 'subtotal', 'total_amount'
        ]
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'total_amount']

class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineSerializer(many=True, required=False)
    is_overdue = serializers.BooleanField(read_only=True)
    is_partially_paid = serializers.BooleanField(read_only=True)
    customer_code = serializers.CharField(source='customer.customer_code', read_only=True)
    subscription_number = serializers.CharField(source='subscription.subscription_number', read_only=True, default='')

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_code', 'customer_name_snapshot',
            'customer_email_snapshot', 'billing_address_snapshot', 'subscription',
            'subscription_number', 'billing_period_start', 'billing_period_end',
            'invoice_date', 'due_date', 'status', 'currency', 'subtotal', 'tax_total',
            'discount_total', 'total_amount', 'amount_paid', 'balance_due',
            'is_overdue', 'is_partially_paid', 'notes', 'lines', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'invoice_number', 'customer_name_snapshot', 'customer_email_snapshot',
            'billing_address_snapshot', 'subtotal', 'tax_total', 'discount_total',
            'total_amount', 'amount_paid', 'balance_due', 'is_overdue', 'is_partially_paid',
            'created_at', 'updated_at'
        ]

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        invoice = Invoice.objects.create(**validated_data)
        for line in lines_data:
            InvoiceLine.objects.create(invoice=invoice, **line)
        invoice.recalculate_totals()
        return invoice
