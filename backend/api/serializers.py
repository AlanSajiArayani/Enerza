from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, REFITHousehold, UserAppliance

class UserApplianceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAppliance
        fields = ['id', 'name', 'appliance_type', 'rated_power_watts', 'power_category', 'icon_key', 'iot_enabled', 'iot_device_name', 'iot_status', 'created_at']
        read_only_fields = ['id', 'created_at']

class REFITHouseholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = REFITHousehold
        fields = ['id', 'house_number', 'display_name', 'data_file', 'data_source', 'is_active', 'created_at']
        read_only_fields = ['id', 'house_number', 'display_name', 'data_file', 'data_source', 'is_active', 'created_at']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            'id', 'role', 'phone', 'location', 'preferred_currency',
            'electricity_tariff', 'monthly_energy_goal',
            'notification_preference', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'role', 'created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    refit_household = REFITHouseholdSerializer(read_only=True)
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'role', 'profile', 'refit_household']

    def get_role(self, obj):
        if hasattr(obj, 'profile'):
            return obj.profile.role
        return 'admin' if (obj.is_staff or obj.is_superuser) else 'citizen'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password']

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists."})
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            is_staff=False,
            is_superuser=False
        )
        return user
