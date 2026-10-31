from rest_framework import viewsets, permissions, filters
from apps.accounts.permissions import IsAdminUserRole, IsStaffUserRole
from .models import Product, ProductVariant
from .serializers import ProductSerializer, ProductVariantSerializer

class ProductViewSet(viewsets.ModelViewSet):
    """
    Product Management:
    - Admin has full CRUD.
    - Staff has read access.
    - Customer has read access to active products.
    """
    queryset = Product.objects.prefetch_related('variants').all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'sales_price', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Creating or modifying products requires Admin
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = Product.objects.prefetch_related('variants').all()
        # If customer, only show active products
        if self.request.user.is_authenticated and self.request.user.is_customer:
            qs = qs.filter(status='ACTIVE')
        product_type = self.request.query_params.get('product_type')
        if product_type:
            qs = qs.filter(product_type=product_type)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.select_related('product').all()
    serializer_class = ProductVariantSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    def get_queryset(self):
        qs = ProductVariant.objects.select_related('product').all()
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs
