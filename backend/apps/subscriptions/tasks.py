from datetime import date
from celery import shared_task
from .models import Subscription, SubscriptionEvent

@shared_task
def check_expiring_subscriptions():
    """Daily check for subscriptions that have passed their expiry date."""
    today = date.today()
    expiring = Subscription.objects.filter(
        status=Subscription.Status.ACTIVE,
        expiry_date__isnull=False,
        expiry_date__lte=today,
        auto_renew=False
    )
    count = 0
    for sub in expiring:
        sub.status = Subscription.Status.EXPIRED
        sub.save(update_fields=['status', 'updated_at'])
        SubscriptionEvent.objects.create(
            subscription=sub,
            event_type='EXPIRED',
            actor_email='system_celery',
            details=f"Subscription marked as EXPIRED automatically on {today}."
        )
        count += 1
    return f"Processed {count} expiring subscriptions."
