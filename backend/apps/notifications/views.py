from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsStaffUserRole
from .models import Notification, AuditLog
from .serializers import NotificationSerializer, AuditLogSerializer
from .dashboard import get_admin_dashboard_metrics

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff_member:
            return Notification.objects.filter(models_q_filter := (permissions_filter := (user == user)))
        return Notification.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        user = request.user
        qs = Notification.objects.filter(user=user) | Notification.objects.filter(user__isnull=True)
        serializer = self.get_serializer(qs[:30], many=True)
        return Response(serializer.data)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsStaffUserRole]

class MainAdminDashboardAPIView(APIView):
    """
    Main Executive Financial Dashboard API:
    Returns accurate database-backed MRR, ARR, cash collected, and Recharts series.
    """
    permission_classes = [IsStaffUserRole]

    def get(self, request):
        range_param = request.query_params.get('range', '30d')
        metrics = get_admin_dashboard_metrics(range_param=range_param)
        return Response(metrics, status=status.HTTP_200_OK)
