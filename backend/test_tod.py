import os
import sys
import django

sys.path.append(r'z:\Projects\Enerza\Enerza\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enerza.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import REFITHousehold
from rest_framework.test import APIClient

User = get_user_model()

def test_tod():
    h1 = REFITHousehold.objects.filter(house_number=1).first()
    if h1 and h1.user:
        user = h1.user
    else:
        user = User.objects.filter(username__icontains='house1').first() or User.objects.first()
        
    client = APIClient()
    client.force_authenticate(user=user)
    
    # Requesting dashboard
    res = client.get('/api/dashboard/')
    assert res.status_code == 200, res.data
    data = res.data
    
    if not data.get("household_assigned"):
        print("No household assigned.")
        return
    
    print("Estimated Cost: ", data.get("estimated_cost"))
    tod = data.get("tod_analysis")
    print("ToD Analysis:")
    print("Day:", tod.get("day"))
    print("Peak:", tod.get("peak"))
    print("Night:", tod.get("night"))
    print("Total Cost:", tod.get("total_cost"))

if __name__ == "__main__":
    test_tod()
