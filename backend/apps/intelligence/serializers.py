from rest_framework import serializers
from .models import (
    CustomerHealthScore,
    HealthScoreHistory,
    RetentionRecommendation,
    CustomerActivity,
    SupportInteraction
)

class RetentionRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RetentionRecommendation
        fields = ['id', 'title', 'description', 'priority', 'is_dismissed', 'created_at']

class HealthScoreHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthScoreHistory
        fields = ['id', 'score', 'category', 'recorded_date']

class CustomerHealthScoreSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.company_name', read_only=True)
    customer_code = serializers.CharField(source='customer.customer_code', read_only=True)
    recommendations = RetentionRecommendationSerializer(source='customer.recommendations', many=True, read_only=True)
    history = HealthScoreHistorySerializer(source='customer.health_history', many=True, read_only=True)

    class Meta:
        model = CustomerHealthScore
        fields = [
            'id', 'customer', 'customer_name', 'customer_code', 'score',
            'category', 'trend', 'payment_reliability_score', 'renewal_history_score',
            'product_usage_score', 'customer_engagement_score', 'support_history_score',
            'data_coverage', 'coverage_percentage', 'missing_factors',
            'recommendations', 'history', 'computed_at'
        ]
        read_only_fields = ['id', 'score', 'category', 'trend', 'computed_at']

class CustomerActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerActivity
        fields = ['id', 'customer', 'activity_type', 'count', 'activity_date', 'metadata']

class SupportInteractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportInteraction
        fields = ['id', 'customer', 'ticket_id', 'severity', 'status', 'satisfaction_rating', 'opened_at', 'resolved_at']
