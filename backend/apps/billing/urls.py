from django.urls import path
from .views import RunBillingView, BillingEventListView

urlpatterns = [
    path('run/', RunBillingView.as_view(), name='run_billing'),
    path('events/', BillingEventListView.as_view(), name='billing_events'),
]
