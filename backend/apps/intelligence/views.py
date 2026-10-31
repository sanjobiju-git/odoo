from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from apps.customers.models import Customer
from .models import CustomerHealthScore, RetentionRecommendation
from .serializers import CustomerHealthScoreSerializer, RetentionRecommendationSerializer
from .engine import compute_customer_health

class CustomerHealthScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Subscription Health Score API:
    - Lists and filters customer health scores.
    - Detailed breakdown with available data coverage.
    - Trigger recalculation for a customer.
    """
    queryset = CustomerHealthScore.objects.select_related('customer').prefetch_related('customer__recommendations', 'customer__health_history').all()
    serializer_class = CustomerHealthScoreSerializer
    permission_classes = [IsStaffUserRole]

    def get_queryset(self):
        qs = CustomerHealthScore.objects.select_related('customer').prefetch_related('customer__recommendations', 'customer__health_history').all()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        ordering = self.request.query_params.get('ordering', 'score')
        if ordering in ['score', '-score', 'computed_at', '-computed_at']:
            qs = qs.order_by(ordering)
        return qs

    @action(detail=False, methods=['post'], url_path='recalculate-all')
    def recalculate_all(self, request):
        customers = Customer.objects.all()
        for cust in customers:
            compute_customer_health(cust)
        return Response({"message": f"Successfully recalculated health scores for {customers.count()} customers."})

    @action(detail=True, methods=['post'], url_path='recalculate')
    def recalculate_single(self, request, pk=None):
        health = self.get_object()
        updated = compute_customer_health(health.customer)
        return Response(CustomerHealthScoreSerializer(updated).data)

class HealthScoreDashboardView(APIView):
    """
    Health Score Intelligence Dashboard:
    Returns aggregate distribution, risk counts, and high-risk customer radar.
    """
    permission_classes = [IsStaffUserRole]

    def get(self, request):
        scores = CustomerHealthScore.objects.select_related('customer').all()
        total_count = scores.count()

        if total_count == 0:
            # If no scores computed yet, compute for existing customers
            customers = Customer.objects.all()
            for c in customers:
                compute_customer_health(c)
            scores = CustomerHealthScore.objects.select_related('customer').all()
            total_count = scores.count()

        healthy_count = scores.filter(category='HEALTHY').count()
        attention_count = scores.filter(category='NEEDS_ATTENTION').count()
        at_risk_count = scores.filter(category='AT_RISK').count()
        avg_score = round(sum(s.score for s in scores) / total_count, 1) if total_count > 0 else 0

        # Distribution Chart Data
        distribution = [
            {"category": "Healthy", "count": healthy_count, "color": "#10b981"},
            {"category": "Needs Attention", "count": attention_count, "color": "#f59e0b"},
            {"category": "At Risk", "count": at_risk_count, "color": "#ef4444"},
        ]

        # Risk table: Customers needing attention or at risk
        risk_table_qs = scores.filter(category__in=['AT_RISK', 'NEEDS_ATTENTION']).order_by('score')[:15]
        risk_table = CustomerHealthScoreSerializer(risk_table_qs, many=True).data

        return Response({
            "average_health_score": avg_score,
            "total_customers_scored": total_count,
            "healthy_count": healthy_count,
            "attention_count": attention_count,
            "at_risk_count": at_risk_count,
            "distribution": distribution,
            "risk_table": risk_table
        })

class DismissRecommendationView(APIView):
    permission_classes = [IsStaffUserRole]

    def post(self, request, pk):
        try:
            rec = RetentionRecommendation.objects.get(id=pk)
            rec.is_dismissed = True
            rec.save(update_fields=['is_dismissed'])
            return Response({"message": "Recommendation dismissed."})
        except RetentionRecommendation.DoesNotExist:
            return Response({"error": "Recommendation not found."}, status=status.HTTP_404_NOT_FOUND)
