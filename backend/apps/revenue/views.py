from decimal import Decimal
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from .models import RevenueScenario
from .serializers import RevenueScenarioSerializer, SimulateRequestSerializer
from .engine import run_revenue_simulation, get_current_baseline_metrics

class RevenueScenarioViewSet(viewsets.ModelViewSet):
    """
    Saved Scenarios Management:
    Staff and Admins can view, save, and delete what-if scenarios.
    """
    queryset = RevenueScenario.objects.select_related('author').all()
    serializer_class = RevenueScenarioSerializer
    permission_classes = [IsStaffUserRole]

    def perform_create(self, serializer):
        data = serializer.validated_data
        result = run_revenue_simulation(
            growth_rate_pct=data.get('growth_rate_pct', Decimal('5.00')),
            churn_rate_pct=data.get('churn_rate_pct', Decimal('3.00')),
            price_change_pct=data.get('price_change_pct', Decimal('0.00')),
            discount_change_pct=data.get('discount_change_pct', Decimal('0.00')),
            new_customers_monthly=data.get('new_customers_monthly', 10)
        )
        serializer.save(
            author=self.request.user,
            baseline_mrr=Decimal(result['baseline_mrr']),
            projected_mrr=Decimal(result['projected_mrr']),
            baseline_arr=Decimal(result['baseline_arr']),
            projected_arr=Decimal(result['projected_arr']),
            revenue_difference=Decimal(result['revenue_difference']),
            percentage_change=Decimal(result['percentage_change']),
            projected_customer_count=result['projected_customer_count'],
            projections_data=result['projections']
        )

class RunSimulationAPIView(APIView):
    """
    Dynamic Simulation Endpoint:
    Takes slider parameters, computes live 12-month projections against active DB data.
    """
    permission_classes = [IsStaffUserRole]

    def post(self, request):
        serializer = SimulateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = run_revenue_simulation(
            growth_rate_pct=data['growth_rate_pct'],
            churn_rate_pct=data['churn_rate_pct'],
            price_change_pct=data['price_change_pct'],
            discount_change_pct=data['discount_change_pct'],
            new_customers_monthly=data['new_customers_monthly']
        )

        scenario_id = None
        if data.get('save_scenario'):
            scenario = RevenueScenario.objects.create(
                title=data.get('title', 'Saved Simulation'),
                scenario_type=data.get('scenario_type', RevenueScenario.ScenarioType.CUSTOM),
                author=request.user,
                growth_rate_pct=data['growth_rate_pct'],
                churn_rate_pct=data['churn_rate_pct'],
                price_change_pct=data['price_change_pct'],
                discount_change_pct=data['discount_change_pct'],
                new_customers_monthly=data['new_customers_monthly'],
                baseline_mrr=Decimal(result['baseline_mrr']),
                projected_mrr=Decimal(result['projected_mrr']),
                baseline_arr=Decimal(result['baseline_arr']),
                projected_arr=Decimal(result['projected_arr']),
                revenue_difference=Decimal(result['revenue_difference']),
                percentage_change=Decimal(result['percentage_change']),
                projected_customer_count=result['projected_customer_count'],
                projections_data=result['projections']
            )
            scenario_id = str(scenario.id)

        result['scenario_id'] = scenario_id
        return Response(result, status=status.HTTP_200_OK)

class ComparePresetsAPIView(APIView):
    """
    Multi-Scenario Comparative Visualizer:
    Calculates Baseline, Optimistic, Expected, and Pessimistic scenarios simultaneously.
    """
    permission_classes = [IsStaffUserRole]

    def get(self, request):
        baseline_metrics = get_current_baseline_metrics()

        # 1. Baseline (Current organic run)
        baseline_res = run_revenue_simulation(
            growth_rate_pct=Decimal('0.00'),
            churn_rate_pct=Decimal('3.00'),
            price_change_pct=Decimal('0.00'),
            discount_change_pct=Decimal('0.00'),
            new_customers_monthly=5,
            starting_baseline=baseline_metrics
        )

        # 2. Optimistic (High growth, low churn, price hike)
        optimistic_res = run_revenue_simulation(
            growth_rate_pct=Decimal('15.00'),
            churn_rate_pct=Decimal('1.50'),
            price_change_pct=Decimal('8.00'),
            discount_change_pct=Decimal('-2.00'),
            new_customers_monthly=25,
            starting_baseline=baseline_metrics
        )

        # 3. Expected (Moderate growth, standard churn)
        expected_res = run_revenue_simulation(
            growth_rate_pct=Decimal('8.00'),
            churn_rate_pct=Decimal('3.50'),
            price_change_pct=Decimal('2.00'),
            discount_change_pct=Decimal('0.00'),
            new_customers_monthly=15,
            starting_baseline=baseline_metrics
        )

        # 4. Pessimistic (High churn, price discount)
        pessimistic_res = run_revenue_simulation(
            growth_rate_pct=Decimal('1.00'),
            churn_rate_pct=Decimal('8.00'),
            price_change_pct=Decimal('-5.00'),
            discount_change_pct=Decimal('5.00'),
            new_customers_monthly=5,
            starting_baseline=baseline_metrics
        )

        return Response({
            "current_baseline": baseline_metrics,
            "scenarios": {
                "baseline": baseline_res,
                "optimistic": optimistic_res,
                "expected": expected_res,
                "pessimistic": pessimistic_res
            }
        })
