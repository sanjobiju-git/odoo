from datetime import datetime
from rest_framework.views import APIView
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from .models import BillingEvent
from .engine import run_recurring_billing_batch
from rest_framework import serializers

class BillingEventSerializer(serializers.ModelSerializer):
    subscription_number = serializers.CharField(source='subscription.subscription_number', read_only=True, default='')

    class Meta:
        model = BillingEvent
        fields = [
            'id', 'subscription', 'subscription_number', 'event_type',
            'status', 'billing_period_start', 'billing_period_end',
            'invoice_id', 'details', 'created_at'
        ]

class RunBillingView(APIView):
    """
    Manual Recurring Billing Trigger:
    Authorized staff/admins can trigger a recurring billing execution for today or a target date.
    """
    permission_classes = [IsStaffUserRole]

    def post(self, request):
        billing_date_str = request.data.get('billing_date')
        subscription_ids = request.data.get('subscription_ids', [])

        target_date = None
        if billing_date_str:
            try:
                target_date = datetime.strptime(billing_date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Invalid date format. Expected YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        result = run_recurring_billing_batch(billing_date=target_date, subscription_ids=subscription_ids)
        return Response(result, status=status.HTTP_200_OK)

class BillingEventListView(generics.ListAPIView):
    permission_classes = [IsStaffUserRole]
    queryset = BillingEvent.objects.select_related('subscription').all()
    serializer_class = BillingEventSerializer
