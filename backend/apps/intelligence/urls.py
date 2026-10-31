from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerHealthScoreViewSet, HealthScoreDashboardView, DismissRecommendationView

router = DefaultRouter()
router.register(r'scores', CustomerHealthScoreViewSet, basename='health-scores')

urlpatterns = [
    path('dashboard/', HealthScoreDashboardView.as_view(), name='health_dashboard'),
    path('recommendations/<uuid:pk>/dismiss/', DismissRecommendationView.as_view(), name='dismiss_recommendation'),
    path('', include(router.urls)),
]
