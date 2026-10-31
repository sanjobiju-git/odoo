# SUBSIGHT: Architecture Blueprint & Technical Design

## 1. System Overview & Technology Stack

SUBSIGHT is engineered following a clean, decoupled, layered SaaS architecture:

- **Frontend Client**: React 18, TypeScript, Tailwind CSS, Lucide React icons, Recharts, React Router v7. Built using Vite with optimized production chunking.
- **Backend Application Core**: Python 3.13, Django 5.1, Django REST Framework. Organized into 14 modular domain applications (`apps/accounts`, `apps/customers`, `apps/products`, `apps/plans`, `apps/quotations`, `apps/subscriptions`, `apps/billing`, `apps/taxes`, `apps/discounts`, `apps/invoices`, `apps/payments`, `apps/intelligence`, `apps/revenue`, `apps/notifications`).
- **Data Persistence**: PostgreSQL 16 (production) with automatic SQLite fallback for rapid local test execution.
- **Asynchronous Task Queue & Scheduling**: Celery 5.4 + Redis 7 broker, with Celery Beat cron for daily recurring billing and health scoring.

---

## 2. Multi-Role RBAC & Authorization Layer

SUBSIGHT enforces strict role-based access control across three user personas:

| Capability | ADMIN | STAFF | CUSTOMER |
|---|:---:|:---:|:---:|
| Executive Financial Dashboard | Full | Read | Denied |
| Staff Account Provisioning | **Yes** | No | No |
| Create & Edit Discount Rules | **Yes** | No | No |
| Configure Tax Rules | **Yes** | Read | No |
| Create / Edit Products & Variants | **Yes** | Read | Read Active |
| Manage Subscriptions & Quotations | Full | Full | Self (Read / Approve) |
| Issue Invoices & Execute Billing Run | Full | Full | Self (Read / Pay) |
| Record Payments & Reconcile | Full | Full | Self (Initiate) |
| Subscription Health Score Radar | Full | Full | Denied |
| What-If Revenue Simulator | Full | Full (Read) | Denied |
| Customer Self-Service Portal (`/portal`) | Super | Super | **Own Account Only** |

Security is enforced at the REST permission class level (`IsAdminUserRole`, `IsStaffUserRole`, `IsCustomerUserRole`, `IsOwnerOrStaff`) and database query filters (`customer__user=request.user`).

---

## 3. High-Level Topology

```
[ Client Browser: React / TS / Tailwind ]
                   │
                   ▼ (JWT Bearer Token / HTTPS)
           [ Reverse Proxy / Vite ]
                   │
                   ▼
         [ Django REST Framework ]
         ├── Apps Architecture (14 Modules)
         ├── Service Engine Layer
         └── REST Serializers & Views
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
[ PostgreSQL Database ]  [ Redis 7 Cache & Broker ]
        ▲                     │
        │                     ▼
        └────────────── [ Celery Workers & Beat Scheduler ]
```

---

## 4. Key Engineering Tenets
- **Zero Floating-Point Financials**: Every monetary calculation (unit price, subtotal, tax amount, discount deduction, balance due) strictly utilizes `Decimal` arithmetic with explicit rounding rules.
- **Idempotent Recurring Billing**: Enforced via composite database unique constraints on `(subscription_id, billing_period_start, billing_period_end)` and due date validations.
- **Immutable Financial Snapshots**: Invoices store frozen customer details (company name, email, billing address) and tax snapshots so changes to catalog prices or tax rules never modify historical accounting records.
