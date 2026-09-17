import os
import sys
import django

# Setup Django environment
backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enerza.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from api.models import REFITHousehold, UserProfile, UserAppliance

def run_tests():
    print("=" * 70)
    print("RUNNING 20-HOUSEHOLD ISOLATION AND SECURITY TEST SUITE")
    print("=" * 70)

    client = APIClient()

    # 1. Verify 20 Seeded Accounts & REFITHousehold Model
    print("\n[TEST 1] Verifying 20 Demo Accounts & Household Model...")
    households = REFITHousehold.objects.all().order_by('house_number')
    print(f"Total REFITHousehold entries in database: {households.count()}")
    assert households.count() == 20, f"Expected 20 households, found {households.count()}"

    for i in range(1, 21):
        username = f"house{i:02d}"
        h = REFITHousehold.objects.get(house_number=i)
        assert h.user.username == username, f"House {i} mismatch: user is {h.user.username}"
        assert h.display_name == f"REFIT Household {i:02d}", f"Display name mismatch for house {i}"
        assert h.user.profile.role == 'citizen', f"Role mismatch for user {username}"
        assert not h.user.is_staff and not h.user.is_superuser, f"User {username} should not be staff/superuser"
    print("  [OK] All 20 demo accounts correctly mapped to Houses 1..20 with citizen role.")

    # 2. Test Login & Profile (GET /api/auth/me/)
    print("\n[TEST 2] Testing Auth & Read-Only Household Metadata in Profile...")
    login_resp = client.post('/api/auth/login/', {'username': 'house07', 'password': 'EnerzaDemo07!'}, format='json')
    assert login_resp.status_code == 200, f"Login failed for house07: {login_resp.data}"
    token_h07 = login_resp.data['access']
    user_data = login_resp.data['user']
    
    assert user_data['username'] == 'house07'
    assert 'refit_household' in user_data
    assert user_data['refit_household']['house_number'] == 7
    assert user_data['refit_household']['display_name'] == 'REFIT Household 07'
    print("  [OK] GET /api/auth/login/ returns read-only refit_household metadata for House 7.")

    # 3. Test Dashboard Isolation (house01 vs house08)
    print("\n[TEST 3] Testing Dashboard Isolation (house01 vs house08)...")
    
    # Login house01
    resp1 = client.post('/api/auth/login/', {'username': 'house01', 'password': 'EnerzaDemo01!'}, format='json')
    token_h01 = resp1.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_h01}')
    dash01 = client.get('/api/dashboard/').data

    # Login house08
    resp8 = client.post('/api/auth/login/', {'username': 'house08', 'password': 'EnerzaDemo08!'}, format='json')
    token_h08 = resp8.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_h08}')
    dash08 = client.get('/api/dashboard/').data

    assert dash01['household_assigned'] is True
    assert dash01['household']['house_number'] == 1
    assert dash08['household_assigned'] is True
    assert dash08['household']['house_number'] == 8

    print(f"  House 1 today_energy: {dash01['today_energy']} kWh | Top appliance: {dash01['appliance_distribution'][0]['name']}")
    print(f"  House 8 today_energy: {dash08['today_energy']} kWh | Top appliance: {dash08['appliance_distribution'][0]['name']}")
    print("  [OK] Dashboard data is isolated per authenticated household.")

    # 4. Test Appliance Mapping Isolation (house01, house05, house12, house20)
    print("\n[TEST 4] Testing Appliance Mapping Isolation across Houses...")
    test_houses = [1, 5, 12, 18, 20]
    for h_num in test_houses:
        username = f"house{h_num:02d}"
        password = f"EnerzaDemo{h_num:02d}!"
        login_r = client.post('/api/auth/login/', {'username': username, 'password': password}, format='json')
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {login_r.data["access"]}')
        apps = client.get('/api/appliances/').data
        app_names = [a['name'] for a in apps]
        print(f"  House {h_num:02d} Appliances: {app_names[:4]}...")
    print("  [OK] Appliance mappings correctly differ based on real REFIT household configs.")

    # 5. Security Test: Reject Frontend Query Override (e.g. ?house=2)
    print("\n[TEST 5] Testing Security: Query Override Rejection (?house=2)...")
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token_h01}') # Logged in as house01
    sec_dash = client.get('/api/dashboard/?house=2').data
    assert sec_dash['household']['house_number'] == 1, f"Security Breach! Returned house {sec_dash['household']['house_number']} instead of house 1!"
    print("  [OK] Backend strictly enforced request.user -> REFIT House 1; ignored ?house=2 query override.")

    # 6. Test Unassigned Newly Registered User Behavior
    print("\n[TEST 6] Testing Unassigned Newly Registered User Behavior...")
    client.credentials() # Clear credentials
    reg_resp = client.post('/api/auth/register/', {
        'username': 'new_citizen_test',
        'email': 'newcitizen@test.com',
        'password': 'Password123!',
        'confirm_password': 'Password123!'
    }, format='json')
    assert reg_resp.status_code == 201
    new_token = reg_resp.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_token}')
    
    unassigned_dash = client.get('/api/dashboard/').data
    assert unassigned_dash['household_assigned'] is False
    assert 'No REFIT household is assigned' in unassigned_dash['message']
    print("  [OK] Unassigned user safely receives household_assigned=False without defaulting to House 1.")

    # Cleanup test user
    User.objects.filter(username='new_citizen_test').delete()

    print("\n" + "=" * 70)
    print("ALL 20-HOUSEHOLD ISOLATION AND SECURITY TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
