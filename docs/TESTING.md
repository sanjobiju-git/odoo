# SUBSIGHT Automated Test Strategy & Verification Guide

This document outlines the testing architecture, test suites, edge-case coverage, and execution commands for SUBSIGHT.

---

## 1. Test Architecture Overview

SUBSIGHT utilizes a dual-tier automated test suite:
- **Backend**: Pytest + pytest-django running transactional database test runners.
- **Frontend**: TypeScript compilation checks (`tsc -b`), linting (`oxlint`), and component build verification (`vite build`).

---

## 2. Backend Automated Test Coverage Matrix

Located at: `backend/tests/test_core_system.py`

| Test Case Name | Objective / Scenario | Pass Criteria |
|---|---|---|
| `test_authentication_and_jwt_tokens` | Verify login returns valid JWT access and refresh tokens, user metadata, and role. | Status 200, JWT tokens decoded, role=ADMIN verified. |
| `test_role_permissions_discount_creation` | Ensure RBAC strictly enforces that **only administrators** can configure discount rules. | Staff gets 403 Forbidden; Admin gets 201 Created and rule persists. |
| `test_product_variant_price_calculation` | Test dynamic variant price additions (e.g. +₹560 for Odoo connector). | Variant SKU links properly; total = base (₹10,000) + variant (₹560) = ₹10,560. |
| `test_quotation_conversion_to_subscription` | Atomic 1-click conversion from accepted quotation to active subscription. | Quotation moves to `CONVERTED`, active `Subscription` created with lines and next billing date. |
| `test_subscription_lifecycle_state_machine` | Validate valid & invalid state transitions (`DRAFT` -> `ACTIVE` -> `PAUSED` -> `ACTIVE` -> `CLOSED`). | State transitions succeed; invalid transitions raise `ValidationError`. |
| `test_recurring_billing_duplicate_prevention` | Validate idempotent billing engine and unique billing period constraint. | First run produces `INV-001`; second consecutive run safely skips duplicate invoice. |
| `test_payment_allocation_and_invoice_balance` | Validate partial and full payment allocation reducing invoice `balance_due`. | Initial balance ₹10,000; payment ₹4,000 leaves balance ₹6,000; payment ₹6,000 transitions to `PAID`. |
| `test_health_score_missing_data_policy` | Verify health score algorithm does not treat missing telemetry as zero. | Only payment & renewal provided (30% + 25% = 55% weight sum); score reweighted to 100/100, coverage=40%. |
| `test_revenue_simulator_projections` | Validate 12-month What-If simulation outputs and scenario math. | Returns baseline MRR/ARR, projected MRR, deltas, and 12-month array. |

---

## 3. Running Backend Tests

From the project root:

```bash
# Using project virtual environment
venv\Scripts\pytest backend\tests\test_core_system.py -v
```

Expected output:
```text
============================= test session starts =============================
platform win32 -- Python 3.13.x, pytest-9.x, pluggy-1.x
rootdir: C:\...\SUBSIGHT\backend
configfile: pytest.ini
plugins: django-4.14.0
collected 9 items

tests\test_core_system.py::test_authentication_and_jwt_tokens PASSED
tests\test_core_system.py::test_role_permissions_discount_creation PASSED
tests\test_core_system.py::test_product_variant_price_calculation PASSED
tests\test_core_system.py::test_quotation_conversion_to_subscription PASSED
tests\test_core_system.py::test_subscription_lifecycle_state_machine PASSED
tests\test_core_system.py::test_recurring_billing_duplicate_prevention PASSED
tests\test_core_system.py::test_payment_allocation_and_invoice_balance PASSED
tests\test_core_system.py::test_health_score_missing_data_policy PASSED
tests\test_core_system.py::test_revenue_simulator_projections PASSED

======================== 9 passed in 5.8s ========================
```

---

## 4. Frontend Compilation & Production Build Verification

From the `frontend` directory:

```bash
# Run TypeScript typechecks and production bundle build
npm run build
```

Expected output:
```text
> frontend@0.0.0 build
> tsc -b && vite build

vite v6.x.x building for production...
transforming...
✓ 1836 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.82 kB │ gzip:  0.44 kB
dist/assets/index-Bf6b-Koa.css   31.20 kB │ gzip:  5.80 kB
dist/assets/index-D7K_8k1_.js   512.44 kB │ gzip: 148.12 kB
✓ built in 4.27s
```

---

## 5. End-to-End Workflow Verification Checklist

1. **User Authentication**:
   - Access `http://localhost:5173/login`.
   - Click "Admin Persona" to autofill `admin@brightloop.com` and log in.
   - Verify sidebar displays all 14 administrative modules.
2. **Product & Variant Pricing**:
   - Navigate to **Products**.
   - Inspect "Business Suite ERP" variant "Odoo Integration Connector".
   - Confirm differential adjustment shows `+INR 560.00`.
3. **Quotation Conversion**:
   - Navigate to **Quotations**.
   - Click on quotation `QUO-202610-001`.
   - Click **"Convert to Subscription"** and verify automatic creation of active contract.
4. **Automated Recurring Billing Batch**:
   - Navigate to **Invoices**.
   - Click **"Run Recurring Billing Batch"**.
   - Confirm generated cycle invoices, tax breakdowns, and immutable snapshots.
5. **Subscription Intelligence (Health Score)**:
   - Navigate to **Subscription Intelligence**.
   - Verify radar chart, tier distributions (Healthy, Needs Attention, At Risk), and missing data coverage badges.
6. **Revenue Intelligence (What-If Simulator)**:
   - Navigate to **Revenue Intelligence**.
   - Adjust Growth (+15%), Churn (3%), and Price (+10%) sliders.
   - Observe live projected MRR/ARR variance and 12-month trajectory forecast.
7. **Customer Self-Service Portal**:
   - Switch persona or log in as `customer@brightloop.com`.
   - Verify restricted portal access (`/portal`) displaying only their own subscriptions and invoices.
   - Test PDF/Print invoice preview.
