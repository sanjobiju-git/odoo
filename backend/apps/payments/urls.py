from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, ReconciliationViewSet

router = DefaultRouter()
router.register(r'reconciliation', ReconciliationViewSet, basename='reconciliation')
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
]
