import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

from apps.accounts.models import StaffProfile
from apps.customers.models import Customer
from apps.products.models import Product, ProductVariant
from apps.plans.models import SubscriptionPlan, PlanFeature
from apps.taxes.models import TaxRule
from apps.discounts.models import DiscountRule
from apps.subscriptions.models import Subscription, SubscriptionLine, SubscriptionEvent
from apps.invoices.models import Invoice, InvoiceLine
from apps.payments.models import Payment
from apps.intelligence.models import CustomerActivity, SupportInteraction
from apps.intelligence.engine import compute_customer_health
from apps.revenue.engine import run_revenue_simulation
from apps.revenue.models import RevenueScenario

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds realistic demonstration data for Brightloop Software (SUBSIGHT) with demo isolation."

    def add_arguments(self, parser):
        parser.add_argument('--clean', action='store_true', help='Clean demo data before seeding')

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Seeding SUBSIGHT Demonstration Dataset..."))

        with transaction.atomic():
            if options['clean']:
                self.stdout.write("Cleaning existing demo fixtures...")
                Customer.objects.filter(is_demo=True).delete()
                User.objects.filter(email__in=['admin@brightloop.com', 'staff@brightloop.com', 'customer@brightloop.com']).delete()

            # 1. Accounts
            admin_user, _ = User.objects.get_or_create(
                email='admin@brightloop.com',
                defaults={
                    'first_name': 'Sarah',
                    'last_name': 'Jenkins',
                    'role': User.Role.ADMIN,
                    'is_staff': True,
                    'is_superuser': True,
                    'is_demo_user': True
                }
            )
            admin_user.set_password('Brightloop@2026!')
            admin_user.save()

            staff_user, _ = User.objects.get_or_create(
                email='staff@brightloop.com',
                defaults={
                    'first_name': 'David',
                    'last_name': 'Kovacs',
                    'role': User.Role.STAFF,
                    'is_staff': True,
                    'is_demo_user': True
                }
            )
            staff_user.set_password('Brightloop@2026!')
            staff_user.save()
            StaffProfile.objects.get_or_create(
                user=staff_user,
                defaults={'department': 'Billing Operations', 'job_title': 'Senior Account Executive'}
            )

            customer_user, _ = User.objects.get_or_create(
                email='customer@brightloop.com',
                defaults={
                    'first_name': 'Elena',
                    'last_name': 'Rostova',
                    'role': User.Role.CUSTOMER,
                    'is_demo_user': True
                }
            )
            customer_user.set_password('Brightloop@2026!')
            customer_user.save()

            self.stdout.write(self.style.SUCCESS("[OK] Seeded Admin, Staff, and Customer user credentials."))

            # 2. Products & Variants
            p1, _ = Product.objects.get_or_create(
                code='BIZ-SOFTWARE',
                defaults={
                    'name': 'Business Software Suite',
                    'product_type': Product.ProductType.SOFTWARE,
                    'sales_price': Decimal('99.00'),
                    'cost_price': Decimal('15.00'),
                    'description': 'Unified enterprise management, operations, and inventory core.'
                }
            )
            v_standard, _ = ProductVariant.objects.get_or_create(
                sku='BIZ-SOFT-STD',
                defaults={
                    'product': p1,
                    'name': 'Standard Edition',
                    'price_adjustment': Decimal('0.00'),
                    'attributes': {'seats': 5, 'support': 'Standard email'}
                }
            )
            v_premium, _ = ProductVariant.objects.get_or_create(
                sku='BIZ-SOFT-PREM',
                defaults={
                    'product': p1,
                    'name': 'Premium Edition',
                    'price_adjustment': Decimal('50.00'),
                    'attributes': {'seats': 20, 'support': 'Priority 24/7'}
                }
            )
            v_odoo, _ = ProductVariant.objects.get_or_create(
                sku='BIZ-SOFT-ODOO',
                defaults={
                    'product': p1,
                    'name': 'Odoo Connector Edition',
                    'price_adjustment': Decimal('560.00'),
                    'attributes': {'seats': 'Unlimited', 'connector': 'Real-time two-way Odoo Sync'}
                }
            )

            p2, _ = Product.objects.get_or_create(
                code='CLOUD-ADDON',
                defaults={
                    'name': 'Cloud Infrastructure Backup & Storage',
                    'product_type': Product.ProductType.ADDON,
                    'sales_price': Decimal('29.00'),
                    'cost_price': Decimal('5.00'),
                    'description': 'Automated redundant daily backups and 500GB encrypted hot storage.'
                }
            )

            p3, _ = Product.objects.get_or_create(
                code='SEC-SUITE',
                defaults={
                    'name': 'Enterprise Security & Compliance Pack',
                    'product_type': Product.ProductType.SERVICE,
                    'sales_price': Decimal('199.00'),
                    'cost_price': Decimal('30.00'),
                    'description': 'SOC2 compliance logs, SAML SSO, audit trails, and data isolation.'
                }
            )

            self.stdout.write(self.style.SUCCESS("[OK] Seeded Products and Variants (with +INR 560 Odoo connector)."))

            # 3. Subscription Plans
            plan_monthly_std, _ = SubscriptionPlan.objects.get_or_create(
                code='PLAN-BIZ-MTH-STD',
                defaults={
                    'name': 'Business Starter (Monthly)',
                    'product': p1,
                    'variant': v_standard,
                    'billing_frequency': SubscriptionPlan.BillingFrequency.MONTHLY,
                    'plan_price': Decimal('99.00'),
                    'trial_period_days': 14,
                    'allow_pause': True,
                    'allow_renewal': True,
                    'description': 'Ideal for emerging teams needing reliable core management.'
                }
            )
            PlanFeature.objects.get_or_create(plan=plan_monthly_std, feature_text='5 Active User Seats', sort_order=0)
            PlanFeature.objects.get_or_create(plan=plan_monthly_std, feature_text='Standard Analytics', sort_order=1)

            plan_monthly_prem, _ = SubscriptionPlan.objects.get_or_create(
                code='PLAN-BIZ-MTH-PREM',
                defaults={
                    'name': 'Business Pro (Monthly)',
                    'product': p1,
                    'variant': v_premium,
                    'billing_frequency': SubscriptionPlan.BillingFrequency.MONTHLY,
                    'plan_price': Decimal('149.00'),
                    'trial_period_days': 0,
                    'allow_pause': True,
                    'allow_renewal': True,
                    'description': 'High-performance configuration with priority SLAs.'
                }
            )
            PlanFeature.objects.get_or_create(plan=plan_monthly_prem, feature_text='20 User Seats', sort_order=0)
            PlanFeature.objects.get_or_create(plan=plan_monthly_prem, feature_text='Dedicated Account Manager', sort_order=1)

            plan_annual_ent, _ = SubscriptionPlan.objects.get_or_create(
                code='PLAN-ENT-ANNUAL',
                defaults={
                    'name': 'Enterprise Suite (Yearly)',
                    'product': p1,
                    'variant': v_odoo,
                    'billing_frequency': SubscriptionPlan.BillingFrequency.YEARLY,
                    'plan_price': Decimal('7990.00'),
                    'allow_pause': False,
                    'allow_renewal': True,
                    'description': 'Complete enterprise platform including dedicated sync connector.'
                }
            )

            # 4. Tax Rules
            tax_vat, _ = TaxRule.objects.get_or_create(
                code='TAX-VAT-20',
                defaults={
                    'name': 'Standard VAT 20%',
                    'rate_percentage': Decimal('20.0000'),
                    'tax_type': TaxRule.TaxType.PERCENTAGE
                }
            )
            tax_gst, _ = TaxRule.objects.get_or_create(
                code='TAX-GST-18',
                defaults={
                    'name': 'GST 18%',
                    'rate_percentage': Decimal('18.0000'),
                    'tax_type': TaxRule.TaxType.PERCENTAGE
                }
            )

            # 5. Discount Rules (Admin configured)
            disc_welcome, _ = DiscountRule.objects.get_or_create(
                code='WELCOME20',
                defaults={
                    'name': '20% Onboarding Special',
                    'discount_type': DiscountRule.DiscountType.PERCENTAGE,
                    'discount_value': Decimal('20.00'),
                    'max_usage_count': 100,
                    'is_subscription_wide': True
                }
            )
            disc_fixed, _ = DiscountRule.objects.get_or_create(
                code='ENTERPRISE500',
                defaults={
                    'name': '$500 Contract Credit',
                    'discount_type': DiscountRule.DiscountType.FIXED,
                    'discount_value': Decimal('500.00'),
                    'min_purchase_amount': Decimal('2000.00'),
                    'max_usage_count': 20
                }
            )

            # 6. Customers
            customers_meta = [
                ("Apex Cloud Systems", "billing@apexcloud.io", "US98472911", Decimal('15000.00'), 15),
                ("Horizon Robotics Inc", "accounts@horizonrobotics.com", "GB928374112", Decimal('25000.00'), 30),
                ("Vanguard Health Tech", "finance@vanguardhealth.com", "CA1827491", Decimal('10000.00'), 30),
                ("Brightloop Customer Portal Demo", "customer@brightloop.com", "VAT-DEMO-001", Decimal('5000.00'), 15),
                ("Starlight Digital Media", "ap@starlightmedia.co", "FR82716391", Decimal('8000.00'), 30),
                ("Northstar Logistics Group", "invoices@northstarlog.com", "DE39281729", Decimal('20000.00'), 45),
            ]

            created_customers = []
            for name, email, tax_id, cred, terms in customers_meta:
                c, _ = Customer.objects.get_or_create(
                    billing_email=email,
                    defaults={
                        'company_name': name,
                        'phone': '+1 (555) 234-5678',
                        'tax_id': tax_id,
                        'credit_limit': cred,
                        'payment_terms_days': terms,
                        'billing_address': '450 Innovation Parkway, Suite 100, Tech District',
                        'is_demo': True
                    }
                )
                if email == 'customer@brightloop.com':
                    c.user = customer_user
                    c.save(update_fields=['user'])
                created_customers.append(c)

            self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(created_customers)} demo accounts."))

            # 7. Subscriptions, Invoices & Payments for each customer
            plans_cycle = [plan_monthly_prem, plan_monthly_std, plan_annual_ent, plan_monthly_prem, plan_monthly_std, plan_annual_ent]
            today = date.today()

            for idx, cust in enumerate(created_customers):
                selected_plan = plans_cycle[idx % len(plans_cycle)]
                sub_status = Subscription.Status.ACTIVE if idx != 4 else Subscription.Status.PAUSED

                sub, _ = Subscription.objects.get_or_create(
                    customer=cust,
                    plan=selected_plan,
                    defaults={
                        'status': sub_status,
                        'start_date': today - timedelta(days=90 + (idx * 15)),
                        'next_billing_date': today + timedelta(days=15 + (idx * 5)),
                        'billing_frequency': selected_plan.billing_frequency,
                        'subtotal': selected_plan.plan_price,
                        'total_amount': selected_plan.plan_price
                    }
                )
                SubscriptionLine.objects.get_or_create(
                    subscription=sub,
                    product=selected_plan.product,
                    defaults={
                        'plan': selected_plan,
                        'quantity': 1,
                        'unit_price': selected_plan.plan_price,
                        'subtotal': selected_plan.plan_price,
                        'total_amount': selected_plan.plan_price,
                        'description': f"{selected_plan.name}"
                    }
                )

                # Historical Invoices (Past cycles)
                inv_date_past = today - timedelta(days=60 + idx * 5)
                inv_paid, _ = Invoice.objects.get_or_create(
                    customer=cust,
                    subscription=sub,
                    billing_period_start=inv_date_past,
                    billing_period_end=inv_date_past + timedelta(days=30),
                    defaults={
                        'invoice_date': inv_date_past,
                        'due_date': inv_date_past + timedelta(days=cust.payment_terms_days),
                        'status': Invoice.Status.PAID,
                        'subtotal': selected_plan.plan_price,
                        'total_amount': selected_plan.plan_price,
                        'amount_paid': selected_plan.plan_price,
                        'balance_due': Decimal('0.00'),
                        'notes': 'Settled via automated credit card charge.'
                    }
                )
                InvoiceLine.objects.get_or_create(
                    invoice=inv_paid,
                    description=f"{selected_plan.name} - Billing Cycle",
                    defaults={
                        'quantity': 1,
                        'unit_price': selected_plan.plan_price,
                        'subtotal': selected_plan.plan_price,
                        'total_amount': selected_plan.plan_price
                    }
                )
                Payment.objects.get_or_create(
                    invoice=inv_paid,
                    transaction_reference=f"TXN-PAID-{idx}-{inv_paid.invoice_number}",
                    defaults={
                        'customer': cust,
                        'amount': selected_plan.plan_price,
                        'payment_method': Payment.PaymentMethod.CARD,
                        'status': Payment.Status.SUCCESS,
                        'payment_date': inv_date_past + timedelta(days=2)
                    }
                )

                # Current invoice (Some confirmed, one overdue for customer 4)
                inv_date_curr = today - timedelta(days=10 if idx != 4 else 35)
                curr_status = Invoice.Status.CONFIRMED
                inv_curr, _ = Invoice.objects.get_or_create(
                    customer=cust,
                    subscription=sub,
                    billing_period_start=inv_date_curr,
                    billing_period_end=inv_date_curr + timedelta(days=30),
                    defaults={
                        'invoice_date': inv_date_curr,
                        'due_date': inv_date_curr + timedelta(days=cust.payment_terms_days),
                        'status': curr_status,
                        'subtotal': selected_plan.plan_price,
                        'total_amount': selected_plan.plan_price,
                        'amount_paid': Decimal('0.00'),
                        'balance_due': selected_plan.plan_price,
                        'notes': 'Open invoice awaiting customer remittance.'
                    }
                )
                InvoiceLine.objects.get_or_create(
                    invoice=inv_curr,
                    description=f"{selected_plan.name} - Current Cycle",
                    defaults={
                        'quantity': 1,
                        'unit_price': selected_plan.plan_price,
                        'subtotal': selected_plan.plan_price,
                        'total_amount': selected_plan.plan_price
                    }
                )

                # Optional Activity Telemetry for Intelligence Module
                if idx in [0, 1, 3]:  # Telemetry connected for some
                    CustomerActivity.objects.get_or_create(
                        customer=cust,
                        activity_date=today - timedelta(days=2),
                        activity_type=CustomerActivity.ActivityType.LOGIN,
                        defaults={'count': 14}
                    )
                    CustomerActivity.objects.get_or_create(
                        customer=cust,
                        activity_date=today - timedelta(days=1),
                        activity_type=CustomerActivity.ActivityType.API_CALLS,
                        defaults={'count': 120}
                    )
                # Support interactions
                if idx == 4:
                    SupportInteraction.objects.get_or_create(
                        customer=cust,
                        ticket_id='TICK-4029',
                        defaults={
                            'severity': SupportInteraction.Severity.CRITICAL,
                            'status': SupportInteraction.Status.OPEN,
                            'satisfaction_rating': None
                        }
                    )

                # Compute Health Score using engine
                compute_customer_health(cust)

            self.stdout.write(self.style.SUCCESS("[OK] Seeded Subscriptions, Invoices, Payments, and Health Scores."))

            # 8. Saved Revenue Simulation Scenarios
            sim_expected = run_revenue_simulation(
                growth_rate_pct=Decimal('8.00'),
                churn_rate_pct=Decimal('3.00'),
                price_change_pct=Decimal('5.00'),
                discount_change_pct=Decimal('0.00'),
                new_customers_monthly=15
            )
            RevenueScenario.objects.get_or_create(
                title="Q1 2027 Price Optimization & Organic Growth",
                defaults={
                    'scenario_type': RevenueScenario.ScenarioType.EXPECTED,
                    'author': admin_user,
                    'growth_rate_pct': Decimal('8.00'),
                    'churn_rate_pct': Decimal('3.00'),
                    'price_change_pct': Decimal('5.00'),
                    'discount_change_pct': Decimal('0.00'),
                    'new_customers_monthly': 15,
                    'baseline_mrr': Decimal(sim_expected['baseline_mrr']),
                    'projected_mrr': Decimal(sim_expected['projected_mrr']),
                    'baseline_arr': Decimal(sim_expected['baseline_arr']),
                    'projected_arr': Decimal(sim_expected['projected_arr']),
                    'revenue_difference': Decimal(sim_expected['revenue_difference']),
                    'percentage_change': Decimal(sim_expected['percentage_change']),
                    'projected_customer_count': sim_expected['projected_customer_count'],
                    'projections_data': sim_expected['projections']
                }
            )

            self.stdout.write(self.style.SUCCESS("[OK] Seeded Baseline & What-If Revenue Simulator Scenarios."))
            self.stdout.write(self.style.SUCCESS("\nBrightloop Demonstration Database successfully initialized!"))
