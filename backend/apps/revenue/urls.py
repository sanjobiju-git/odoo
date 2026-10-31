from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RevenueScenarioViewSet, RunSimulationAPIView, ComparePresetsAPIView

router = DefaultRouter()
router.register(r'scenarios', RevenueScenarioViewSet, basename='revenue-scenario')

urlpatterns = [
    path('simulate/', RunSimulationAPIView.as_view(), name='run_simulation'),
    path('compare/', ComparePresetsAPIView.as_view(), name='compare_presets'),
    path('', include(router.urls)),
]
