from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_summary, name='dashboard'),
    path('appliances/', views.get_appliances, name='appliances'),
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

