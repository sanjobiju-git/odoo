import uuid
from decimal import Decimal
from datetime import date, timedelta
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.customers.models import Customer
from apps.products.models import Product, ProductVariant
from apps.plans.models import SubscriptionPlan
from apps.taxes.models import TaxRule
from apps.discounts.models import DiscountRule
from apps.quotations.models import Quotation, QuotationLine
from apps.subscriptions.models import Subscription, SubscriptionLine
from apps.invoices.models import Invoice, InvoiceLine
from apps.payments.models import Payment
from apps.billing.engine import process_subscription_billing, run_recurring_billing_batch
from apps.intelligence.engine import compute_customer_health
from apps.revenue.engine import run_revenue_simulation, get_current_baseline_metrics

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        email='admin_test@brightloop.com',
        password='TestPassword@2026!',
        role=User.Role.ADMIN,
        is_staff=True
    )
    return user

@pytest.fixture
def staff_user(db):
    user = User.objects.create_user(
        email='staff_test@brightloop.com',
        password='TestPassword@2026!',
        role=User.Role.STAFF,
        is_staff=True
    )
    return user

@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(
        email='customer_test@brightloop.com',
        password='TestPassword@2026!',
        role=User.Role.CUSTOMER
    )
    customer = Customer.objects.create(
        user=user,
        company_name='Test Client Corp',
        billing_email=user.email,
        payment_terms_days=30
    )
    return user, customer

@pytest.mark.django_db
def test_authentication_and_jwt_tokens(api_client, admin_user):
    """Test login endpoint returns JWT access & refresh tokens and user payload."""
    res = api_client.post('/api/v1/auth/login/', {
        'email': 'admin_test@brightloop.com',
        'password': 'TestPassword@2026!'
    })
    assert res.status_code == 200
    assert 'access' in res.data
    assert 'refresh' in res.data
    assert res.data['user']['role'] == 'ADMIN'

@pytest.mark.django_db
def test_role_permissions_discount_creation(api_client, admin_user, staff_user):
    """Test that ONLY administrators can create discount rules."""
    # 1. Staff attempts to create discount -> DENIED
    api_client.force_authenticate(user=staff_user)
    res_staff = api_client.post('/api/v1/discounts/', {
        'name': 'Staff Discount',
        'code': 'STAFF10',
        'discount_type': 'PERCENTAGE',
        'discount_value': '10.00'
    })
    assert res_staff.status_code == 403

    # 2. Admin creates discount -> ALLOWED
    api_client.force_authenticate(user=admin_user)
    res_admin = api_client.post('/api/v1/discounts/', {
        'name': 'Admin Approved Discount',
        'code': 'ADMIN20',
        'discount_type': 'PERCENTAGE',
        'discount_value': '20.00'
    })
    assert res_admin.status_code == 201
    assert DiscountRule.objects.filter(code='ADMIN20').exists()

@pytest.mark.django_db
def test_product_variant_price_calculation(db):
    """Test product and variant price calculation (e.g. base + variant adjustment)."""
    product = Product.objects.create(
        name='Business Suite',
        code='BIZ-SUITE',
        sales_price=Decimal('100.00')
    )
    variant_odoo = ProductVariant.objects.create(
        product=product,
        name='Odoo Connector',
        sku='BIZ-ODOO',
        price_adjustment=Decimal('560.00')
    )
    assert variant_odoo.effective_price == Decimal('660.00')

@pytest.mark.django_db
def test_quotation_conversion_to_subscription(db, admin_user, customer_user):
    """Test quotation creation with lines and atomic conversion to confirmed subscription."""
    _, customer = customer_user
    product = Product.objects.create(name='Cloud ERP', code='ERP-01', sales_price=Decimal('150.00'))
    plan = SubscriptionPlan.objects.create(
        name='ERP Monthly',
        code='ERP-MTH',
        product=product,
        plan_price=Decimal('150.00'),
        billing_frequency=SubscriptionPlan.BillingFrequency.MONTHLY
    )

    quotation = Quotation.objects.create(customer=customer, created_by=admin_user)
    QuotationLine.objects.create(
        quotation=quotation,
        product=product,
        plan=plan,
        quantity=2,
        unit_price=Decimal('150.00')
    )
    quotation.recalculate_totals()
    assert quotation.total_amount == Decimal('300.00')

    subscription = quotation.convert_to_subscription()
    assert subscription.status == Subscription.Status.CONFIRMED
    assert subscription.customer == customer
    assert subscription.total_amount == Decimal('300.00')
    assert quotation.status == Quotation.Status.CONVERTED

@pytest.mark.django_db
def test_subscription_lifecycle_state_machine(db, customer_user):
    """Test valid and invalid subscription transitions and upgrade."""
    _, customer = customer_user
    product = Product.objects.create(name='Service Core', code='SC-01')
    plan1 = SubscriptionPlan.objects.create(name='Tier 1', code='T1', product=product, plan_price=Decimal('50.00'))
    plan2 = SubscriptionPlan.objects.create(name='Tier 2', code='T2', product=product, plan_price=Decimal('120.00'))

    sub = Subscription.objects.create(customer=customer, plan=plan1, status=Subscription.Status.DRAFT)

    # Valid: DRAFT -> CONFIRMED -> ACTIVE
    sub.transition_to(Subscription.Status.CONFIRMED)
    assert sub.status == Subscription.Status.CONFIRMED
    sub.transition_to(Subscription.Status.ACTIVE)
    assert sub.status == Subscription.Status.ACTIVE

    # Pause & Resume
    sub.transition_to(Subscription.Status.PAUSED)
    assert sub.status == Subscription.Status.PAUSED
    sub.transition_to(Subscription.Status.ACTIVE)
    assert sub.status == Subscription.Status.ACTIVE

    # Upgrade Plan
    sub.upgrade_or_downgrade(plan2)
    assert sub.plan == plan2
    assert sub.subtotal == Decimal('120.00')

    # Close (Terminal)
    sub.transition_to(Subscription.Status.CLOSED)
    assert sub.status == Subscription.Status.CLOSED

    # Invalid: Cannot reactivate CLOSED subscription
    with pytest.raises(ValueError):
        sub.transition_to(Subscription.Status.ACTIVE)

@pytest.mark.django_db
def test_recurring_billing_duplicate_prevention(db, customer_user):
    """Test idempotent billing engine prevents generating duplicate invoices for same cycle."""
    _, customer = customer_user
    product = Product.objects.create(name='Storage Plan', code='ST-01', sales_price=Decimal('40.00'))
    plan = SubscriptionPlan.objects.create(name='Storage Monthly', code='ST-MTH', product=product, plan_price=Decimal('40.00'))

    sub = Subscription.objects.create(
        customer=customer,
        plan=plan,
        status=Subscription.Status.ACTIVE,
        next_billing_date=date.today(),
        subtotal=Decimal('40.00'),
        total_amount=Decimal('40.00')
    )
    SubscriptionLine.objects.create(subscription=sub, product=product, plan=plan, quantity=1, unit_price=Decimal('40.00'))

    # First billing execution -> Creates Invoice 1
    inv1, msg1 = process_subscription_billing(sub.id, date.today())
    assert inv1 is not None
    assert msg1 == "Success"
    assert Invoice.objects.filter(subscription=sub).count() == 1

    # Immediate second billing execution on same cycle -> Prevented as duplicate
    inv2, msg2 = process_subscription_billing(sub.id, date.today())
    assert "Skipped" in msg2
    assert Invoice.objects.filter(subscription=sub).count() == 1

@pytest.mark.django_db
def test_payment_allocation_to_invoice(db, customer_user):
    """Test partial payments and full settlement transitions invoice to PAID."""
    _, customer = customer_user
    invoice = Invoice.objects.create(
        customer=customer,
        total_amount=Decimal('200.00'),
        amount_paid=Decimal('0.00'),
        status=Invoice.Status.CONFIRMED
    )

    # 1. Partial payment of $80
    p1 = Payment.objects.create(
        invoice=invoice,
        customer=customer,
        amount=Decimal('80.00'),
        status=Payment.Status.SUCCESS
    )
    invoice.refresh_from_db()
    assert invoice.amount_paid == Decimal('80.00')
    assert invoice.balance_due == Decimal('120.00')
    assert invoice.is_partially_paid is True
    assert invoice.status == Invoice.Status.CONFIRMED

    # 2. Final payment of $120 -> Transitions to PAID
    p2 = Payment.objects.create(
        invoice=invoice,
        customer=customer,
        amount=Decimal('120.00'),
        status=Payment.Status.SUCCESS
    )
    invoice.refresh_from_db()
    assert invoice.amount_paid == Decimal('200.00')
    assert invoice.balance_due == Decimal('0.00')
    assert invoice.status == Invoice.Status.PAID

@pytest.mark.django_db
def test_subscription_health_score_missing_data_policy(db, customer_user):
    """Test health score dynamic weight re-normalization when usage telemetry is missing."""
    _, customer = customer_user
    health = compute_customer_health(customer)
    assert Decimal('0.00') <= health.score <= Decimal('100.00')
    assert health.category in ['HEALTHY', 'NEEDS_ATTENTION', 'AT_RISK']
    # Ensure missing dimensions are tracked and not zeroed out
    assert 'product_usage' in health.missing_factors
    assert health.coverage_percentage < 100

@pytest.mark.django_db
def test_what_if_revenue_simulation(db):
    """Test What-If Revenue Simulator generates 12-month projections and calculates difference."""
    res = run_revenue_simulation(
        growth_rate_pct=Decimal('10.00'),
        churn_rate_pct=Decimal('2.00'),
        price_change_pct=Decimal('5.00'),
        new_customers_monthly=20
    )
    assert 'baseline_mrr' in res
    assert 'projected_mrr' in res
    assert len(res['projections']) == 12
    assert Decimal(res['projected_mrr']) >= Decimal('0.00')
