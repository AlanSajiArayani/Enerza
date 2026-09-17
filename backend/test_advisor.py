import os
import sys
import django

sys.path.append(r'z:\Projects\Enerza\Enerza\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'enerza.settings')
django.setup()

from api.analytics.ai_advisor import get_ai_advice

# Call the logic directly to see if gemini is initialized and working
try:
    facts = {"total_consumption": 100, "anomalies": []}
    insights = get_ai_advice(facts)
    print("Advisor Insights Output:")
    print(insights)
except Exception as e:
    print("Error calling advisor:")
    print(e)
