from rest_framework import serializers
from .models import Subscription, SubscriptionLine, SubscriptionEvent

class SubscriptionEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionEvent
        fields = ['id', 'event_type', 'actor_email', 'details', 'created_at']

class SubscriptionLineSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True, default='')

    class Meta:
        model = SubscriptionLine
        fields = [
            'id', 'product', 'product_name', 'plan', 'plan_name', 'description',
            'quantity', 'unit_price', 'tax_rate', 'tax_amount', 'discount_rule',
            'discount_amount', 'subtotal', 'total_amount'
        ]
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'discount_amount', 'total_amount']

class SubscriptionSerializer(serializers.ModelSerializer):
    lines = SubscriptionLineSerializer(many=True, required=False)
    events = SubscriptionEventSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_email = serializers.CharField(source='customer.billing_email', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'subscription_number', 'customer', 'customer_name', 'customer_email',
            'plan', 'plan_name', 'status', 'start_date', 'expiry_date', 'next_billing_date',
            'billing_frequency', 'payment_terms_days', 'currency', 'subtotal', 'tax_amount',
            'discount_amount', 'total_amount', 'auto_renew', 'cancellation_reason', 'notes',
            'lines', 'events', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subscription_number', 'created_at', 'updated_at']

    def create(self, validated_data):
        lines_data = validated_data.pop('lines', [])
        subscription = Subscription.objects.create(**validated_data)
        if lines_data:
            for line in lines_data:
                SubscriptionLine.objects.create(subscription=subscription, **line)
        else:
            # Auto-create line based on selected plan
            plan = subscription.plan
            SubscriptionLine.objects.create(
                subscription=subscription,
                product=plan.product,
                plan=plan,
                quantity=plan.minimum_quantity,
                unit_price=plan.plan_price,
                subtotal=plan.plan_price,
                total_amount=plan.plan_price,
                description=f"{plan.name} - {plan.billing_frequency}"
            )
            subscription.subtotal = plan.plan_price
            subscription.total_amount = plan.plan_price
            subscription.save(update_fields=['subtotal', 'total_amount'])

        SubscriptionEvent.objects.create(
            subscription=subscription,
            event_type='CREATED',
            actor_email=self.context['request'].user.email,
            details=f"Subscription created with plan {subscription.plan.name}."
        )
        return subscription
