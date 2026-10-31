export type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number?: string;
  is_demo_user: boolean;
}

export interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  billing_email: string;
  phone: string;
  tax_id: string;
  currency: string;
  status: 'LEAD' | 'ACTIVE' | 'CHURNED' | 'DELINQUENT';
  payment_terms_days: number;
  credit_limit: string;
  billing_address: string;
  shipping_address: string;
  notes: string;
  is_demo: boolean;
  active_subscriptions_count?: number;
  latest_health_score?: {
    score: number;
    category: string;
    trend: string;
    data_coverage: string;
  };
  total_spent?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product: string;
  product_name?: string;
  name: string;
  sku: string;
  price_adjustment: string;
  effective_price: string;
  attributes: Record<string, any>;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  product_type: 'SOFTWARE' | 'SERVICE' | 'ADDON' | 'HARDWARE';
  sales_price: string;
  cost_price: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED';
  variants: ProductVariant[];
  variants_count?: number;
  created_at: string;
}

export interface PlanFeature {
  id: string;
  feature_text: string;
  is_included: boolean;
  sort_order: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  product: string;
  product_name?: string;
  variant?: string;
  variant_name?: string;
  description: string;
  billing_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  plan_price: string;
  setup_fee: string;
  trial_period_days: number;
  minimum_quantity: number;
  auto_close: boolean;
  allow_pause: boolean;
  allow_early_closure: boolean;
  allow_renewal: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  features: PlanFeature[];
}

export interface QuotationLine {
  id?: string;
  product: string;
  product_name?: string;
  plan?: string;
  plan_name?: string;
  description: string;
  quantity: number;
  unit_price: string;
  tax_rate?: string;
  tax_amount: string;
  discount_rule?: string;
  discount_amount: string;
  subtotal: string;
  total_amount: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer: string;
  customer_name?: string;
  customer_email?: string;
  template?: string;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'CONVERTED' | 'EXPIRED' | 'REJECTED';
  valid_until: string;
  currency: string;
  subtotal: string;
  tax_total: string;
  discount_total: string;
  total_amount: string;
  notes: string;
  converted_subscription_id?: string;
  lines: QuotationLine[];
  created_at: string;
}

export interface SubscriptionLine {
  id: string;
  product: string;
  product_name: string;
  plan?: string;
  plan_name?: string;
  description: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_amount: string;
  subtotal: string;
  total_amount: string;
}

export interface SubscriptionEvent {
  id: string;
  event_type: string;
  actor_email: string;
  details: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  subscription_number: string;
  customer: string;
  customer_name?: string;
  customer_email?: string;
  plan: string;
  plan_name?: string;
  status: 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'EXPIRED';
  start_date: string;
  expiry_date?: string;
  next_billing_date: string;
  billing_frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  payment_terms_days: number;
  currency: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  auto_renew: boolean;
  cancellation_reason?: string;
  notes?: string;
  lines: SubscriptionLine[];
  events: SubscriptionEvent[];
  created_at: string;
}

export interface InvoiceLine {
  id: string;
  product?: string;
  product_name?: string;
  description: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_name_snapshot: string;
  tax_rate_snapshot: string;
  tax_amount: string;
  subtotal: string;
  total_amount: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer: string;
  customer_code?: string;
  customer_name_snapshot: string;
  customer_email_snapshot: string;
  billing_address_snapshot: string;
  subscription?: string;
  subscription_number?: string;
  billing_period_start?: string;
  billing_period_end?: string;
  invoice_date: string;
  due_date: string;
  status: 'DRAFT' | 'CONFIRMED' | 'PAID' | 'CANCELLED';
  currency: string;
  subtotal: string;
  tax_total: string;
  discount_total: string;
  total_amount: string;
  amount_paid: string;
  balance_due: string;
  is_overdue: boolean;
  is_partially_paid: boolean;
  notes?: string;
  lines: InvoiceLine[];
  created_at: string;
}

export interface Payment {
  id: string;
  invoice: string;
  invoice_number?: string;
  customer: string;
  customer_name?: string;
  amount: string;
  currency: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'OTHER';
  payment_date: string;
  transaction_reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  notes?: string;
  is_reconciled: boolean;
  reconciled_at?: string;
  created_at: string;
}

export interface TaxRule {
  id: string;
  name: string;
  code: string;
  rate_percentage: string;
  tax_type: 'PERCENTAGE' | 'FIXED';
  fixed_amount: string;
  applicable_products: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface DiscountRule {
  id: string;
  name: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  min_purchase_amount: string;
  min_quantity: number;
  max_usage_count?: number;
  current_usage_count: number;
  applicable_product?: string;
  applicable_product_name?: string;
  is_subscription_wide: boolean;
  status: 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'INACTIVE';
}

export interface RetentionRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  is_dismissed: boolean;
  created_at: string;
}

export interface HealthScoreHistoryItem {
  id: string;
  score: string;
  category: string;
  recorded_date: string;
}

export interface CustomerHealthScore {
  id: string;
  customer: string;
  customer_name: string;
  customer_code: string;
  score: string;
  category: 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK';
  trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  payment_reliability_score?: string;
  renewal_history_score?: string;
  product_usage_score?: string;
  customer_engagement_score?: string;
  support_history_score?: string;
  data_coverage: string;
  coverage_percentage: number;
  missing_factors: string[];
  recommendations?: RetentionRecommendation[];
  history?: HealthScoreHistoryItem[];
  computed_at: string;
}

export interface RevenueProjectionMonth {
  month: number;
  month_label: string;
  active_customers: number;
  churned_customers: number;
  new_customers: number;
  projected_mrr: string;
  projected_arr: string;
  projected_net_revenue: string;
}

export interface SimulationResult {
  scenario_id?: string;
  baseline_mrr: string;
  baseline_arr: string;
  projected_mrr: string;
  projected_arr: string;
  revenue_difference: string;
  percentage_change: string;
  projected_customer_count: number;
  projections: RevenueProjectionMonth[];
}

export interface DashboardMetrics {
  kpis: {
    total_customers: number;
    active_subscriptions: number;
    new_subscriptions: number;
    mrr: string;
    arr: string;
    revenue_collected: string;
    revenue_billed: string;
    outstanding_payments: string;
    overdue_invoices_count: number;
    overdue_invoices_amount: string;
    subscription_cancellations: number;
    renewal_rate: number;
  };
  charts: {
    revenue_trend: { month: string; billed: number; collected: number }[];
    subscription_status_distribution: { name: string; value: number }[];
    revenue_by_product: { name: string; value: number }[];
    revenue_by_plan: { name: string; value: number }[];
    payment_status_distribution: { name: string; value: number }[];
  };
}
