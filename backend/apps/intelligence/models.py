import uuid
from decimal import Decimal
from django.db import models
from apps.customers.models import Customer

class CustomerActivity(models.Model):
    class ActivityType(models.TextChoices):
        LOGIN = 'LOGIN', 'Platform Login'
        API_CALLS = 'API_CALLS', 'API Usage'
        FEATURE_USE = 'FEATURE_USE', 'Feature Utilized'
        SEAT_INVITE = 'SEAT_INVITE', 'Seat Assigned'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ActivityType.choices)
    count = models.PositiveIntegerField(default=1)
    activity_date = models.DateField(db_index=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-activity_date']

class SupportInteraction(models.Model):
    class Severity(models.TextChoices):
        LOW = 'LOW', 'Low'
        MEDIUM = 'MEDIUM', 'Medium'
        HIGH = 'HIGH', 'High'
        CRITICAL = 'CRITICAL', 'Critical'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        RESOLVED = 'RESOLVED', 'Resolved'
        ESCALATED = 'ESCALATED', 'Escalated'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='support_tickets')
    ticket_id = models.CharField(max_length=50)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    satisfaction_rating = models.PositiveIntegerField(null=True, blank=True, help_text="1 to 5")
    opened_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-opened_at']

class CustomerHealthScore(models.Model):
    class Category(models.TextChoices):
        HEALTHY = 'HEALTHY', 'Healthy'
        NEEDS_ATTENTION = 'NEEDS_ATTENTION', 'Needs Attention'
        AT_RISK = 'AT_RISK', 'At Risk'

    class Trend(models.TextChoices):
        IMPROVING = 'IMPROVING', 'Improving'
        STABLE = 'STABLE', 'Stable'
        DECLINING = 'DECLINING', 'Declining'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='health_score')
    score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), db_index=True)
    category = models.CharField(max_length=30, choices=Category.choices, default=Category.NEEDS_ATTENTION, db_index=True)
    trend = models.CharField(max_length=30, choices=Trend.choices, default=Trend.STABLE)
    # Component Dimension Scores (0 - 100, nullable if unavailable)
    payment_reliability_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    renewal_history_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    product_usage_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    customer_engagement_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    support_history_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    # Missing data transparency metadata
    data_coverage = models.CharField(max_length=100, default='100% Coverage')
    coverage_percentage = models.PositiveIntegerField(default=100)
    missing_factors = models.JSONField(default=list, blank=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['score']

    def __str__(self):
        return f"{self.customer.company_name} - Score: {self.score} ({self.category})"

class HealthScoreHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='health_history')
    score = models.DecimalField(max_digits=5, decimal_places=2)
    category = models.CharField(max_length=30)
    recorded_date = models.DateField(db_index=True)

    class Meta:
        ordering = ['-recorded_date']

class RetentionRecommendation(models.Model):
    class Priority(models.TextChoices):
        URGENT = 'URGENT', 'Urgent'
        HIGH = 'HIGH', 'High'
        MEDIUM = 'MEDIUM', 'Medium'
        LOW = 'LOW', 'Low'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='recommendations')
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    is_dismissed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
