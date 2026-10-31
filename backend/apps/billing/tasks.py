from celery import shared_task
from .engine import run_recurring_billing_batch

@shared_task
def run_daily_recurring_billing():
    """Celery scheduled task executed daily at midnight UTC."""
    result = run_recurring_billing_batch()
    return result
