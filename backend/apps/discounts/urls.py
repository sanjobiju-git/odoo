from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiscountRuleViewSet

router = DefaultRouter()
router.register(r'', DiscountRuleViewSet, basename='discount-rule')

urlpatterns = [
    path('', include(router.urls)),
]
