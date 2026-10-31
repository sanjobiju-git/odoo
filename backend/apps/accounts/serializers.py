from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import StaffProfile, validate_password_strength

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': str(self.user.id),
            'email': self.user.email,
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'role': self.user.role,
            'is_demo_user': self.user.is_demo_user,
        }
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'is_demo_user', 'created_at']
        read_only_fields = ['id', 'created_at']

class RegisterCustomerSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password_strength])
    confirm_password = serializers.CharField(write_only=True, required=True)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'confirm_password', 'first_name', 'last_name', 'phone_number', 'company_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        company_name = validated_data.pop('company_name', '')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=User.Role.CUSTOMER
        )
        # Create Customer record linked to this user
        from apps.customers.models import Customer
        Customer.objects.create(
            user=user,
            company_name=company_name or f"{user.first_name} {user.last_name}".strip() or user.email,
            billing_email=user.email,
            phone=user.phone_number or '',
            currency='USD'
        )
        return user

class CreateStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password_strength])
    department = serializers.CharField(required=False, default='Operations')
    job_title = serializers.CharField(required=False, default='Subscription Specialist')

    class Meta:
        model = User
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'department', 'job_title']

    def create(self, validated_data):
        department = validated_data.pop('department', 'Operations')
        job_title = validated_data.pop('job_title', 'Subscription Specialist')
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=User.Role.STAFF,
            is_staff=True
        )
        StaffProfile.objects.create(
            user=user,
            department=department,
            job_title=job_title
        )
        return user

class StaffProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = StaffProfile
        fields = ['id', 'user', 'department', 'job_title', 'can_manage_billing', 'can_issue_refunds', 'created_at']
