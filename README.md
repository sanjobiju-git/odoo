# SUBSIGHT — AI-Powered Subscription Management & Intelligence Platform

> **Manage. Automate. Predict. Grow.**  
> A commercial-grade, multi-tenant subscription billing and financial intelligence SaaS platform built for **Brightloop Software**.

[![Python 3.13](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
[![Django 5.1](https://img.shields.io/badge/Django-5.1-green.svg)](https://www.djangoproject.com/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Pytest-9%20Passing-brightgreen.svg)]()

---

## 1. Executive Summary & Problem Scenario

Brightloop Software provides subscription-based software solutions, enterprise integrations, and specialized service add-ons. Previously, operations suffered from fragmented spreadsheets, manual invoice calculation errors, untracked recurring renewals, and zero visibility into customer churn or financial revenue trajectories.

**SUBSIGHT** replaces manual processes with an integrated enterprise subscription platform featuring:
1. **Automated Recurring Billing Engine**: Idempotent billing jobs via Celery Beat with strict `Decimal` monetary precision and database-enforced duplicate invoice prevention.
2. **Immutable Financial Snapshots**: Past invoices and tax calculations remain frozen even when product catalog prices or tax rules change.
3. **Role-Based Access Control (RBAC)**: Distinct, server-validated portals for **Admin** (full access + staff provisioning + discount rules), **Staff** (operational workflows), and **Customers** (restricted self-service portal).
4. **Signature Feature: Subscription Health Score (0–100)**: 5-parameter composite scoring engine with dynamic missing-data reweighting policy and retention playbooks.
5. **Signature Feature: What-If Revenue Simulator**: Dynamic financial modeling engine with 12-month projected MRR/ARR forecasts, slider controls, and multi-scenario comparison.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS & Lucide React icons
- **State & Server Cache**: TanStack React Query & React Context
- **Data Visualization**: Recharts (MRR Trends, Tier Distribution, Radar Charts, Projections)
- **Forms**: React Hook Form with Zod validation

### Backend
- **Framework**: Python 3.13, Django 5.1 & Django REST Framework
- **Authentication**: Stateless JSON Web Tokens (SimpleJWT)
- **Task Queue & Scheduler**: Celery with Redis broker and Celery Beat
- **Precision Accounting**: Python `Decimal` across all financial calculations

### Database & Storage
- **Production Database**: PostgreSQL 16 (with SQLite local fallback)
- **Constraints**: Compound unique constraints on `(subscription, billing_period_start, billing_period_end)`

---

## 3. Platform Modules & Capabilities

```
SUBSIGHT System Architecture
├── Auth & RBAC (Admin, Staff, Customer)
├── Customer CRM (360 Profiles, Credit Limits, Terms)
├── Products & Variants (Base prices + differential adjustments, e.g., Odoo +INR 560)
├── Subscription Plans (Daily, Weekly, Monthly, Yearly cadences)
├── Quotation Management (Templates, custom terms, 1-click subscription conversion)
├── Subscription Lifecycle (DRAFT -> CONFIRMED -> ACTIVE -> PAUSED -> CLOSED)
├── Recurring Billing Engine (Automated cycle billing, idempotency keys)
├── Invoices & Payments (Immutable snapshots, printable HTML/PDF, bank reconciliation)
├── Tax & Admin-Only Discounts (Atomic coupon claims, usage limits)
├── Signature Feature 1: Subscription Health Score (0-100)
├── Signature Feature 2: What-If Revenue Simulator (12-month projections)
└── Customer Self-Service Portal (/portal)
```

### 3.1. Role-Based Access Control Matrix
| Feature / Endpoint | Administrator | Staff | Customer |
|---|:---:|:---:|:---:|
| Executive Analytics & MRR/ARR | Full | Limited | Denied |
| Staff Provisioning (`/api/v1/auth/staff/`) | Yes | Denied | Denied |
| Discount Rules Creation | Yes | Denied | Denied |
| Customer 360 CRM | Full | Full | Self Only (`/me`) |
| Products & Variant Pricing | Full | View Only | View Only |
| Quotation 1-Click Conversion | Full | Full | Denied |
| Manual Recurring Billing Run | Full | Full | Denied |
| Subscription Lifecycle (Pause/Resume/Cancel) | Full | Full | Permitted Subscriptions |
| Payment Recording & Statement Reconciliation | Full | Full | Denied |
| Health Score Radar & Retention Playbooks | Full | Full | Denied |
| What-If Revenue Simulator | Full | Denied | Denied |
| Customer Portal (`/portal`) | Switchable | Switchable | Dedicated View |

---

## 4. Signature Feature 1: Subscription Health Score

SUBSIGHT evaluates customer retention risk using a 0–100 weighted model across 5 dimensions:
- **Payment Reliability (30%)**: Lifelong on-time payment track record.
- **Renewal History (25%)**: Successful term renewals vs cancellations.
- **Product Usage Telemetry (20%)**: Active seat utilization and daily API activity.
- **Customer Engagement (15%)**: Portal logins and invoice downloads.
- **Support Ticket History (10%)**: Escalation volume and satisfaction ratings.

### Missing-Data Policy
When telemetry or support streams are unconfigured, **the platform never treats missing signals as zero**. Instead, it dynamically reweights the available signals to sum to 100% and explicitly displays the data coverage percentage (e.g. `Coverage: 40% (2/5 Signals)`), ensuring customer scores remain unbiased.

---

## 5. Signature Feature 2: What-If Revenue Simulator

Administrators can evaluate strategic scenarios before execution:
- **Parameters**: Net growth %, churn %, catalog price shifts, campaign discounts, and immediate customer acquisitions.
- **Authoritative Calculations**: Direct queries against active contracts compute baseline MRR, ARR, and ARPU.
- **12-Month Projections**: Month-by-month trajectory graphs model compound compounding subscriber growth, churn deductions, and recurring cash flow.
- **Scenario Presets**: Instantly compare `Baseline`, `Optimistic (+20% Growth, +5% Price)`, `Expected`, and `Pessimistic (+15% Churn)` profiles, or save custom scenarios.

---

## 6. Pre-Configured Demo Credentials

The database comes pre-seeded with realistic enterprise data for testing:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Administrator** | `admin@brightloop.com` | `Password123!` | Full system access, staff management, simulator |
| **Staff Member** | `staff@brightloop.com` | `Password123!` | Daily CRM, quotations, invoices, payments |
| **Customer** | `customer@brightloop.com` | `Password123!` | Dedicated Customer Self-Service Portal (`/portal`) |

*(One-click persona buttons are available directly on the login screen for rapid evaluation).*

---

## 7. Quickstart Guide

### Option A: Local Development Setup

#### 1. Backend Setup
```bash
# Clone and navigate to project root
cd SUBSIGHT

# Activate python virtual environment
.\venv\Scripts\Activate.ps1   # On Windows (or source venv/bin/activate on Linux/macOS)

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py migrate

# Seed enterprise demo fixtures
python backend/manage.py seed_demo_data

# Start Django development server
python backend/manage.py runserver 127.0.0.1:8000
```

#### 2. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Option B: Docker Compose Deployment

Run the complete production multi-container stack with a single command:
```bash
docker-compose up --build
```
Containers started:
- `subsight-db` (PostgreSQL 16)
- `subsight-redis` (Redis 7)
- `subsight-backend` (Django 5.1 + Gunicorn)
- `subsight-celery-worker` (Asynchronous task worker)
- `subsight-celery-beat` (Scheduled billing at 00:00 & health score at 01:00)
- `subsight-frontend` (Nginx serving production React bundle)

Access the app at [http://localhost](http://localhost).

---

## 8. Automated Testing

### Backend Unit & Integration Tests
```bash
venv\Scripts\pytest backend\tests\test_core_system.py -v
```
**Results**: `9 passed in 5.8s`
- `test_authentication_and_jwt_tokens`: JWT access and refresh token issuance.
- `test_role_permissions_discount_creation`: Strict RBAC (staff forbidden, admin permitted).
- `test_product_variant_price_calculation`: Base price + variant differential (+₹560).
- `test_quotation_conversion_to_subscription`: Atomic quotation-to-subscription engine.
- `test_subscription_lifecycle_state_machine`: Valid & invalid state transitions.
- `test_recurring_billing_duplicate_prevention`: Idempotent batch billing and unique constraints.
- `test_payment_allocation_and_invoice_balance`: Balance reduction and `PAID` transition.
- `test_health_score_missing_data_policy`: Missing telemetry dynamic reweighting.
- `test_revenue_simulator_projections`: 12-month financial projections.

### Frontend Production Build
```bash
cd frontend
npm run build
```
**Results**: Clean TypeScript compilation and bundle generation in `dist/`.

---

## 9. Comprehensive Documentation Index

All architectural blueprints and technical specifications are available in `docs/`:
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): High-level system topology, RBAC, and security model.
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md): Complete entity schemas, data types, indexes, and ER diagram.
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md): Versioned REST API reference with payload examples.
- [`docs/BUSINESS_LOGIC.md`](docs/BUSINESS_LOGIC.md): Calendar arithmetic, billing algorithms, and scoring math.
- [`docs/TESTING.md`](docs/TESTING.md): Verification test cases and manual workflow checklist.
- [`PROJECT_STATUS.md`](PROJECT_STATUS.md): Real-time implementation status tracker.

---

## 10. License

Proprietary enterprise software built for **Brightloop Software**. All rights reserved.
