import os
import sys
import django
import pandas as pd

backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enerza.settings')
django.setup()

from rest_framework.test import APIClient
from api.analytics.preprocessing import get_dataset_bounds

def run_tests():
    print("=" * 70)
    print("TESTING DYNAMIC TOP ENERGY CONSUMERS SIMULATION UPDATES")
    print("=" * 70)

    client = APIClient()
    login_resp = client.post('/api/auth/login/', {'username': 'house01', 'password': 'EnerzaDemo01!'}, format='json')
    assert login_resp.status_code == 200
    token = login_resp.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    min_date, max_date = get_dataset_bounds(1)
    print(f"Dataset timeline bounds: {min_date} to {max_date}")

    # Test three distinct simulation timestamps across dataset
    t1 = min_date + pd.Timedelta(days=5)
    t2 = min_date + pd.Timedelta(days=15)
    t3 = min_date + pd.Timedelta(days=25)

    dash1 = client.get(f'/api/dashboard/?simulation_time={t1.isoformat()}').data
    dash2 = client.get(f'/api/dashboard/?simulation_time={t2.isoformat()}').data
    dash3 = client.get(f'/api/dashboard/?simulation_time={t3.isoformat()}').data

    top1 = [(a['name'], a['value']) for a in dash1['appliance_distribution'][:3]]
    top2 = [(a['name'], a['value']) for a in dash2['appliance_distribution'][:3]]
    top3 = [(a['name'], a['value']) for a in dash3['appliance_distribution'][:3]]

    print(f"\nSimulation T1 ({t1.strftime('%Y-%m-%d %H:%M')}): Top Consumers -> {top1}")
    print(f"Simulation T2 ({t2.strftime('%Y-%m-%d %H:%M')}): Top Consumers -> {top2}")
    print(f"Simulation T3 ({t3.strftime('%Y-%m-%d %H:%M')}): Top Consumers -> {top3}")

    assert top1 != top2 or top2 != top3, "Expected Top Energy Consumers to change dynamically with simulation time!"
    print("\n  [OK] Top Energy Consumers dynamic update test PASSED! Rankings and consumption values dynamically change with live simulation time.")

    print("\n" + "=" * 70)

if __name__ == '__main__':
    run_tests()
