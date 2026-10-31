from rest_framework import viewsets, permissions, filters
from apps.accounts.permissions import IsAdminUserRole
from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    """
    Subscription Plans Management:
    - Admin can create, update, and archive plans.
    - Staff and Customers can list and retrieve plans.
    """
    queryset = SubscriptionPlan.objects.select_related('product', 'variant').prefetch_related('features').all()
    serializer_class = SubscriptionPlanSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'product__name']
    ordering_fields = ['plan_price', 'name', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = SubscriptionPlan.objects.select_related('product', 'variant').prefetch_related('features').all()
        # If customer, only show active plans
        if self.request.user.is_authenticated and self.request.user.is_customer:
            qs = qs.filter(status='ACTIVE')
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        frequency = self.request.query_params.get('billing_frequency')
        if frequency:
            qs = qs.filter(billing_frequency=frequency)
        return qs
