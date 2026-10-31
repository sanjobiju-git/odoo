"""
URL Configuration for SUBSIGHT Subscription Management & Intelligence Platform.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Version 1 API Endpoints
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/customers/', include('apps.customers.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/plans/', include('apps.plans.urls')),
    path('api/v1/quotations/', include('apps.quotations.urls')),
    path('api/v1/subscriptions/', include('apps.subscriptions.urls')),
    path('api/v1/billing/', include('apps.billing.urls')),
    path('api/v1/invoices/', include('apps.invoices.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/taxes/', include('apps.taxes.urls')),
    path('api/v1/discounts/', include('apps.discounts.urls')),
    path('api/v1/intelligence/', include('apps.intelligence.urls')),
    path('api/v1/health-scores/', include('apps.intelligence.urls')),  # Alias
    path('api/v1/revenue/', include('apps.revenue.urls')),
    path('api/v1/revenue-simulator/', include('apps.revenue.urls')),   # Alias
    path('api/v1/analytics/', include('apps.notifications.urls')),     # Dashboard analytics & alerts
    path('api/v1/notifications/', include('apps.notifications.urls')),
]
