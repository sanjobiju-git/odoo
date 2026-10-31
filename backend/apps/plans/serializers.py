from rest_framework import serializers
from .models import SubscriptionPlan, PlanFeature

class PlanFeatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanFeature
        fields = ['id', 'feature_text', 'is_included', 'sort_order']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    features = PlanFeatureSerializer(many=True, required=False)
    product_name = serializers.CharField(source='product.name', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True, default='')

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'code', 'product', 'product_name', 'variant', 'variant_name',
            'description', 'billing_frequency', 'plan_price', 'setup_fee',
            'trial_period_days', 'minimum_quantity', 'available_from', 'available_until',
            'auto_close', 'allow_pause', 'allow_early_closure', 'allow_renewal',
            'status', 'features', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        features_data = validated_data.pop('features', [])
        plan = SubscriptionPlan.objects.create(**validated_data)
        for index, feature in enumerate(features_data):
            PlanFeature.objects.create(plan=plan, sort_order=index, **feature)
        return plan

    def update(self, instance, validated_data):
        features_data = validated_data.pop('features', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if features_data is not None:
            instance.features.all().delete()
            for index, feature in enumerate(features_data):
                PlanFeature.objects.create(plan=instance, sort_order=index, **feature)
        return instance
