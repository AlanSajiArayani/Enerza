import os
import sys
import django

backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enerza.settings')
django.setup()

from rest_framework.test import APIClient

def run_tests():
    print("=" * 70)
    print("TESTING PER-APPLIANCE OVERVIEW & DEEP-DIVE ENDPOINTS")
    print("=" * 70)

    client = APIClient()

    # Login house01
    login_resp = client.post('/api/auth/login/', {'username': 'house01', 'password': 'EnerzaDemo01!'}, format='json')
    assert login_resp.status_code == 200
    token = login_resp.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    # 1. Test GET /api/appliances/Appliance1/
    print("\n[TEST 1] Testing GET /api/appliances/Appliance1/ ...")
    resp = client.get('/api/appliances/Appliance1/')
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.data}"
    data = resp.data

    print(f"  Appliance Name: {data['name']}")
    print(f"  Status: {data['status']}")
    print(f"  Today Energy: {data['today_kwh']} kWh (Est. Cost: Rs. {data['today_cost']})")
    print(f"  Monthly Energy: {data['monthly_kwh']} kWh")
    print(f"  Household Share: {data['household_share_pct']}%")
    print(f"  Peak Power: {data['peak_power_watts']} W")
    print(f"  Hourly Trend datapoints: {len(data['hourly_trend'])}")
    print(f"  Daily Trend datapoints: {len(data['daily_trend'])}")

    assert data['id'] == 'Appliance1'
    assert 'hourly_trend' in data and len(data['hourly_trend']) == 24
    assert 'daily_trend' in data and len(data['daily_trend']) > 0
    assert 'ai_advice' in data
    print("  [OK] Appliance1 detail endpoint returned complete metrics and trend profiles.")

    # 2. Test GET /api/appliances/Washing Machine/ (Friendly Name Matching)
    print("\n[TEST 2] Testing Friendly Name Matching GET /api/appliances/Washing Machine/ ...")
    resp_wm = client.get('/api/appliances/Washing Machine/')
    assert resp_wm.status_code == 200
    assert resp_wm.data['id'] == 'Appliance2'
    print(f"  Matched Washing Machine -> {resp_wm.data['id']}")
    print("  [OK] Friendly appliance name successfully resolved to Appliance2.")

    # 3. Test UserAppliances CRUD (/api/user-appliances/)
    print("\n[TEST 3] Testing UserAppliances Saved Devices CRUD ...")
    post_resp = client.post('/api/user-appliances/', {
        'name': 'Test Smart EV Charger',
        'appliance_type': 'EV Charging',
        'rated_power_watts': 7200.0,
        'power_category': 'high',
        'iot_enabled': True,
        'iot_device_name': 'EV-Plug-01',
        'iot_status': 'Connected'
    }, format='json')
    assert post_resp.status_code == 201
    created_id = post_resp.data['id']
    print(f"  Created user appliance ID {created_id}: {post_resp.data['name']}")

    get_resp = client.get('/api/user-appliances/')
    assert get_resp.status_code == 200
    assert any(a['id'] == created_id for a in get_resp.data)
    print("  [OK] GET /api/user-appliances/ returned created device.")

    del_resp = client.delete(f'/api/user-appliances/{created_id}/')
    assert del_resp.status_code == 200
    print("  [OK] DELETE /api/user-appliances/<id>/ deleted device.")

    print("\n" + "=" * 70)
    print("ALL PER-APPLIANCE OVERVIEW TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
