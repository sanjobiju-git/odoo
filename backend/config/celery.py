import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('subsight')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Scheduled Tasks
app.conf.beat_schedule = {
    'process-recurring-billing-daily': {
        'task': 'apps.billing.tasks.run_daily_recurring_billing',
        'schedule': crontab(hour=0, minute=0),  # Midnight UTC every day
    },
    'update-customer-health-scores-daily': {
        'task': 'apps.intelligence.tasks.recalculate_all_health_scores',
        'schedule': crontab(hour=1, minute=0),  # 1 AM UTC every day
    },
    'check-expiring-subscriptions-daily': {
        'task': 'apps.subscriptions.tasks.check_expiring_subscriptions',
        'schedule': crontab(hour=2, minute=0),
    },
}
