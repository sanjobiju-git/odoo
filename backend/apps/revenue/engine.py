from decimal import Decimal
from datetime import date, timedelta
from apps.subscriptions.models import Subscription
from apps.customers.models import Customer
from apps.plans.models import SubscriptionPlan

def get_current_baseline_metrics() -> dict:
    """
    Authoritative calculation of current baseline metrics from the live database.
    Normalizes all active subscriptions to MRR regardless of billing cadence.
    """
    active_subs = Subscription.objects.filter(status=Subscription.Status.ACTIVE)
    customer_count = Customer.objects.filter(subscriptions__status=Subscription.Status.ACTIVE).distinct().count()

    total_mrr = Decimal('0.00')
    for sub in active_subs:
        price = sub.total_amount
        freq = sub.billing_frequency
        if freq == SubscriptionPlan.BillingFrequency.DAILY:
            sub_mrr = price * Decimal('30.00')
        elif freq == SubscriptionPlan.BillingFrequency.WEEKLY:
            sub_mrr = price * Decimal('4.33')
        elif freq == SubscriptionPlan.BillingFrequency.YEARLY:
            sub_mrr = price / Decimal('12.00')
        else:  # MONTHLY
            sub_mrr = price
        total_mrr += sub_mrr

    total_mrr = round(total_mrr, 2)
    total_arr = round(total_mrr * Decimal('12.00'), 2)
    active_subs_count = active_subs.count()

    # Calculate average revenue per user (ARPU)
    arpu = round(total_mrr / Decimal(active_subs_count), 2) if active_subs_count > 0 else Decimal('150.00')

    return {
        "baseline_mrr": total_mrr,
        "baseline_arr": total_arr,
        "active_subscribers": active_subs_count,
        "active_customers": customer_count,
        "current_arpu": arpu
    }

def run_revenue_simulation(
    growth_rate_pct: Decimal = Decimal('5.00'),
    churn_rate_pct: Decimal = Decimal('3.00'),
    price_change_pct: Decimal = Decimal('0.00'),
    discount_change_pct: Decimal = Decimal('0.00'),
    new_customers_monthly: int = 10,
    starting_baseline: dict = None
) -> dict:
    """
    12-month parametric revenue simulation engine.
    Calculates monthly recurring revenue, annual recurring revenue, and cohort changes.
    """
    baseline = starting_baseline or get_current_baseline_metrics()
    current_mrr = baseline['baseline_mrr']
    current_arr = baseline['baseline_arr']
    initial_customers = max(1, baseline['active_subscribers'])
    initial_arpu = baseline['current_arpu']

    # Adjusted ARPU based on price adjustment and discount modifier
    price_factor = Decimal('1.00') + (price_change_pct / Decimal('100.00'))
    discount_factor = Decimal('1.00') - (discount_change_pct / Decimal('100.00'))
    adjusted_arpu = round(initial_arpu * price_factor * discount_factor, 2)

    projections = []
    active_customers = Decimal(initial_customers)
    today = date.today()

    for month_idx in range(1, 13):
        proj_date = today + timedelta(days=month_idx * 30)
        month_label = proj_date.strftime("%b %Y")

        # Churn calculation for this month
        churn_count = round(active_customers * (churn_rate_pct / Decimal('100.00')))

        # Growth calculation: new customers acquired with compounding growth rate
        growth_multiplier = Decimal('1.00') + ((Decimal(month_idx - 1) * growth_rate_pct) / Decimal('100.00'))
        acquired_count = max(0, round(Decimal(new_customers_monthly) * growth_multiplier))

        # Ending active customers
        active_customers = max(Decimal('0'), active_customers - Decimal(churn_count) + Decimal(acquired_count))

        month_mrr = round(active_customers * adjusted_arpu, 2)
        month_arr = round(month_mrr * Decimal('12.00'), 2)

        projections.append({
            "month": month_idx,
            "month_label": month_label,
            "active_customers": int(active_customers),
            "churned_customers": int(churn_count),
            "new_customers": int(acquired_count),
            "projected_mrr": str(month_mrr),
            "projected_arr": str(month_arr),
            "projected_net_revenue": str(month_mrr)
        })

    final_mrr = Decimal(projections[-1]["projected_mrr"]) if projections else current_mrr
    final_arr = round(final_mrr * Decimal('12.00'), 2)
    revenue_diff = round(final_mrr - current_mrr, 2)
    pct_change = round((revenue_diff / current_mrr) * Decimal('100.00'), 2) if current_mrr > Decimal('0.00') else Decimal('0.00')

    return {
        "baseline_mrr": str(current_mrr),
        "baseline_arr": str(current_arr),
        "projected_mrr": str(final_mrr),
        "projected_arr": str(final_arr),
        "revenue_difference": str(revenue_diff),
        "percentage_change": str(pct_change),
        "projected_customer_count": projections[-1]["active_customers"] if projections else initial_customers,
        "projections": projections
    }
