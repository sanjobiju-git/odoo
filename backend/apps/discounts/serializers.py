from rest_framework import serializers
from .models import DiscountRule, DiscountUsage

class DiscountRuleSerializer(serializers.ModelSerializer):
    applicable_product_name = serializers.CharField(source='applicable_product.name', read_only=True, default='')

    class Meta:
        model = DiscountRule
        fields = [
            'id', 'name', 'code', 'discount_type', 'discount_value',
            'min_purchase_amount', 'min_quantity', 'start_date', 'end_date',
            'max_usage_count', 'current_usage_count', 'applicable_product',
            'applicable_product_name', 'is_subscription_wide', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'current_usage_count', 'created_at', 'updated_at']

class ValidateDiscountSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    quantity = serializers.IntegerField(default=1, required=False)
    product_id = serializers.UUIDField(required=False, allow_null=True)
