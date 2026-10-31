from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Count, Q
from apps.customers.models import Customer
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.invoices.models import Invoice
from apps.payments.models import Payment
from apps.products.models import Product
from apps.plans.models import SubscriptionPlan

def get_admin_dashboard_metrics(range_param: str = '30d') -> dict:
    """
    Computes real database-backed financial and operational KPIs for the main executive dashboard.
    Distinguishes collected cash revenue from recurring MRR and recognized invoice totals.
    """
    today = date.today()

    if range_param == 'today':
        start_date = today
    elif range_param == '7d':
        start_date = today - timedelta(days=7)
    elif range_param == '90d':
        start_date = today - timedelta(days=90)
    elif range_param == 'this_year':
        start_date = date(today.year, 1, 1)
    else:  # '30d' default
        start_date = today - timedelta(days=30)

    # 1. Customer & Subscription Counts
    total_customers = Customer.objects.count()
    active_subs = Subscription.objects.filter(status=Subscription.Status.ACTIVE)
    active_subscriptions_count = active_subs.count()

    new_subs_count = Subscription.objects.filter(
        created_at__date__gte=start_date
    ).count()

    cancelled_subs_count = Subscription.objects.filter(
        status=Subscription.Status.CLOSED,
        updated_at__date__gte=start_date
    ).count()

    # 2. MRR & ARR Calculations (Normalized from active subscription catalog items)
    mrr = Decimal('0.00')
    for sub in active_subs:
        price = sub.total_amount
        freq = sub.billing_frequency
        if freq == SubscriptionPlan.BillingFrequency.DAILY:
            mrr += price * Decimal('30.00')
        elif freq == SubscriptionPlan.BillingFrequency.WEEKLY:
            mrr += price * Decimal('4.33')
        elif freq == SubscriptionPlan.BillingFrequency.YEARLY:
            mrr += price / Decimal('12.00')
        else:
            mrr += price

    mrr = round(mrr, 2)
    arr = round(mrr * Decimal('12.00'), 2)

    # 3. Revenue Collected (Actual successful cash inflow in period)
    payments_in_period = Payment.objects.filter(
        status=Payment.Status.SUCCESS,
        payment_date__date__gte=start_date
    )
    collected_sum = payments_in_period.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

    # 4. Invoices & Overdue Balances
    invoices_in_period = Invoice.objects.filter(
        invoice_date__gte=start_date
    ).exclude(status=Invoice.Status.CANCELLED)

    billed_sum = invoices_in_period.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

    outstanding_invoices = Invoice.objects.filter(
        balance_due__gt=Decimal('0.00')
    ).exclude(status__in=[Invoice.Status.PAID, Invoice.Status.CANCELLED])

    outstanding_sum = outstanding_invoices.aggregate(total=Sum('balance_due'))['total'] or Decimal('0.00')

    overdue_invoices = outstanding_invoices.filter(due_date__lt=today)
    overdue_count = overdue_invoices.count()
    overdue_sum = overdue_invoices.aggregate(total=Sum('balance_due'))['total'] or Decimal('0.00')

    # Renewal rate
    total_renewal_eval = active_subscriptions_count + cancelled_subs_count
    renewal_rate = round((Decimal(active_subscriptions_count) / Decimal(total_renewal_eval)) * Decimal('100.00'), 1) if total_renewal_eval > 0 else Decimal('100.0')

    # 5. Charts Data
    # A. Monthly Revenue Trend (Last 6 Months: Billed vs Collected)
    revenue_trend = []
    for m in range(5, -1, -1):
        target_month_date = today - timedelta(days=m * 30)
        m_start = date(target_month_date.year, target_month_date.month, 1)
        # determine next month
        if m_start.month == 12:
            m_end = date(m_start.year + 1, 1, 1)
        else:
            m_end = date(m_start.year, m_start.month + 1, 1)

        m_billed = Invoice.objects.filter(
            invoice_date__gte=m_start, invoice_date__lt=m_end
        ).exclude(status='CANCELLED').aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')

        m_collected = Payment.objects.filter(
            payment_date__date__gte=m_start, payment_date__date__lt=m_end, status='SUCCESS'
        ).aggregate(t=Sum('amount'))['t'] or Decimal('0.00')

        revenue_trend.append({
            "month": m_start.strftime("%b %Y"),
            "billed": float(m_billed),
            "collected": float(m_collected)
        })

    # B. Subscription Status Distribution
    status_counts = Subscription.objects.values('status').annotate(count=Count('id'))
    subscription_status_distribution = [
        {"name": item['status'], "value": item['count']} for item in status_counts
    ]

    # C. Revenue by Product
    product_rev = []
    for prod in Product.objects.filter(status='ACTIVE')[:6]:
        p_total = InvoiceLine.objects.filter(product=prod, invoice__status='PAID').aggregate(t=Sum('total_amount'))['t'] or Decimal('0.00')
        if p_total > Decimal('0.00'):
            product_rev.append({"name": prod.name, "value": float(p_total)})

    # D. Revenue by Plan
    plan_rev = []
    for plan in SubscriptionPlan.objects.filter(status='ACTIVE')[:6]:
        pl_subs = Subscription.objects.filter(plan=plan, status='ACTIVE').count()
        if pl_subs > 0:
            plan_rev.append({"name": plan.name, "value": float(plan.plan_price * Decimal(pl_subs))})

    # E. Payment Status Distribution
    pay_counts = Payment.objects.values('status').annotate(count=Count('id'))
    payment_status_distribution = [
        {"name": item['status'], "value": item['count']} for item in pay_counts
    ]

    return {
        "kpis": {
            "total_customers": total_customers,
            "active_subscriptions": active_subscriptions_count,
            "new_subscriptions": new_subs_count,
            "mrr": str(mrr),
            "arr": str(arr),
            "revenue_collected": str(round(collected_sum, 2)),
            "revenue_billed": str(round(billed_sum, 2)),
            "outstanding_payments": str(round(outstanding_sum, 2)),
            "overdue_invoices_count": overdue_count,
            "overdue_invoices_amount": str(round(overdue_sum, 2)),
            "subscription_cancellations": cancelled_subs_count,
            "renewal_rate": float(renewal_rate),
        },
        "charts": {
            "revenue_trend": revenue_trend,
            "subscription_status_distribution": subscription_status_distribution,
            "revenue_by_product": product_rev,
            "revenue_by_plan": plan_rev,
            "payment_status_distribution": payment_status_distribution,
        }
    }
