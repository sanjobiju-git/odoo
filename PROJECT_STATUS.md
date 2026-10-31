# PROJECT STATUS: SUBSIGHT (Brightloop Software)

**Current Status**: Complete, Production-Ready, Automated Tests Passing (100%)  
**Version**: 1.0.0  
**Build Time**: 2026-10-31  

---

## 1. Executive Summary
SUBSIGHT is an enterprise-grade Subscription Management & Financial Intelligence Platform built for Brightloop Software. The platform centralizes multi-tier software products, variant pricing, quotation-to-subscription lifecycles, idempotent recurring billing runs, tax rules, admin discount engines, and payment reconciliation. In addition, it features two signature intelligence modules:
1. **Subscription Health Score (0–100)**: An explainable multi-signal churn risk detector with dynamic missing-telemetry reweighting.
2. **What-If Revenue Simulator**: An authoritative 12-month parametric financial forecasting engine backed by live database metrics.

---

## 2. Completed Modules Matrix

| Module Domain | Subsystems / Endpoints | Backend App | Frontend UI | Status |
|---|---|---|---|:---:|
| **Authentication & RBAC** | SimpleJWT tokens, User model (UUID), Roles (`ADMIN`, `STAFF`, `CUSTOMER`), password validators | `apps.accounts` | `LoginPage`, `RegisterPage` | **COMPLETE** |
| **Staff Management** | Staff accounts provisioning, department/territory assignment (Admin-only) | `apps.accounts` | `StaffManagementPage` | **COMPLETE** |
| **Customer CRM** | Customer profiles, 360° metrics, payment terms, credit limit, `/customers/me/` | `apps.customers` | `CustomersPage` | **COMPLETE** |
| **Products & Variants** | Product catalog, configurable variant pricing (e.g. +INR 560 Odoo connector) | `apps.products` | `ProductsPage` | **COMPLETE** |
| **Subscription Plans** | Daily, Weekly, Monthly, Yearly cadence, auto-close, pause & renewal rules | `apps.plans` | `PlansPage` | **COMPLETE** |
| **Quotations** | Templates, line items, taxes & discounts, 1-click Convert to Subscription | `apps.quotations` | `QuotationsPage` | **COMPLETE** |
| **Subscriptions** | State machine (DRAFT, CONFIRMED, ACTIVE, PAUSED, CLOSED), upgrade/downgrade, renewal, audit timeline | `apps.subscriptions` | `SubscriptionsPage` | **COMPLETE** |
| **Recurring Billing Engine** | Celery Beat daily cron, transactional billing, compound unique period constraints, idempotency | `apps.billing` | `InvoicesPage` (Batch Runner) | **COMPLETE** |
| **Invoice Management** | DRAFT, CONFIRMED, PAID, CANCELLED lifecycle, immutable historical snapshots, PDF/HTML download | `apps.invoices` | `InvoicesPage` (PDF modal) | **COMPLETE** |
| **Payment & Reconciliation** | Cash, Card, Bank transfer, UPI, automatic invoice balance allocation, bank statement matcher | `apps.payments` | `PaymentsPage` | **COMPLETE** |
| **Tax Management** | Configurable tax rates (VAT 20%, GST 18%, US State Tax), immutable invoice snapshotting | `apps.taxes` | `TaxesPage` | **COMPLETE** |
| **Discount Management** | Admin-only coupon rules, fixed/percentage, max usage limits, thread-safe counter, validator | `apps.discounts` | `DiscountsPage` | **COMPLETE** |
| **Subscription Health Score** | 0-100 weighted score, 5 dimensions, dynamic missing-data normalization, retention playbooks | `apps.intelligence` | `HealthScorePage` | **COMPLETE** |
| **What-If Revenue Simulator** | Parametric sliders (growth, churn, price, discount), 12mo projections, 4 presets comparison | `apps.revenue` | `SimulatorPage` | **COMPLETE** |
| **Customer Self-Service Portal** | Separate customer portal (`/portal`), my plan, upgrade requests, invoice payment, PDF download | `apps.customers` | `CustomerPortalOverview`, etc. | **COMPLETE** |
| **Executive Dashboard** | Real database-backed MRR/ARR, cash collected, overdue receivables, 5 Recharts series | `apps.notifications` | `DashboardPage` | **COMPLETE** |

---

## 3. Automated Test Verification Results

All automated test suites executed via `pytest` passing with 100% success rate:

```
tests/test_core_system.py::test_authentication_and_jwt_tokens PASSED     [ 11%]
tests/test_core_system.py::test_role_permissions_discount_creation PASSED [ 22%]
tests/test_core_system.py::test_product_variant_price_calculation PASSED [ 33%]
tests/test_core_system.py::test_quotation_conversion_to_subscription PASSED [ 44%]
tests/test_core_system.py::test_subscription_lifecycle_state_machine PASSED [ 55%]
tests/test_core_system.py::test_recurring_billing_duplicate_prevention PASSED [ 66%]
tests/test_core_system.py::test_payment_allocation_to_invoice PASSED     [ 77%]
tests/test_core_system.py::test_subscription_health_score_missing_data_policy PASSED [ 88%]
tests/test_core_system.py::test_what_if_revenue_simulation PASSED        [100%]
======================= 9 passed in 5.79s ========================
```

---

## 4. Demo Accounts & Seed Credentials

Command: `python backend/manage.py seed_demo_data`

| Persona | Email | Password | Role Scope |
|---|---|---|---|
| **Administrator** | `admin@brightloop.com` | `Brightloop@2026!` | Full system access, staff provisioning, discount rules |
| **Operational Staff** | `staff@brightloop.com` | `Brightloop@2026!` | Day-to-day customers, quotations, subscriptions, invoices, reconciliation |
| **Customer** | `customer@brightloop.com` | `Brightloop@2026!` | Self-service portal (`/portal`), own subscriptions & invoices |

---

## 5. System Deliverables & Documentation Index
- `docs/ARCHITECTURE.md`: High-level topology, security layers, RBAC matrix, and Celery scheduling.
- `docs/DATABASE_SCHEMA.md`: 14 domain entity schemas, relational ERD, keys, constraints, and indexes.
- `docs/API_DOCUMENTATION.md`: Full versioned REST API reference with payload contracts and permission rules.
- `docs/BUSINESS_LOGIC.md`: Mathematical formulations for billing cycles, health scores, and 12-month projections.
- `docs/TESTING.md`: Complete automated test matrix and step-by-step end-to-end verification checklist.
- `docker-compose.yml`: Multi-container production deployment for PostgreSQL 16, Redis 7, Django Gunicorn, Celery Worker, Celery Beat, and Nginx.
- `backend/Dockerfile` & `frontend/Dockerfile`: Multi-stage production container definitions.
- `.env.example`: Environment variable blueprint for local and production deployments.
- `README.md`: Commercial SaaS documentation with architectural diagrams, feature walk-throughs, and quickstart guides.

## 6. Known Design Safeguards
1. **Financial Integrity**: All financial quantities use Python `Decimal` and PostgreSQL `NUMERIC(12, 2)` / `(12, 4)` avoiding floating-point inaccuracies.
2. **Duplicate Invoice Prevention**: Database compound unique constraint on `(subscription_id, billing_period_start, billing_period_end)` plus due-date validation.
3. **Missing Telemetry Policy**: Missing activity signals trigger proportional weight redistribution across available dimensions and an explicit `DATA_UNAVAILABLE` tag rather than penalizing accounts to zero.
4. **Data Isolation**: Production queries filter `is_demo=False` to prevent test fixture pollution.
