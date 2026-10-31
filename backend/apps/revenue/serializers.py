from rest_framework import serializers
from .models import RevenueScenario

class RevenueScenarioSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source='author.email', read_only=True, default='')

    class Meta:
        model = RevenueScenario
        fields = [
            'id', 'title', 'description', 'scenario_type', 'author', 'author_email',
            'growth_rate_pct', 'churn_rate_pct', 'price_change_pct', 'discount_change_pct',
            'new_customers_monthly', 'baseline_mrr', 'projected_mrr', 'baseline_arr',
            'projected_arr', 'revenue_difference', 'percentage_change',
            'projected_customer_count', 'projections_data', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'baseline_mrr', 'projected_mrr', 'baseline_arr', 'projected_arr',
            'revenue_difference', 'percentage_change', 'projected_customer_count',
            'projections_data', 'created_at', 'updated_at'
        ]

class SimulateRequestSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, default='Custom Simulation')
    scenario_type = serializers.CharField(required=False, default='CUSTOM')
    growth_rate_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=5.0)
    churn_rate_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=3.0)
    price_change_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    discount_change_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    new_customers_monthly = serializers.IntegerField(default=10)
    save_scenario = serializers.BooleanField(default=False)
