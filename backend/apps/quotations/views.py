from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from .models import Quotation, QuotationTemplate
from .serializers import QuotationSerializer, QuotationTemplateSerializer

class QuotationViewSet(viewsets.ModelViewSet):
    """
    Quotation Management API:
    - Staff & Admin can create, edit, send, and convert quotations.
    - Customer can view and approve/reject their own quotations.
    """
    queryset = Quotation.objects.select_related('customer', 'template').prefetch_related('lines__product', 'lines__plan').all()
    serializer_class = QuotationSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Quotation.objects.select_related('customer', 'template').prefetch_related('lines__product', 'lines__plan').all()
        if user.is_customer:
            return qs.filter(customer__user=user)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'], url_path='convert')
    def convert(self, request, pk=None):
        quotation = self.get_object()
        try:
            subscription = quotation.convert_to_subscription()
            from apps.subscriptions.serializers import SubscriptionSerializer
            return Response({
                "message": f"Quotation {quotation.quotation_number} converted successfully.",
                "subscription_id": str(subscription.id),
                "subscription_number": subscription.subscription_number
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.Status.APPROVED
        quotation.save(update_fields=['status', 'updated_at'])
        return Response({"status": quotation.status, "message": "Quotation approved."})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = Quotation.Status.REJECTED
        quotation.save(update_fields=['status', 'updated_at'])
        return Response({"status": quotation.status, "message": "Quotation rejected."})

class QuotationTemplateViewSet(viewsets.ModelViewSet):
    queryset = QuotationTemplate.objects.all()
    serializer_class = QuotationTemplateSerializer
    permission_classes = [IsStaffUserRole]
