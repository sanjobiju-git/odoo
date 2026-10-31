from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from .models import Customer
from .serializers import CustomerSerializer, CustomerDetailSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    """
    Customer Management API:
    - Staff & Admin have full CRUD on all customers.
    - Customers can retrieve and update only their own profile at `/api/v1/customers/me/`.
    """
    queryset = Customer.objects.all()

    def get_serializer_class(self):
        if self.action in ['retrieve', 'me']:
            return CustomerDetailSerializer
        return CustomerSerializer

    def get_permissions(self):
        if self.action in ['me']:
            return [permissions.IsAuthenticated()]
        return [IsStaffUserRole()]

    def get_queryset(self):
        qs = Customer.objects.all()
        # Filter demo vs prod if query param passed
        include_demo = self.request.query_params.get('include_demo')
        if include_demo != 'true':
            qs = qs.filter(is_demo=False)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(company_name__icontains=search) | qs.filter(billing_email__icontains=search)
        return qs

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        try:
            customer = request.user.customer_profile
        except Customer.DoesNotExist:
            return Response({"error": "No customer account linked to this user."}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'PATCH':
            serializer = CustomerSerializer(customer, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(CustomerDetailSerializer(customer).data)

        return Response(CustomerDetailSerializer(customer).data)
