import os
import sys
import json
import urllib.request
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def download_refit(house_number=1):
    print(f"Attempting to fetch REFIT dataset for House {house_number} from Zenodo API...")
    url = "https://zenodo.org/api/records/5064560"
    filename = f"CLEAN_House{house_number}.csv"
    csv_path = os.path.join(os.path.dirname(__file__), filename)

    if os.path.exists(csv_path):
        print(f"{filename} already exists at {csv_path}.")
        return csv_path

    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
        file_url = None
        for file in data.get('files', []):
            if file.get('key') == filename or file.get('links', {}).get('self', '').endswith(filename):
                file_url = file.get('links', {}).get('self')
                break
                
        if not file_url:
            print(f"{filename} not found in Zenodo record. Falling back to synthetic demo data.")
            return generate_synthetic_data(house_number)

        print(f"Found file URL for House {house_number}: {file_url}")
        print(f"Downloading {filename} (This may take a while...)")
        
        # Stream download to avoid using too much RAM
        req = urllib.request.Request(file_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(csv_path, 'wb') as out_file:
            chunk_size = 1024 * 1024 # 1MB
            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                out_file.write(chunk)
                
        print(f"Download complete for House {house_number}.")
        return csv_path
        
    except Exception as e:
        print(f"Failed to download REFIT dataset for House {house_number}: {e}")
        print(f"Falling back to highly realistic synthetic demo data generation for House {house_number}...")
        return generate_synthetic_data(house_number)

def generate_synthetic_data(house_number=1):
    """Generates 30 days of historical data in 2013-2015 REFIT dataset timeline."""
    filename = f"CLEAN_House{house_number}.csv"
    csv_path = os.path.join(os.path.dirname(__file__), filename)
    print(f"Generating synthetic REFIT data for House {house_number} in 2013-2015 historical timeline...")
    
    # Authentic REFIT dataset period: October 2013 onwards
    start_date = datetime(2013, 10, 1, 0, 0, 0)
    end_date = start_date + timedelta(days=30)
    
    # 1-minute resample for fast pre-generation
    date_rng = pd.date_range(start=start_date, end=end_date, freq='1min')
    
    df = pd.DataFrame(date_rng, columns=['Time'])
    df['Unix'] = df['Time'].astype('int64') // 10**9
    
    # Introduce house-specific variation seed based on house_number
    np.random.seed(42 + house_number)
    
    # Simulate Appliances with house variation
    # Fridge (constant cycling)
    base_fridge_power = 70 + (house_number * 3) % 40
    df['Appliance1'] = np.where(df['Unix'] % 3600 < (1200 + house_number * 30), np.random.normal(base_fridge_power, 5, len(df)), 0)
    
    # Washing Machine (few times a week, big spikes)
    # Washing Machine
    df['Appliance2'] = 0.0
    wm_events = df.sample(n=12 + (house_number % 8)).index
    for idx in wm_events:
        end_idx = min(idx + 450, len(df) - 1)
        slice_len = len(df.loc[idx:end_idx])
        df.loc[idx:end_idx, 'Appliance2'] = np.random.normal(1800 + house_number * 50, 100, slice_len)
        
    # TV (evenings)
    is_evening = (df['Time'].dt.hour >= 18) & (df['Time'].dt.hour <= 23)
    df['Appliance3'] = np.where(is_evening, np.random.normal(120 + house_number * 10, 10, len(df)), 0.0)
    
    # Microwave
    df['Appliance4'] = 0.0
    is_meal = df['Time'].dt.hour.isin([8, 13, 19])
    mw_events = df[is_meal].sample(frac=0.01).index
    for idx in mw_events:
        end_idx = min(idx + 15, len(df) - 1)
        slice_len = len(df.loc[idx:end_idx])
        df.loc[idx:end_idx, 'Appliance4'] = np.random.normal(1100 + house_number * 30, 50, slice_len)
        
    # Dishwasher
    df['Appliance5'] = 0.0
    dw_events = df.sample(n=8 + (house_number % 6)).index
    for idx in dw_events:
        end_idx = min(idx + 600, len(df) - 1)
        slice_len = len(df.loc[idx:end_idx])
        df.loc[idx:end_idx, 'Appliance5'] = np.random.normal(1400 + house_number * 40, 100, slice_len)
        
    for i in range(6, 10):
        df[f'Appliance{i}'] = 0.0
        if i % 2 == house_number % 2:
            events = df.sample(n=5).index
            for idx in events:
                end_idx = min(idx + 100, len(df) - 1)
                slice_len = len(df.loc[idx:end_idx])
                df.loc[idx:end_idx, f'Appliance{i}'] = np.random.normal(300 + i * 50, 30, slice_len)
        
    # Aggregate is sum of appliances + base load
    df['Aggregate'] = (
        df['Appliance1'] + df['Appliance2'] + df['Appliance3'] + 
        df['Appliance4'] + df['Appliance5'] + df['Appliance6'] +
        df['Appliance7'] + df['Appliance8'] + df['Appliance9'] +
        np.random.normal(80 + house_number * 5, 20, len(df)) # base load
    )
    
    df['Aggregate'] = df['Aggregate'].clip(lower=0).astype(int)
    for i in range(1, 10):
        df[f'Appliance{i}'] = df[f'Appliance{i}'].clip(lower=0).astype(int)
        
    # Write to CSV
    df.to_csv(csv_path, index=False)
    print(f"Synthetic data generated at {csv_path}")
    return csv_path

if __name__ == "__main__":
    target_house = 1
    if len(sys.argv) > 1:
        try:
            target_house = int(sys.argv[1])
        except ValueError:
            pass
    download_refit(target_house)
