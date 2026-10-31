from decimal import Decimal
from datetime import date, timedelta
from django.db import transaction
from apps.customers.models import Customer
from apps.invoices.models import Invoice
from apps.subscriptions.models import Subscription
from .models import (
    CustomerHealthScore,
    HealthScoreHistory,
    RetentionRecommendation,
    CustomerActivity,
    SupportInteraction
)

BASE_WEIGHTS = {
    'payment_reliability': Decimal('0.30'),
    'renewal_history': Decimal('0.25'),
    'product_usage': Decimal('0.20'),
    'customer_engagement': Decimal('0.15'),
    'support_history': Decimal('0.10'),
}

def calculate_payment_reliability(customer: Customer) -> Decimal:
    """Evaluates payment history over past 180 days: on-time payments, overdue invoices, and balance due."""
    invoices = Invoice.objects.filter(customer=customer).exclude(status=Invoice.Status.CANCELLED)
    if not invoices.exists():
        return Decimal('85.00')  # Neutral starting score for new customer without billing events

    total_invoices = invoices.count()
    overdue_count = sum(1 for inv in invoices if inv.is_overdue)
    paid_count = sum(1 for inv in invoices if inv.status == Invoice.Status.PAID)

    if overdue_count > 0:
        penalty = min(Decimal('80.00'), Decimal(overdue_count * 25))
        return max(Decimal('10.00'), Decimal('100.00') - penalty)

    paid_ratio = Decimal(paid_count) / Decimal(total_invoices)
    return round(paid_ratio * Decimal('100.00'), 2)

def calculate_renewal_history(customer: Customer) -> Decimal:
    """Evaluates active subscription duration, past cancellations, and pause history."""
    subs = customer.subscriptions.all()
    if not subs.exists():
        return Decimal('75.00')

    active_count = subs.filter(status=Subscription.Status.ACTIVE).count()
    closed_count = subs.filter(status=Subscription.Status.CLOSED).count()
    paused_count = subs.filter(status=Subscription.Status.PAUSED).count()

    score = Decimal('85.00')
    if active_count >= 1:
        score += Decimal('10.00')
    if closed_count > 0:
        score -= min(Decimal('40.00'), Decimal(closed_count * 20))
    if paused_count > 0:
        score -= min(Decimal('20.00'), Decimal(paused_count * 10))

    return max(Decimal('10.00'), min(Decimal('100.00'), score))

def calculate_product_usage(customer: Customer) -> Decimal | None:
    """Evaluates product usage activity. Returns None if telemetry dataset is unconfigured."""
    activities = CustomerActivity.objects.filter(customer=customer)
    if not activities.exists():
        # Telemetry uncollected: Return None per missing-data policy
        return None

    last_30_days = activities.filter(activity_date__gte=date.today() - timedelta(days=30))
    count = sum(act.count for act in last_30_days)
    if count >= 100:
        return Decimal('95.00')
    elif count >= 30:
        return Decimal('75.00')
    elif count > 0:
        return Decimal('50.00')
    return Decimal('20.00')

def calculate_customer_engagement(customer: Customer) -> Decimal | None:
    """Evaluates login and seat engagement. Returns None if uncollected."""
    logins = CustomerActivity.objects.filter(customer=customer, activity_type='LOGIN')
    if not logins.exists():
        return None

    recent_logins = logins.filter(activity_date__gte=date.today() - timedelta(days=14)).count()
    if recent_logins >= 10:
        return Decimal('95.00')
    elif recent_logins >= 3:
        return Decimal('70.00')
    elif recent_logins >= 1:
        return Decimal('45.00')
    return Decimal('15.00')

def calculate_support_history(customer: Customer) -> Decimal | None:
    """Evaluates customer support tickets and satisfaction ratings."""
    tickets = customer.support_tickets.all()
    if not tickets.exists():
        # No support issues reported is positive
        return Decimal('90.00')

    critical_unresolved = tickets.filter(severity='CRITICAL', status='OPEN').count()
    if critical_unresolved > 0:
        return Decimal('25.00')

    resolved = tickets.filter(status='RESOLVED')
    if resolved.exists():
        ratings = [t.satisfaction_rating for t in resolved if t.satisfaction_rating is not None]
        if ratings:
            avg_rating = sum(ratings) / len(ratings)
            return round(Decimal(avg_rating) * Decimal('20.00'), 2)  # 5-star normalized to 100
        return Decimal('85.00')

    return Decimal('60.00')

def compute_customer_health(customer: Customer) -> CustomerHealthScore:
    """
    Computes explainable, weighted Health Score with dynamic weight redistribution
    for missing telemetry dimensions per system policy.
    """
    with transaction.atomic():
        p_score = calculate_payment_reliability(customer)
        r_score = calculate_renewal_history(customer)
        u_score = calculate_product_usage(customer)
        e_score = calculate_customer_engagement(customer)
        s_score = calculate_support_history(customer)

        dimensions = {
            'payment_reliability': p_score,
            'renewal_history': r_score,
            'product_usage': u_score,
            'customer_engagement': e_score,
            'support_history': s_score,
        }

        available = {k: v for k, v in dimensions.items() if v is not None}
        missing = [k for k, v in dimensions.items() if v is None]

        # Missing-Data Normalization:
        # Sum base weights of available factors and rescale so available factors sum to 1.0 (100%)
        available_weight_sum = sum(BASE_WEIGHTS[k] for k in available.keys())
        total_score = Decimal('0.00')
        for factor_name, score_val in available.items():
            normalized_weight = BASE_WEIGHTS[factor_name] / available_weight_sum
            total_score += score_val * normalized_weight

        total_score = round(max(Decimal('0.00'), min(Decimal('100.00'), total_score)), 2)

        # Categorize
        if total_score >= Decimal('80.00'):
            category = CustomerHealthScore.Category.HEALTHY
        elif total_score >= Decimal('50.00'):
            category = CustomerHealthScore.Category.NEEDS_ATTENTION
        else:
            category = CustomerHealthScore.Category.AT_RISK

        # Determine trend based on previous history
        prev_history = HealthScoreHistory.objects.filter(customer=customer).order_by('-recorded_date').first()
        trend = CustomerHealthScore.Trend.STABLE
        if prev_history:
            delta = total_score - prev_history.score
            if delta >= Decimal('3.00'):
                trend = CustomerHealthScore.Trend.IMPROVING
            elif delta <= Decimal('-3.00'):
                trend = CustomerHealthScore.Trend.DECLINING

        coverage_pct = int((len(available) / len(dimensions)) * 100)
        coverage_label = f"{coverage_pct}% Coverage ({len(available)}/5 signals)"

        # Save or update CustomerHealthScore
        health_record, _ = CustomerHealthScore.objects.update_or_create(
            customer=customer,
            defaults={
                'score': total_score,
                'category': category,
                'trend': trend,
                'payment_reliability_score': p_score,
                'renewal_history_score': r_score,
                'product_usage_score': u_score,
                'customer_engagement_score': e_score,
                'support_history_score': s_score,
                'data_coverage': coverage_label,
                'coverage_percentage': coverage_pct,
                'missing_factors': missing,
            }
        )

        # Record daily snapshot in history
        today = date.today()
        HealthScoreHistory.objects.update_or_create(
            customer=customer,
            recorded_date=today,
            defaults={'score': total_score, 'category': category}
        )

        # Generate Actionable Retention Recommendations
        generate_retention_recommendations(customer, health_record)

        return health_record

def generate_retention_recommendations(customer: Customer, health: CustomerHealthScore):
    """Generates prioritized, targeted retention actions."""
    # Clear existing unread recommendations
    RetentionRecommendation.objects.filter(customer=customer, is_dismissed=False).delete()

    if health.category == CustomerHealthScore.Category.AT_RISK:
        RetentionRecommendation.objects.create(
            customer=customer,
            title="High Churn Risk Intervention",
            description=f"Customer health has dropped to {health.score} ({health.trend}). Proactively schedule a Quarterly Business Review (QBR) and consider an annual renewal discount.",
            priority=RetentionRecommendation.Priority.URGENT
        )

    if health.payment_reliability_score and health.payment_reliability_score < Decimal('60.00'):
        RetentionRecommendation.objects.create(
            customer=customer,
            title="Payment Reliability Alert",
            description="Account has multiple overdue invoices. Contact finance contact to discuss automated card billing or adjusted payment terms.",
            priority=RetentionRecommendation.Priority.HIGH
        )

    if health.support_history_score and health.support_history_score < Decimal('50.00'):
        RetentionRecommendation.objects.create(
            customer=customer,
            title="Support Escalation Follow-Up",
            description="Customer has experienced critical or unresolved support tickets. Have customer success lead reach out directly.",
            priority=RetentionRecommendation.Priority.HIGH
        )

    if 'product_usage' in health.missing_factors:
        RetentionRecommendation.objects.create(
            customer=customer,
            title="Connect Usage Telemetry",
            description="Product usage tracking is currently unconfigured. Set up API or webhooks to track active seats and feature adoption.",
            priority=RetentionRecommendation.Priority.LOW
        )
