# SUBSIGHT Core Business Logic & Financial Algorithms

This document describes the financial, operational, and predictive mathematical algorithms implemented across SUBSIGHT.

---

## 1. Recurring Billing Engine & Next Billing Date Computation

### 1.1 Calendar Arithmetic & Leap-Year Preservation
Subscriptions bill across 4 discrete frequencies: `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY`.

Billing dates use month-end clamping to handle varying month lengths (28, 29, 30, 31 days) without calendar drift:
- If a monthly subscription starts on **January 31**, its subsequent billing date in February is clamped to **February 28** (or **February 29** in leap years).
- For leap year transitions on yearly cadences, **February 29** advances to **February 28** in non-leap years.

```python
def compute_next_billing_date(current_date: date, frequency: str) -> date:
    if frequency == 'DAILY':
        return current_date + timedelta(days=1)
    elif frequency == 'WEEKLY':
        return current_date + timedelta(weeks=1)
    elif frequency == 'MONTHLY':
        # Safely increment 1 month using calendar clamping
        year = current_date.year + (current_date.month // 12)
        month = (current_date.month % 12) + 1
        day = min(current_date.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)
    elif frequency == 'YEARLY':
        year = current_date.year + 1
        month = current_date.month
        day = min(current_date.day, calendar.monthrange(year, month)[1])
        return date(year, month, day)
```

### 1.2 Idempotent Batch Execution & Duplicate Invoicing Safeguard
The automated engine runs daily via Celery Beat or on-demand via administrative trigger:
1. Queries all subscriptions where `status = 'ACTIVE'` and `next_billing_date <= target_date`.
2. For each candidate subscription:
   - Uses `transaction.atomic()` with database row locking (`select_for_update()`).
   - Generates an idempotency check: `(subscription_id, billing_period_start, billing_period_end)`.
   - If an invoice matching this period already exists, the process skips generation and logs an audit notice rather than throwing a duplicate charge.
   - Calculates immutable invoice line items, taxes, and eligible discounts using exact `Decimal` arithmetic.
   - Creates the `Invoice` and updates `subscription.next_billing_date`.

---

## 2. Tax & Discount Calculations

### 2.1 Tax Application
Taxes are applied to the net taxable subtotal after eligible discounts:
$$\text{Taxable Amount} = \max(0, \text{Subtotal} - \text{Discount Amount})$$
$$\text{Tax Amount} = \text{Taxable Amount} \times \left(\frac{\text{Tax Rate \%}}{100}\right)$$
$$\text{Total Invoice Amount} = \text{Taxable Amount} + \text{Tax Amount}$$

### 2.2 Discount Constraints & Atomic Claims
Discount rules enforce:
- **Validity Window**: Current date between `start_date` and `end_date`.
- **Minimum Spend**: Subtotal meets or exceeds `min_purchase_amount`.
- **Usage Limits**: `current_usage_count < max_usage_count`.
- **Concurrency Safety**: Usage increments execute inside `select_for_update()` to prevent race conditions during flash sale redemptions.

---

## 3. Signature Feature 1: Subscription Health Score Algorithm

### 3.1 5 Weighted Parameters (Normalized 0 to 100)
1. **Payment Reliability ($W_1 = 0.30$)**: Ratio of on-time invoice payments vs overdue or defaulted invoices over the customer's lifespan.
2. **Renewal History ($W_2 = 0.25$)**: Frequency of successful renewals without cancellation or lapse.
3. **Product Usage ($W_3 = 0.20$)**: Active seat utilization and daily API/feature operations.
4. **Customer Engagement ($W_4 = 0.15$)**: Portal logins, invoice views, and profile interactions.
5. **Support History ($W_5 = 0.10$)**: Low escalation volume, short resolution times, and satisfaction scores.

### 3.2 Dynamic Missing-Data Reweighting Policy
Commercial SaaS platforms often integrate before full product telemetry or Zendesk support streams are connected.

**Policy Rule**: **Never treat missing data as 0.** Treating missing telemetry as zero would artificially classify healthy customers as "At Risk." Instead, dynamically normalize available weights:

$$\text{Active Weight Sum } W_{\text{active}} = \sum_{i \in \text{Available}} W_i$$
$$\text{Normalized Weight } w'_i = \frac{W_i}{W_{\text{active}}}$$
$$\text{Health Score} = \sum_{i \in \text{Available}} \left(S_i \times w'_i\right)$$

- **Data Coverage Percentage**: $\text{Coverage \%} = \frac{|\text{Available Signals}|}{5} \times 100$
- **Customer Health Tiers**:
  - **Healthy**: $80 \le \text{Score} \le 100$ (Upsell & expansion candidate)
  - **Needs Attention**: $50 \le \text{Score} \le 79$ (Proactive customer success outreach)
  - **At Risk**: $0 \le \text{Score} \le 49$ (Immediate executive escalation playbook)

---

## 4. Signature Feature 2: What-If Revenue Simulator

### 4.1 Database Baseline Metrics
The simulator queries active database contracts:
- **Baseline Active Customers ($C_0$)**: Count of unique accounts with active contracts.
- **Baseline MRR ($\text{MRR}_0$)**: Sum of normalized monthly value across all active subscriptions:
  $$\text{Normalized Monthly Line} = \begin{cases} \text{Total} \times 30 & \text{if Daily} \\ \text{Total} \times 4.33 & \text{if Weekly} \\ \text{Total} & \text{if Monthly} \\ \text{Total} / 12 & \text{if Yearly} \end{cases}$$
- **Average Revenue Per User ($\text{ARPU}_0$)**: $\frac{\text{MRR}_0}{C_0}$

### 4.2 12-Month Projection Engine
Given user slider inputs:
- Monthly Net Growth Rate $g = \frac{\text{Growth \%}}{100}$
- Monthly Churn Rate $c = \frac{\text{Churn \%}}{100}$
- Catalog Price Shift $p = \frac{\text{Price Change \%}}{100}$
- Promotional Discount $d = \frac{\text{Discount \%}}{100}$
- Immediate New Customer Injection $N$

For each month $m \in [1, 12]$:
1. Customer Base: $C_m = \max(0, C_{m-1} \times (1 + g - c) + (N \text{ if } m=1 \text{ else } 0))$
2. Effective ARPU: $\text{ARPU}_m = \text{ARPU}_0 \times (1 + p) \times (1 - d)$
3. Projected Monthly MRR: $\text{MRR}_m = C_m \times \text{ARPU}_m$
4. Projected ARR: $\text{ARR}_m = \text{MRR}_m \times 12$
