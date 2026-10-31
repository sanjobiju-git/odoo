from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.plans.models import SubscriptionPlan
from apps.plans.utils import calculate_next_billing_date
from .models import Subscription, SubscriptionEvent
from .serializers import SubscriptionSerializer

class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    Subscription Lifecycle Management API:
    - Staff/Admin: Full lifecycle management across all customers.
    - Customer: View own subscriptions, request pause/resume/cancellation/upgrade.
    """
    queryset = Subscription.objects.select_related('customer', 'plan').prefetch_related('lines__product', 'lines__plan', 'events').all()
    serializer_class = SubscriptionSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Subscription.objects.select_related('customer', 'plan').prefetch_related('lines__product', 'lines__plan', 'events').all()
        if user.is_customer:
            return qs.filter(customer__user=user)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        subscription = self.get_object()
        try:
            subscription.transition_to(Subscription.Status.ACTIVE, actor_email=request.user.email)
            return Response(SubscriptionSerializer(subscription).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='pause')
    def pause(self, request, pk=None):
        subscription = self.get_object()
        try:
            subscription.transition_to(Subscription.Status.PAUSED, actor_email=request.user.email, reason=request.data.get('reason', 'Paused by user'))
            return Response(SubscriptionSerializer(subscription).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='resume')
    def resume(self, request, pk=None):
        subscription = self.get_object()
        try:
            subscription.transition_to(Subscription.Status.ACTIVE, actor_email=request.user.email, reason='Resumed')
            return Response(SubscriptionSerializer(subscription).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        subscription = self.get_object()
        reason = request.data.get('reason', 'Cancelled by customer/staff')
        try:
            subscription.transition_to(Subscription.Status.CLOSED, actor_email=request.user.email, reason=reason)
            return Response(SubscriptionSerializer(subscription).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='switch-plan')
    def switch_plan(self, request, pk=None):
        subscription = self.get_object()
        new_plan_id = request.data.get('plan_id')
        if not new_plan_id:
            return Response({"error": "plan_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

        subscription.upgrade_or_downgrade(new_plan, actor_email=request.user.email)
        return Response(SubscriptionSerializer(subscription).data)

    @action(detail=True, methods=['post'], url_path='renew')
    def renew(self, request, pk=None):
        subscription = self.get_object()
        if subscription.status not in [Subscription.Status.ACTIVE, Subscription.Status.EXPIRED]:
            return Response({"error": f"Cannot renew subscription in {subscription.status} status."}, status=status.HTTP_400_BAD_REQUEST)

        subscription.next_billing_date = calculate_next_billing_date(subscription.next_billing_date, subscription.billing_frequency)
        if subscription.status == Subscription.Status.EXPIRED:
            subscription.status = Subscription.Status.ACTIVE
        subscription.save(update_fields=['next_billing_date', 'status', 'updated_at'])

        SubscriptionEvent.objects.create(
            subscription=subscription,
            event_type='RENEWED',
            actor_email=request.user.email,
            details=f"Subscription renewed until next billing date: {subscription.next_billing_date}."
        )
        return Response(SubscriptionSerializer(subscription).data)
