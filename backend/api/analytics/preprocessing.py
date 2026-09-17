import os
import sys
import pandas as pd
import numpy as np
from django.conf import settings

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DATA_DIR = os.path.join(PROJECT_ROOT, 'data')

# Using demo tariff by default
DEMO_TARIFF = 8.0 # Rs / kWh

HOUSEHOLD_CONFIG = {
    1: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Computer",
        "Appliance5": "Television Site",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Hi-Fi / DVD"
    },
    2: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Hi-Fi",
        "Appliance9": "Computer"
    },
    3: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Freezer",
        "Appliance3": "Washing Machine",
        "Appliance4": "Dishwasher",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Tumble Dryer",
        "Appliance9": "Computer"
    },
    4: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Air Conditioning",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Computer",
        "Appliance8": "Dishwasher",
        "Appliance9": "Freezer"
    },
    5: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Tumble Dryer",
        "Appliance3": "Washing Machine",
        "Appliance4": "Dishwasher",
        "Appliance5": "Computer",
        "Appliance6": "Television",
        "Appliance7": "Microwave",
        "Appliance8": "Kettle",
        "Appliance9": "Toaster"
    },
    6: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Computer",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Freezer"
    },
    7: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Freezer",
        "Appliance3": "Washing Machine",
        "Appliance4": "Dishwasher",
        "Appliance5": "Computer",
        "Appliance6": "Television",
        "Appliance7": "Microwave",
        "Appliance8": "Kettle",
        "Appliance9": "Toaster"
    },
    8: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Tumble Dryer",
        "Appliance4": "Dishwasher",
        "Appliance5": "Computer",
        "Appliance6": "Television",
        "Appliance7": "Microwave",
        "Appliance8": "Kettle",
        "Appliance9": "Toaster"
    },
    9: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Computer",
        "Appliance9": "Electric Heater"
    },
    10: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Freezer",
        "Appliance3": "Washing Machine",
        "Appliance4": "Dishwasher",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Computer"
    },
    11: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Computer",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Network Router"
    },
    12: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Computer",
        "Appliance9": "Freezer"
    },
    13: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Computer",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Dehumidifier"
    },
    14: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Computer",
        "Appliance9": "Electric Heater"
    },
    15: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Computer",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Tumble Dryer"
    },
    16: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Computer",
        "Appliance9": "Electric Heater"
    },
    17: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Freezer",
        "Appliance3": "Washing Machine",
        "Appliance4": "Dishwasher",
        "Appliance5": "Computer",
        "Appliance6": "Television",
        "Appliance7": "Microwave",
        "Appliance8": "Kettle",
        "Appliance9": "Toaster"
    },
    18: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Computer",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Garage Equipment"
    },
    19: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Washing Machine",
        "Appliance3": "Dishwasher",
        "Appliance4": "Television",
        "Appliance5": "Microwave",
        "Appliance6": "Kettle",
        "Appliance7": "Toaster",
        "Appliance8": "Computer",
        "Appliance9": "Freezer"
    },
    20: {
        "Aggregate": "Total Household",
        "Appliance1": "Fridge-Freezer",
        "Appliance2": "Freezer",
        "Appliance3": "Washing Machine",
        "Appliance4": "Dishwasher",
        "Appliance5": "Television",
        "Appliance6": "Microwave",
        "Appliance7": "Kettle",
        "Appliance8": "Toaster",
        "Appliance9": "Computer"
    }
}

def get_user_refit_household(user):
    """
    Centralized backend helper to derive REFIT household assignment from authenticated user.
    Returns tuple: (house_number, refit_household_obj) or (None, None).
    """
    if user and user.is_authenticated and hasattr(user, 'refit_household') and user.refit_household.is_active:
        return user.refit_household.house_number, user.refit_household
    return None, None

def load_and_preprocess(house_number=1, include_minute=False):
    """
    Loads raw REFIT data for specified house_number, calculates hourly, daily, and 1-minute energy (kWh) and costs.
    Caches the results to disk (Parquet) for fast API responses.
    """
    csv_path = os.path.join(DATA_DIR, f'CLEAN_House{house_number}.csv')
    cache_hourly = os.path.join(DATA_DIR, f'House{house_number}_hourly.parquet')
    cache_daily = os.path.join(DATA_DIR, f'House{house_number}_daily.parquet')
    cache_minute = os.path.join(DATA_DIR, f'House{house_number}_minute.parquet')

    if os.path.exists(cache_hourly) and os.path.exists(cache_daily) and (not include_minute or os.path.exists(cache_minute)):
        df_hourly = pd.read_parquet(cache_hourly)
        df_daily = pd.read_parquet(cache_daily)
        if include_minute:
            df_minute = pd.read_parquet(cache_minute)
            return df_hourly, df_daily, df_minute
        return df_hourly, df_daily

    if not os.path.exists(csv_path):
        # Auto-download or generate synthetic data if missing
        try:
            from data.download_refit import download_refit
            download_refit(house_number)
        except Exception as e:
            raise FileNotFoundError(f"Data file not found at {csv_path} and failed auto-generation: {e}")

    print(f"Preprocessing raw REFIT data for House {house_number}...")
    # Load raw data
    df = pd.read_csv(csv_path)
    
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
    df_minute_energy.to_parquet(cache_minute)
    df_hourly_energy.to_parquet(cache_hourly)
    df_daily_energy.to_parquet(cache_daily)
    print(f"Preprocessing complete for House {house_number}.")
    
    if include_minute:
        return df_hourly_energy, df_daily_energy, df_minute_energy
    return df_hourly_energy, df_daily_energy

def get_dataset_bounds(house_number=1):
    df_hourly, _ = load_and_preprocess(house_number=house_number)
    return df_hourly.index.min(), df_hourly.index.max()

def get_appliance_mapping(house_number=1):
    """
    Returns metadata mapping for House N appliances.
    """
    if house_number in HOUSEHOLD_CONFIG:
        return HOUSEHOLD_CONFIG[house_number]
    
    # Neutral default fallback if house_number is outside 1..20
    return {
        "Aggregate": "Total Household",
        "Appliance1": "Appliance 1",
        "Appliance2": "Appliance 2",
        "Appliance3": "Appliance 3",
        "Appliance4": "Appliance 4",
        "Appliance5": "Appliance 5",
        "Appliance6": "Appliance 6",
        "Appliance7": "Appliance 7",
        "Appliance8": "Appliance 8",
        "Appliance9": "Appliance 9",
    }


