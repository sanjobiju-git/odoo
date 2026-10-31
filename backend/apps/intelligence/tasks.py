from celery import shared_task
from apps.customers.models import Customer
from .engine import compute_customer_health

@shared_task
def recalculate_all_health_scores():
    """Daily Celery scheduled job to recalculate health scores across all customers."""
    customers = Customer.objects.all()
    count = 0
    for cust in customers:
        compute_customer_health(cust)
        count += 1
    return f"Computed health scores for {count} customers."
