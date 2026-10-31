from rest_framework import serializers
from .models import Customer

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'customer_code', 'company_name', 'billing_email', 'phone',
            'tax_id', 'currency', 'status', 'payment_terms_days', 'credit_limit',
            'billing_address', 'shipping_address', 'notes', 'is_demo',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'customer_code', 'created_at', 'updated_at']

class CustomerDetailSerializer(CustomerSerializer):
    active_subscriptions_count = serializers.SerializerMethodField()
    latest_health_score = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta(CustomerSerializer.Meta):
        fields = CustomerSerializer.Meta.fields + [
            'active_subscriptions_count', 'latest_health_score', 'total_spent'
        ]

    def get_active_subscriptions_count(self, obj):
        return obj.subscriptions.filter(status='ACTIVE').count()

    def get_latest_health_score(self, obj):
        latest = obj.health_scores.first()
        if latest:
            return {
                'score': float(latest.score),
                'category': latest.category,
                'trend': latest.trend,
                'data_coverage': latest.data_coverage,
            }
        return None

    def get_total_spent(self, obj):
        from apps.invoices.models import Invoice
        paid_invoices = obj.invoices.filter(status='PAID')
        total = sum((inv.total_amount for inv in paid_invoices), 0)
        return str(total)
