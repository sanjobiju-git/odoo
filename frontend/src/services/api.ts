import {
  User, Customer, Product, ProductVariant, SubscriptionPlan,
  Quotation, Subscription, Invoice, Payment, TaxRule, DiscountRule,
  CustomerHealthScore, SimulationResult, DashboardMetrics
} from '../types';

const API_BASE = '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('subsight_access_token');
  }

  setTokens(access: string, refresh: string) {
    localStorage.setItem('subsight_access_token', access);
    localStorage.setItem('subsight_refresh_token', refresh);
  }

  clearTokens() {
    localStorage.removeItem('subsight_access_token');
    localStorage.removeItem('subsight_refresh_token');
    localStorage.removeItem('subsight_user');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/auth/login/')) {
      this.clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      let errorMsg = 'An error occurred';
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch {
        errorMsg = response.statusText;
      }
      throw new Error(errorMsg);
    }

    // For 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(credentials: { email: string; password: string }) {
    const data = await this.request<{ access: string; refresh: string; user: User }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setTokens(data.access, data.refresh);
    localStorage.setItem('subsight_user', JSON.stringify(data.user));
    return data;
  }

  async register(payload: any) {
    return this.request<{ message: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile/');
  }

  // Staff Management (Admin only)
  async getStaff() {
    const data = await this.request<{ results: any[] } | any[]>('/auth/staff/');
    return Array.isArray(data) ? data : data.results || [];
  }

  async createStaff(payload: any) {
    return this.request('/auth/staff/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Dashboard Metrics
  async getDashboardMetrics(range: string = '30d'): Promise<DashboardMetrics> {
    return this.request<DashboardMetrics>(`/analytics/dashboard/metrics/?range=${range}`);
  }

  // Customers
  async getCustomers(params: { search?: string; status?: string } = {}): Promise<Customer[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ results: Customer[] } | Customer[]>(`/customers/?${query}`);
    return Array.isArray(data) ? data : data.results || [];
  }

  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}/`);
  }

  async getMyCustomerProfile(): Promise<Customer> {
    return this.request<Customer>('/customers/me/');
  }

  async createCustomer(payload: Partial<Customer>): Promise<Customer> {
    return this.request<Customer>('/customers/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    const data = await this.request<{ results: Product[] } | Product[]>('/products/');
    return Array.isArray(data) ? data : data.results || [];
  }

  async createProduct(payload: Partial<Product>): Promise<Product> {
    return this.request<Product>('/products/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createVariant(payload: Partial<ProductVariant>): Promise<ProductVariant> {
    return this.request<ProductVariant>('/products/variants/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Plans
  async getPlans(): Promise<SubscriptionPlan[]> {
    const data = await this.request<{ results: SubscriptionPlan[] } | SubscriptionPlan[]>('/plans/');
    return Array.isArray(data) ? data : data.results || [];
  }

  async createPlan(payload: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    return this.request<SubscriptionPlan>('/plans/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Quotations
  async getQuotations(): Promise<Quotation[]> {
    const data = await this.request<{ results: Quotation[] } | Quotation[]>('/quotations/');
    return Array.isArray(data) ? data : data.results || [];
  }

  async createQuotation(payload: any): Promise<Quotation> {
    return this.request<Quotation>('/quotations/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async convertQuotation(id: string) {
    return this.request<{ message: string; subscription_id: string }>(`/quotations/${id}/convert/`, {
      method: 'POST',
    });
  }

  async approveQuotation(id: string) {
    return this.request(`/quotations/${id}/approve/`, { method: 'POST' });
  }

  // Subscriptions
  async getSubscriptions(params: { customer?: string; status?: string } = {}): Promise<Subscription[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ results: Subscription[] } | Subscription[]>(`/subscriptions/?${query}`);
    return Array.isArray(data) ? data : data.results || [];
  }

  async createSubscription(payload: any): Promise<Subscription> {
    return this.request<Subscription>('/subscriptions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async activateSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}/activate/`, { method: 'POST' });
  }

  async pauseSubscription(id: string, reason: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}/pause/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async resumeSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}/resume/`, { method: 'POST' });
  }

  async cancelSubscription(id: string, reason: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async switchSubscriptionPlan(id: string, plan_id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}/switch-plan/`, {
      method: 'POST',
      body: JSON.stringify({ plan_id }),
    });
  }

  async renewSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}/renew/`, { method: 'POST' });
  }

  // Invoices & Billing
  async getInvoices(params: { customer?: string; status?: string; is_overdue?: boolean } = {}): Promise<Invoice[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ results: Invoice[] } | Invoice[]>(`/invoices/?${query}`);
    return Array.isArray(data) ? data : data.results || [];
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/`);
  }

  async confirmInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/confirm/`, { method: 'POST' });
  }

  async cancelInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}/cancel/`, { method: 'POST' });
  }

  async runRecurringBilling(billing_date?: string) {
    return this.request<{
      billing_date: string;
      total_evaluated: number;
      invoices_created: number;
      skipped_duplicates: number;
      generated_invoices: string[];
      errors: string[];
    }>('/billing/run/', {
      method: 'POST',
      body: JSON.stringify({ billing_date }),
    });
  }

  // Payments & Reconciliation
  async getPayments(params: { customer?: string; invoice?: string } = {}): Promise<Payment[]> {
    const query = new URLSearchParams(params as any).toString();
    const data = await this.request<{ results: Payment[] } | Payment[]>(`/payments/?${query}`);
    return Array.isArray(data) ? data : data.results || [];
  }

  async recordPayment(payload: {
    invoice: string;
    amount: string;
    payment_method: string;
    transaction_reference?: string;
    notes?: string;
  }): Promise<Payment> {
    return this.request<Payment>('/payments/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async matchReconciliation(payload: { statement_reference: string; amount: string; statement_date: string }) {
    return this.request('/payments/reconciliation/match/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Taxes & Discounts
  async getTaxes(): Promise<TaxRule[]> {
    const data = await this.request<{ results: TaxRule[] } | TaxRule[]>('/taxes/');
    return Array.isArray(data) ? data : data.results || [];
  }

  async createTax(payload: Partial<TaxRule>): Promise<TaxRule> {
    return this.request<TaxRule>('/taxes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDiscounts(): Promise<DiscountRule[]> {
    const data = await this.request<{ results: DiscountRule[] } | DiscountRule[]>('/discounts/');
    return Array.isArray(data) ? data : data.results || [];
  }

  async createDiscount(payload: Partial<DiscountRule>): Promise<DiscountRule> {
    return this.request<DiscountRule>('/discounts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async validateDiscount(payload: { code: string; subtotal: string; quantity?: number; product_id?: string }) {
    return this.request<{ valid: boolean; discount_amount: string; final_subtotal: string }>('/discounts/validate/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Signature Intelligence 1: Subscription Health Score
  async getHealthScores(category?: string): Promise<CustomerHealthScore[]> {
    const query = category ? `?category=${category}` : '';
    const data = await this.request<{ results: CustomerHealthScore[] } | CustomerHealthScore[]>(`/intelligence/scores/${query}`);
    return Array.isArray(data) ? data : data.results || [];
  }

  async getHealthDashboard() {
    return this.request<{
      average_health_score: number;
      total_customers_scored: number;
      healthy_count: number;
      attention_count: number;
      at_risk_count: number;
      distribution: { category: string; count: number; color: string }[];
      risk_table: CustomerHealthScore[];
    }>('/intelligence/dashboard/');
  }

  async recalculateHealthScores() {
    return this.request<{ message: string }>('/intelligence/scores/recalculate-all/', {
      method: 'POST',
    });
  }

  async dismissRecommendation(id: string) {
    return this.request(`/intelligence/recommendations/${id}/dismiss/`, { method: 'POST' });
  }

  // Signature Intelligence 2: What-If Revenue Simulator
  async runSimulation(payload: {
    growth_rate_pct: number;
    churn_rate_pct: number;
    price_change_pct: number;
    discount_change_pct: number;
    new_customers_monthly: number;
    save_scenario?: boolean;
    title?: string;
  }): Promise<SimulationResult> {
    return this.request<SimulationResult>('/revenue/simulate/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async comparePresets() {
    return this.request<{
      current_baseline: {
        baseline_mrr: string;
        baseline_arr: string;
        active_subscribers: number;
        current_arpu: string;
      };
      scenarios: {
        baseline: SimulationResult;
        optimistic: SimulationResult;
        expected: SimulationResult;
        pessimistic: SimulationResult;
      };
    }>('/revenue/compare/');
  }

  async getSavedScenarios() {
    const data = await this.request<{ results: any[] } | any[]>('/revenue/scenarios/');
    return Array.isArray(data) ? data : data.results || [];
  }
}

export const api = new ApiClient();
