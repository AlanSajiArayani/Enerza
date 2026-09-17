import os
import sys
import json
import urllib.request
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def download_refit():
    print("Attempting to fetch REFIT dataset from Zenodo API...")
    url = "https://zenodo.org/api/records/5064560"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
        file_url = None
        for file in data.get('files', []):
            if file.get('key') == 'CLEAN_House1.csv' or file.get('links', {}).get('self', '').endswith('CLEAN_House1.csv'):
                file_url = file.get('links', {}).get('self')
                break
                
        if not file_url:
            print("CLEAN_House1.csv not found in Zenodo record. Falling back to synthetic data.")
            generate_synthetic_data()
            return

        print(f"Found file URL: {file_url}")
        print("Downloading CLEAN_House1.csv (This may take a while...)")
        csv_path = os.path.join(os.path.dirname(__file__), "CLEAN_House1.csv")
        
        # Stream download to avoid using too much RAM
        req = urllib.request.Request(file_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(csv_path, 'wb') as out_file:
            chunk_size = 1024 * 1024 # 1MB
            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                out_file.write(chunk)
                
        print("Download complete.")
        
    except Exception as e:
        print(f"Failed to download REFIT dataset: {e}")
        print("Falling back to highly realistic synthetic data generation...")
        generate_synthetic_data()

def generate_synthetic_data():
    """Generates 30 days of data at 8-second intervals mimicking REFIT House 1."""
    print("Generating synthetic REFIT data (30 days at 8s intervals)...")
    csv_path = os.path.join(os.path.dirname(__file__), "CLEAN_House1.csv")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    # 8 second intervals
    date_rng = pd.date_range(start=start_date, end=end_date, freq='8s')
    
    df = pd.DataFrame(date_rng, columns=['Time'])
    df['Unix'] = df['Time'].astype('int64') // 10**9
    
    # Simulate Appliances
    # Fridge (constant cycling)
    df['Appliance1'] = np.where(df['Unix'] % 3600 < 1200, np.random.normal(80, 5, len(df)), 0)
    
    # Washing Machine (few times a week, big spikes)
    df['Appliance2'] = 0.0
    wm_events = df.sample(n=15).index
    for idx in wm_events:
        # runs for ~1 hour (450 * 8s = 3600s)
        end_idx = min(idx + 450, len(df))
        df.loc[idx:end_idx, 'Appliance2'] = np.random.normal(2000, 100, end_idx - idx + 1)
        
    # TV (evenings)
    is_evening = (df['Time'].dt.hour >= 18) & (df['Time'].dt.hour <= 23)
    df['Appliance3'] = np.where(is_evening, np.random.normal(150, 10, len(df)), 0.0)
    
    # Microwave (short spikes at meal times)
    df['Appliance4'] = 0.0
    is_meal = df['Time'].dt.hour.isin([8, 13, 19])
    mw_events = df[is_meal].sample(frac=0.01).index
    for idx in mw_events:
        end_idx = min(idx + 15, len(df)) # ~2 mins
        df.loc[idx:end_idx, 'Appliance4'] = np.random.normal(1200, 50, end_idx - idx + 1)
        
    # Dishwasher
    df['Appliance5'] = 0.0
    dw_events = df.sample(n=10).index
    for idx in dw_events:
        end_idx = min(idx + 600, len(df))
        df.loc[idx:end_idx, 'Appliance5'] = np.random.normal(1500, 100, end_idx - idx + 1)
        
    for i in range(6, 10):
        df[f'Appliance{i}'] = 0.0
        
    # Aggregate is sum of appliances + base load
    df['Aggregate'] = (
        df['Appliance1'] + df['Appliance2'] + df['Appliance3'] + 
        df['Appliance4'] + df['Appliance5'] + 
        np.random.normal(100, 20, len(df)) # base load
    )
    
    df['Aggregate'] = df['Aggregate'].clip(lower=0).astype(int)
    for i in range(1, 10):
        df[f'Appliance{i}'] = df[f'Appliance{i}'].clip(lower=0).astype(int)
        
    # Write to CSV
    df.to_csv(csv_path, index=False)
    print(f"Synthetic data generated at {csv_path}")

if __name__ == "__main__":
    download_refit()
