from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.dashboard_summary, name='dashboard'),
    path('appliances/', views.get_appliances, name='appliances'),
    path('alerts/', views.get_alerts, name='alerts'),
    path('forecast/', views.get_forecast, name='forecast'),
    path('ai-advisor/', views.ai_advisor, name='ai_advisor'),
]
