import os
import pandas as pd
import numpy as np
from django.conf import settings

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'data')
CSV_PATH = os.path.join(DATA_DIR, 'CLEAN_House1.csv')
CACHE_PATH_HOURLY = os.path.join(DATA_DIR, 'House1_hourly.parquet')
CACHE_PATH_DAILY = os.path.join(DATA_DIR, 'House1_daily.parquet')
CACHE_PATH_MINUTE = os.path.join(DATA_DIR, 'House1_minute.parquet')

# Using demo tariff by default
DEMO_TARIFF = 8.0 # Rs / kWh

def load_and_preprocess(include_minute=False):
    """
    Loads raw REFIT data, calculates hourly, daily, and 1-minute energy (kWh) and costs.
    Caches the results to disk (Parquet) for fast API responses.
    """
    if os.path.exists(CACHE_PATH_HOURLY) and os.path.exists(CACHE_PATH_DAILY) and (not include_minute or os.path.exists(CACHE_PATH_MINUTE)):
        df_hourly = pd.read_parquet(CACHE_PATH_HOURLY)
        df_daily = pd.read_parquet(CACHE_PATH_DAILY)
        if include_minute:
            df_minute = pd.read_parquet(CACHE_PATH_MINUTE)
            return df_hourly, df_daily, df_minute
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
    
    numeric_cols = [col for col in df.columns if col.startswith('Appliance') or col == 'Aggregate']
    
    # 1-minute resample
    df_minute_power = df[numeric_cols].resample('1min').mean().fillna(0)
    df_minute_energy = df_minute_power / 60000.0
    for col in numeric_cols:
        df_minute_energy[f'{col}_cost'] = df_minute_energy[col] * DEMO_TARIFF
        
    # 1-hour resample
    df_hourly_power = df[numeric_cols].resample('1h').mean().fillna(0)
    df_hourly_energy = df_hourly_power / 1000.0
    
    # Add time features for ML
    df_hourly_energy['hour'] = df_hourly_energy.index.hour
    df_hourly_energy['day_of_week'] = df_hourly_energy.index.dayofweek
    df_hourly_energy['is_weekend'] = df_hourly_energy['day_of_week'].isin([5, 6]).astype(int)
    
    # Calculate costs
    for col in numeric_cols:
        df_hourly_energy[f'{col}_cost'] = df_hourly_energy[col] * DEMO_TARIFF
        
    # Daily aggregation
    df_daily_energy = df_hourly_energy[numeric_cols].resample('1D').sum()
    for col in numeric_cols:
        df_daily_energy[f'{col}_cost'] = df_daily_energy[col] * DEMO_TARIFF

    df_daily_energy['day_of_week'] = df_daily_energy.index.dayofweek
    
    # Save to cache
    df_minute_energy.to_parquet(CACHE_PATH_MINUTE)
    df_hourly_energy.to_parquet(CACHE_PATH_HOURLY)
    df_daily_energy.to_parquet(CACHE_PATH_DAILY)
    print("Preprocessing complete.")
    
    if include_minute:
        return df_hourly_energy, df_daily_energy, df_minute_energy
    return df_hourly_energy, df_daily_energy

def get_dataset_bounds():
    df_hourly, _ = load_and_preprocess()
    return df_hourly.index.min(), df_hourly.index.max()

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

