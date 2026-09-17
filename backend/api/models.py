from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('citizen', 'Citizen'),
        ('admin', 'Admin'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen')
    phone = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    preferred_currency = models.CharField(max_length=10, default='INR')
    electricity_tariff = models.FloatField(default=8.0)
    monthly_energy_goal = models.FloatField(default=220.0)
    notification_preference = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile ({self.role})"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        role = 'admin' if (instance.is_staff or instance.is_superuser) else 'citizen'
        UserProfile.objects.create(user=instance, role=role)
    else:
        if hasattr(instance, 'profile'):
            if (instance.is_staff or instance.is_superuser) and instance.profile.role != 'admin':
                instance.profile.role = 'admin'
                instance.profile.save()

class REFITHousehold(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='refit_household')
    house_number = models.IntegerField(unique=True)
    display_name = models.CharField(max_length=100)
    data_file = models.CharField(max_length=255)
    data_source = models.CharField(max_length=50, default='refit')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} (House {self.house_number}) -> {self.user.username}"


class UserAppliance(models.Model):
    POWER_CATEGORY_CHOICES = (
        ('low', 'Low Power'),
        ('moderate', 'Moderate Power'),
        ('high', 'High Power'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appliances')
    name = models.CharField(max_length=100)
    appliance_type = models.CharField(max_length=100)
    rated_power_watts = models.FloatField(default=100.0)
    power_category = models.CharField(max_length=20, choices=POWER_CATEGORY_CHOICES, default='low')
    icon_key = models.CharField(max_length=50, default='zap')
    iot_enabled = models.BooleanField(default=False)
    iot_device_name = models.CharField(max_length=100, blank=True, null=True)
    iot_status = models.CharField(max_length=50, default='Not Connected')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.name} ({self.rated_power_watts}W)"


