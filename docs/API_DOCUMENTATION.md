# SUBSIGHT REST API Reference & Specification

**Base URL**: `/api/v1`  
**Authentication**: JSON Web Token (JWT) via `Authorization: Bearer <access_token>`  
**Content-Type**: `application/json`  
**Error Format**: `{"detail": "Error description message", "code": "ERROR_CODE"}`

---

## 1. Authentication & Accounts (`/api/v1/auth/`)

### 1.1 Login
- **Endpoint**: `POST /api/v1/auth/login/`
- **Permissions**: Public (AllowAny)
- **Request Body**:
  ```json
  {
    "email": "admin@brightloop.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": "c138d87a-cfb3-4632-aa38-349f2575a7ff",
      "email": "admin@brightloop.com",
      "first_name": "Brightloop",
      "last_name": "Admin",
      "role": "ADMIN",
      "is_staff": true
    }
  }
  ```

### 1.2 Customer Registration
- **Endpoint**: `POST /api/v1/auth/register/`
- **Permissions**: Public (AllowAny)
- **Request Body**:
  ```json
  {
    "email": "ceo@acmecorp.com",
    "password": "Password123!",
    "first_name": "Jane",
    "last_name": "Doe",
    "company_name": "Acme Innovations Ltd",
    "billing_email": "billing@acmecorp.com",
    "phone": "+91 98765 43210"
  }
  ```
- **Response (201 Created)**: Returns access and refresh JWT tokens along with created customer profile.

### 1.3 Staff Provisioning (Admin Only)
- **Endpoint**: `POST /api/v1/auth/staff/`
- **Permissions**: `ADMIN` role required
- **Request Body**:
  ```json
  {
    "email": "support@brightloop.com",
    "password": "TemporaryPassword123!",
    "first_name": "Alex",
    "last_name": "Smith",
    "department": "Billing & Operations",
    "phone_number": "+91 91234 56789"
  }
  ```

---

## 2. Customer Management (`/api/v1/customers/`)

| Method | Endpoint | Permissions | Description |
|---|---|---|---|
| `GET` | `/api/v1/customers/` | Admin, Staff | List all customers with search and pagination |
| `POST` | `/api/v1/customers/` | Admin, Staff | Create a new customer profile |
| `GET` | `/api/v1/customers/{id}/` | Admin, Staff | Retrieve customer 360 profile |
| `GET` | `/api/v1/customers/me/` | Customer | Retrieve authenticated customer's own profile |
| `PATCH` | `/api/v1/customers/{id}/` | Admin, Staff | Update credit limits, addresses, contact details |

---

## 3. Products & Variants (`/api/v1/products/`)

| Method | Endpoint | Permissions | Description |
|---|---|---|---|
| `GET` | `/api/v1/products/` | All authenticated | List catalog products with active variants |
| `POST` | `/api/v1/products/` | Admin | Create a new product |
| `PATCH` | `/api/v1/products/{id}/` | Admin | Update product information or archive |
| `POST` | `/api/v1/products/{id}/add_variant/` | Admin | Add variant with configurable price adjustment |

**Variant Addition Payload Example**:
```json
{
  "name": "Odoo Integration Connector",
  "sku": "SW-BIZ-ODOO",
  "price_adjustment": "560.00",
  "is_active": true
}
```

---

## 4. Subscription Plans (`/api/v1/plans/`)

| Method | Endpoint | Permissions | Description |
|---|---|---|---|
| `GET` | `/api/v1/plans/` | All authenticated | List active subscription plans |
| `POST` | `/api/v1/plans/` | Admin | Create subscription plan with cadence and rules |
| `PATCH` | `/api/v1/plans/{id}/` | Admin | Update plan terms or pause/cancel permissions |

**Plan Creation Payload**:
```json
{
  "name": "Enterprise Cloud Yearly",
  "product": "a28b0f80-...",
  "billing_frequency": "YEARLY",
  "price": "9999.00",
  "min_quantity": 1,
  "pause_permission": true,
  "early_closure_permission": true,
  "renewal_permission": true
}
```

---

## 5. Quotation Management (`/api/v1/quotations/`)

| Method | Endpoint | Permissions | Description |
|---|---|---|---|
| `GET` | `/api/v1/quotations/` | Admin, Staff | List quotations |
| `POST` | `/api/v1/quotations/` | Admin, Staff | Create new custom quotation |
| `POST` | `/api/v1/quotations/{id}/convert/` | Admin, Staff | **Atomic 1-click conversion into active Subscription** |

**Quotation Conversion Response (200 OK)**:
```json
{
  "status": "success",
  "message": "Quotation QUO-202610-001 converted into subscription successfully.",
  "subscription_id": "8fa216bb-...",
  "subscription_number": "SUB-202610-004",
  "next_billing_date": "2026-11-30"
}
```

---

## 6. Subscription Operations (`/api/v1/subscriptions/`)

| Method | Endpoint | Permissions | Description |
|---|---|---|---|
| `GET` | `/api/v1/subscriptions/` | Object-level RBAC | List subscriptions (Admin/Staff view all, Customer sees own) |
| `GET` | `/api/v1/subscriptions/{id}/` | Object-level RBAC | Detailed view with billing lines & chronological audit trail |
| `POST` | `/api/v1/subscriptions/{id}/activate/` | Admin, Staff | Transition state from CONFIRMED -> ACTIVE |
| `POST` | `/api/v1/subscriptions/{id}/pause/` | Admin, Staff, Customer | Suspend billing (ACTIVE -> PAUSED) |
| `POST` | `/api/v1/subscriptions/{id}/resume/` | Admin, Staff, Customer | Reactivate paused subscription (PAUSED -> ACTIVE) |
| `POST` | `/api/v1/subscriptions/{id}/cancel/` | Admin, Staff, Customer | Close subscription (-> CLOSED) |
| `POST` | `/api/v1/subscriptions/{id}/upgrade/` | Admin, Staff, Customer | Upgrade or downgrade plan with prorated calculation |
| `POST` | `/api/v1/subscriptions/{id}/renew/` | Admin, Staff, Customer | Extend contract expiry date |

---

## 7. Recurring Billing Engine (`/api/v1/billing/`)

- **Manual Batch Trigger**: `POST /api/v1/billing/run/`
- **Permissions**: `ADMIN` or `STAFF`
- **Request Body (Optional target date filter)**:
  ```json
  {
    "target_date": "2026-10-31"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": "completed",
    "target_date": "2026-10-31",
    "processed_count": 8,
    "created_invoices": [
      {
        "invoice_number": "INV-202610-009",
        "customer": "Tata Digital",
        "total": "4999.00"
      }
    ],
    "skipped_count": 0,
    "errors": []
  }
  ```

---

## 8. Invoices & Payments

### 8.1 Invoices (`/api/v1/invoices/`)
- `GET /api/v1/invoices/`: List invoices. Filter by status (`DRAFT`, `CONFIRMED`, `PAID`, `CANCELLED`).
- `GET /api/v1/invoices/{id}/`: Invoice details with immutable lines.
- `GET /api/v1/invoices/{id}/pdf/`: Download or preview printable HTML invoice document.
- `POST /api/v1/invoices/{id}/confirm/`: Move invoice to CONFIRMED.
- `POST /api/v1/invoices/{id}/cancel/`: Void invoice.

### 8.2 Payments (`/api/v1/payments/`)
- `GET /api/v1/payments/`: Payment history ledger.
- `POST /api/v1/payments/`: Record customer payment and atomically reduce invoice balance.
  ```json
  {
    "invoice": "67b931dc-...",
    "amount": "4999.00",
    "payment_method": "BANK_TRANSFER",
    "payment_date": "2026-10-31",
    "transaction_reference": "UTR-HDFC-991823741",
    "notes": "Direct NEFT settlement"
  }
  ```
- `POST /api/v1/payments/reconcile/`: Bank statement reconciliation matcher.

---

## 9. Signature Feature 1: Subscription Health Score (`/api/v1/intelligence/health-scores/`)

- **Dashboard Endpoint**: `GET /api/v1/intelligence/health-scores/dashboard/`
- **Permissions**: `ADMIN` or `STAFF`
- **Response Format**:
  ```json
  {
    "summary": {
      "average_health_score": 78,
      "healthy_count": 18,
      "needs_attention_count": 6,
      "at_risk_count": 3
    },
    "score_distribution": [
      {"tier": "Healthy (80-100)", "count": 18},
      {"tier": "Needs Attention (50-79)", "count": 6},
      {"tier": "At Risk (0-49)", "count": 3}
    ],
    "customers": [
      {
        "customer_id": "993a4b01-...",
        "company_name": "Nexus Dynamics",
        "health_score": 42,
        "category": "AT_RISK",
        "payment_score": 30,
        "renewal_score": 50,
        "usage_score": null,
        "engagement_score": 45,
        "support_score": null,
        "data_coverage_pct": 60,
        "recommended_action": "Schedule urgent executive renewal call and offer annual billing discount."
      }
    ]
  }
  ```

---

## 10. Signature Feature 2: What-If Revenue Simulator (`/api/v1/revenue/simulate/`)

- **Simulation Engine**: `POST /api/v1/revenue/simulate/`
- **Permissions**: `ADMIN`
- **Request Body**:
  ```json
  {
    "growth_rate_pct": 15.0,
    "churn_rate_pct": 3.0,
    "price_change_pct": 10.0,
    "discount_pct": 5.0,
    "new_customers_count": 25
  }
  ```
- **Response**: Contains `baseline` (live database metrics), `projected` (simulated values), `deltas` (net dollar & % variance), and 12-month month-by-month trajectory forecast.
- `GET /api/v1/revenue/scenarios/`: Retrieve saved scenario profiles.
- `POST /api/v1/revenue/scenarios/`: Persist custom simulation scenario.
