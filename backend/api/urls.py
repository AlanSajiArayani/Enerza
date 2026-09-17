from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_summary, name='dashboard'),
    path('appliances/', views.get_appliances, name='appliances'),
    path('appliances/<str:appliance_id>/', views.get_appliance_detail, name='appliance_detail'),
    path('appliances/<str:appliance_id>/toggle-power/', views.toggle_appliance_power, name='toggle_appliance_power'),
    path('appliances/<str:appliance_id>/set-limit/', views.set_appliance_limit, name='set_appliance_limit'),
    path('user-appliances/', views.user_appliances_view, name='user_appliances'),
    path('user-appliances/<int:pk>/', views.user_appliance_detail_view, name='user_appliance_detail'),
    path('alerts/', views.get_alerts, name='alerts'),
    path('forecast/', views.get_forecast, name='forecast'),
    path('ai-advisor/', views.ai_advisor, name='ai_advisor'),
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.current_user_view, name='current_user'),
    path('profile/', views.profile_view, name='profile'),
    path('admin/users/', views.admin_users_view, name='admin_users'),
    path('admin/users/<int:user_id>/', views.admin_user_detail_view, name='admin_user_detail'),
]

