import os
import sys
import django

sys.path.append(r'z:\Projects\Enerza\Enerza\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enerza.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from api.models import REFITHousehold

User = get_user_model()

def test_forecast_api():
    print("--- Testing XGBoost Forecast API ---")
    house1 = REFITHousehold.objects.filter(house_number=1).first()
    if house1 and house1.user:
        user = house1.user
    else:
        user = User.objects.filter(username__icontains='house1').first() or User.objects.first()

    print(f"Authenticated user: {user.username} (House {house1.house_number if house1 else 'N/A'})")
    client = APIClient()
    client.force_authenticate(user=user)

    res = client.get('/api/forecast/')
    print(f"Forecast HTTP status: {res.status_code}")
    assert res.status_code == 200, f"Error response: {res.data}"
    
    data = res.data
    history = data.get('history', [])
    forecast = data.get('forecast', [])
    
    print(f"History data points: {len(history)}")
    print(f"Forecast data points: {len(forecast)}")
    
    if forecast:
        print("Sample 5 Forecast Predictions:")
        for item in forecast[:5]:
            print(" ", item)
            
    assert len(forecast) > 0, "Forecast predictions array should not be empty!"
    print("\nFORECAST API TEST PASSED!")

if __name__ == '__main__':
    test_forecast_api()
