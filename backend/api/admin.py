from django.contrib import admin
from .models import UserProfile, UserAppliance

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'electricity_tariff', 'monthly_energy_goal', 'created_at')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')

@admin.register(UserAppliance)
class UserApplianceAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'appliance_type', 'rated_power_watts', 'power_category', 'iot_enabled', 'created_at')
    list_filter = ('power_category', 'iot_enabled', 'appliance_type')
    search_fields = ('name', 'user__username', 'appliance_type')

