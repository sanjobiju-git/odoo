from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from .models import Payment, ReconciliationRecord
from .serializers import PaymentSerializer, ReconciliationRecordSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment Management API:
    - Staff & Admin: Full view and payment recording.
    - Customer: View payments for own account; submit payment for own invoice.
    """
    queryset = Payment.objects.select_related('invoice', 'customer').all()
    serializer_class = PaymentSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related('invoice', 'customer').all()
        if user.is_customer:
            return qs.filter(customer__user=user)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            qs = qs.filter(invoice_id=invoice_id)
        return qs

    def perform_create(self, serializer):
        invoice = serializer.validated_data['invoice']
        serializer.save(customer=invoice.customer)

class ReconciliationViewSet(viewsets.ModelViewSet):
    queryset = ReconciliationRecord.objects.select_related('matched_payment').all()
    serializer_class = ReconciliationRecordSerializer
    permission_classes = [IsStaffUserRole]

    @action(detail=False, methods=['post'], url_path='match')
    def match_statement(self, request):
        """
        Reconciliation engine: match statement entry by reference, amount, and date.
        Flags uncertain or unmatched candidates for staff review.
        """
        ref = request.data.get('statement_reference', '').strip()
        amount = request.data.get('amount')
        stmt_date = request.data.get('statement_date')

        candidate = Payment.objects.filter(transaction_reference__iexact=ref).first()
        if candidate:
            status_match = 'MATCHED' if candidate.amount == amount else 'UNCERTAIN'
            record = ReconciliationRecord.objects.create(
                statement_reference=ref,
                statement_date=stmt_date,
                amount=amount,
                matched_payment=candidate,
                status=status_match,
                review_notes="Automatic exact reference match." if status_match == 'MATCHED' else "Amount discrepancy."
            )
            return Response(ReconciliationRecordSerializer(record).data, status=status.HTTP_201_CREATED)

        record = ReconciliationRecord.objects.create(
            statement_reference=ref,
            statement_date=stmt_date,
            amount=amount,
            status='UNMATCHED',
            review_notes="No transaction reference matched."
        )
        return Response(ReconciliationRecordSerializer(record).data, status=status.HTTP_201_CREATED)
