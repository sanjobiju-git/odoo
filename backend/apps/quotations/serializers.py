from rest_framework import serializers
from .models import Quotation, QuotationLine, QuotationTemplate

class QuotationLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True, default='')

    class Meta:
        model = QuotationLine
        fields = [
            'id', 'product', 'product_name', 'plan', 'plan_name', 'description',
            'quantity', 'unit_price', 'tax_rate', 'tax_amount', 'discount_rule',
            'discount_amount', 'subtotal', 'total_amount'
        ]
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount']

class QuotationSerializer(serializers.ModelSerializer):
    lines = QuotationLineSerializer(many=True, required=False)
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_email = serializers.CharField(source='customer.billing_email', read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'quotation_number', 'customer', 'customer_name', 'customer_email',
            'template', 'status', 'valid_until', 'currency', 'subtotal', 'tax_total',
            'discount_total', 'total_amount', 'notes', 'converted_subscription_id',
            'lines', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'quotation_number', 'subtotal', 'tax_total', 'discount_total', 'total_amount', 'converted_subscription_id', 'created_at', 'updated_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        validated_data['created_by'] = self.context['request'].user
        quotation = Quotation.objects.create(**validated_data)
        for line in lines_data:
            QuotationLine.objects.create(quotation=quotation, **line)
        quotation.recalculate_totals()
        return quotation

    def update(self, instance, validated_data):
        lines_data = validated_data.pop('lines', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines_data is not None:
            instance.lines.all().delete()
            for line in lines_data:
                QuotationLine.objects.create(quotation=instance, **line)
            instance.recalculate_totals()
        return instance

class QuotationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationTemplate
        fields = ['id', 'name', 'description', 'default_validity_days', 'default_notes', 'is_active', 'created_at']
