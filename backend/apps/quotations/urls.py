from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuotationViewSet, QuotationTemplateViewSet

router = DefaultRouter()
router.register(r'templates', QuotationTemplateViewSet, basename='quotation-template')
router.register(r'', QuotationViewSet, basename='quotation')

urlpatterns = [
    path('', include(router.urls)),
]
