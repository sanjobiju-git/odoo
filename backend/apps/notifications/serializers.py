from rest_framework import serializers
from .models import Notification, AuditLog

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 'link', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = ['id', 'actor_email', 'action', 'entity_name', 'entity_id', 'details', 'previous_value', 'new_value', 'created_at']
        read_only_fields = ['id', 'created_at']
