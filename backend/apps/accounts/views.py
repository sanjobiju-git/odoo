from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    RegisterCustomerSerializer,
    CreateStaffSerializer,
    StaffProfileSerializer
)
from .models import StaffProfile
from .permissions import IsAdminUserRole, IsStaffUserRole

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterCustomerView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterCustomerSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class StaffManagementViewSet(viewsets.ModelViewSet):
    """Admin-only viewset to create, list, and manage staff members."""
    permission_classes = [IsAdminUserRole]
    queryset = StaffProfile.objects.select_related('user').all()
    serializer_class = StaffProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = CreateStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        staff_profile = StaffProfile.objects.get(user=user)
        return Response(StaffProfileSerializer(staff_profile).data, status=status.HTTP_201_CREATED)
