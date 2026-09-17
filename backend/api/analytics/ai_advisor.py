import os
import json
import requests

def get_ai_advice(facts, user_question=None):
    """
    Takes processed facts from numerical analytics and sends them to an LLM.
    If no API key is present, falls back to a dummy response.
    """
    prompt = f"""
    You are WattWise AI, an expert household energy advisor.
    The user's home has the following energy profile:
    {json.dumps(facts, indent=2)}
    """
    
    if user_question:
        prompt += f"\nUser Question: {user_question}\n"
        prompt += "Answer the user's question clearly, concisely, and based ONLY on the facts provided above. Provide actionable advice."
    else:
        prompt += "\nProvide a brief summary of the energy usage and 3 actionable tips to save energy and reduce costs based on the anomalies or waste detected."

    gemini_key = os.environ.get("GEMINI_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")

    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            res = requests.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                return data['candidates'][0]['content']['parts'][0]['text']
        except Exception as e:
            print("Gemini API failed:", e)
            
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are WattWise AI, an expert energy advisor."},
                    {"role": "user", "content": prompt}
                ]
            }
            res = requests.post(url, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return data['choices'][0]['message']['content']
        except Exception as e:
            print("OpenAI API failed:", e)

    # Fallback response
    return (
        "*(Note: AI provider API keys not configured. Showing simulated response.)*\n\n"
        "Based on your current consumption profile:\n"
        "1. Your total energy consumption is slightly above the baseline. Consider optimizing your usage during peak hours.\n"
        "2. We noticed elevated consumption from some of your appliances. If these are running longer than usual, "
        "consider reducing their runtime.\n"
        "3. Unplug devices that have high standby power to save on passive energy waste."
    )
