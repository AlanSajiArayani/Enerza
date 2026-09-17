import os
import pandas as pd
import numpy as np
from django.conf import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
CSV_PATH = os.path.join(DATA_DIR, 'CLEAN_House1.csv')
CACHE_PATH_HOURLY = os.path.join(DATA_DIR, 'House1_hourly.parquet')
CACHE_PATH_DAILY = os.path.join(DATA_DIR, 'House1_daily.parquet')

# Using demo tariff by default
DEMO_TARIFF = 8.0 # Rs / kWh

def load_and_preprocess():
    """
    Loads raw REFIT data, calculates hourly and daily energy (kWh) and costs.
    Caches the results to disk (Parquet) for fast API responses.
    """
    if os.path.exists(CACHE_PATH_HOURLY) and os.path.exists(CACHE_PATH_DAILY):
        df_hourly = pd.read_parquet(CACHE_PATH_HOURLY)
        df_daily = pd.read_parquet(CACHE_PATH_DAILY)
        return df_hourly, df_daily

    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Data file not found at {CSV_PATH}. Please run download_refit.py")

    print("Preprocessing raw REFIT data (this may take a minute...)")
    # Load raw data
    df = pd.read_csv(CSV_PATH)
    
    # Check if 'Time' or 'Unix' exists
    if 'Time' in df.columns:
        df['Time'] = pd.to_datetime(df['Time'])
    elif 'Unix' in df.columns:
        df['Time'] = pd.to_datetime(df['Unix'], unit='s')
    
    df.set_index('Time', inplace=True)
    
    # The raw data is in Watts. Power (W) to Energy (kWh) over an interval (T seconds):
    # Energy (kWh) = (Power * T) / 3600000
    # But when we resample by taking the mean power over an hour,
    # the Energy for that hour is simply: mean_power (W) * 1 (h) / 1000
    
    # We will resample to 1H (hourly) mean Power.
    # Exclude 'Unix' and 'Issues' if they exist.
    numeric_cols = [col for col in df.columns if col.startswith('Appliance') or col == 'Aggregate']
    
    df_hourly_power = df[numeric_cols].resample('1h').mean().fillna(0)
    
    # Convert hourly mean power (W) to Energy (kWh)
    df_hourly_energy = df_hourly_power / 1000.0
    
    # Add time features for ML
    df_hourly_energy['hour'] = df_hourly_energy.index.hour
    df_hourly_energy['day_of_week'] = df_hourly_energy.index.dayofweek
    df_hourly_energy['is_weekend'] = df_hourly_energy['day_of_week'].isin([5, 6]).astype(int)
    
    # Calculate costs
    for col in numeric_cols:
        df_hourly_energy[f'{col}_cost'] = df_hourly_energy[col] * DEMO_TARIFF
        
    # Daily aggregation
    # For daily, energy is the sum of hourly energy
    df_daily_energy = df_hourly_energy[numeric_cols].resample('1D').sum()
    for col in numeric_cols:
        df_daily_energy[f'{col}_cost'] = df_daily_energy[col] * DEMO_TARIFF

    df_daily_energy['day_of_week'] = df_daily_energy.index.dayofweek
    
    # Save to cache
    df_hourly_energy.to_parquet(CACHE_PATH_HOURLY)
    df_daily_energy.to_parquet(CACHE_PATH_DAILY)
    print("Preprocessing complete.")
    
    return df_hourly_energy, df_daily_energy

def get_appliance_mapping():
    """
    Returns metadata mapping for House 1 appliances.
    If you swap dataset, you can update this mapping.
    """
    return {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge",
        "Appliance2": "Washing Machine",
        "Appliance3": "Television",
        "Appliance4": "Microwave",
        "Appliance5": "Dishwasher",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Computer",
        "Appliance9": "Heater"
    }
