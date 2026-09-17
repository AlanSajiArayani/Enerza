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

    def save(self, *args, **kwargs):
        if self.rated_power_watts < 300:
            self.power_category = 'low'
        elif self.rated_power_watts <= 1000:
            self.power_category = 'moderate'
        else:
            self.power_category = 'high'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

