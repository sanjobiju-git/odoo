from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminUserRole
from .models import DiscountRule
from .serializers import DiscountRuleSerializer, ValidateDiscountSerializer

class DiscountRuleViewSet(viewsets.ModelViewSet):
    """
    Discount Management API:
    - ONLY Administrators can create, update, or archive discount rules.
    - Staff & Customers can validate discounts through the `/validate/` action.
    """
    queryset = DiscountRule.objects.select_related('applicable_product').all()
    serializer_class = DiscountRuleSerializer

    def get_permissions(self):
        if self.action in ['validate_code', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminUserRole()]

    @action(detail=False, methods=['post'], url_path='validate')
    def validate_code(self, request):
        serializer = ValidateDiscountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data['code'].strip().upper()
        subtotal = serializer.validated_data['subtotal']
        quantity = serializer.validated_data.get('quantity', 1)
        product_id = serializer.validated_data.get('product_id')

        try:
            rule = DiscountRule.objects.get(code__iexact=code)
        except DiscountRule.DoesNotExist:
            return Response({"valid": False, "error": f"Discount code '{code}' not found."}, status=status.HTTP_404_NOT_FOUND)

        product = None
        if product_id:
            from apps.products.models import Product
            product = Product.objects.filter(id=product_id).first()

        is_eligible, reason = rule.is_eligible(subtotal=subtotal, quantity=quantity, product=product)
        if not is_eligible:
            return Response({"valid": False, "error": reason}, status=status.HTTP_400_BAD_REQUEST)

        discount_amount = rule.calculate_discount(subtotal)
        return Response({
            "valid": True,
            "rule_id": str(rule.id),
            "code": rule.code,
            "name": rule.name,
            "discount_type": rule.discount_type,
            "discount_value": str(rule.discount_value),
            "discount_amount": str(discount_amount),
            "final_subtotal": str(subtotal - discount_amount)
        })
