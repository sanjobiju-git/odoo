from rest_framework import viewsets, permissions
from apps.accounts.permissions import IsAdminUserRole
from .models import TaxRule
from .serializers import TaxRuleSerializer

class TaxRuleViewSet(viewsets.ModelViewSet):
    """
    Tax Rules Management:
    - Admin has full CRUD.
    - Staff & Customers have read-only access.
    """
    queryset = TaxRule.objects.prefetch_related('applicable_products').all()
    serializer_class = TaxRuleSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = TaxRule.objects.prefetch_related('applicable_products').all()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs
