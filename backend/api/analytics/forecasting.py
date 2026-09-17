import pandas as pd
import numpy as np
from datetime import timedelta

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    from sklearn.ensemble import RandomForestRegressor

def forecast_consumption(df_hourly):
    """
    Uses XGBoost Regressor to predict Aggregate consumption for the next 7 days.
    """
    df = df_hourly[['Aggregate', 'hour', 'day_of_week', 'is_weekend']].copy()
    
    # Create lag features
    df['lag_1h'] = df['Aggregate'].shift(1)
    df['lag_24h'] = df['Aggregate'].shift(24)
    df['lag_1w'] = df['Aggregate'].shift(24 * 7)
    df['rolling_24h_mean'] = df['Aggregate'].rolling(window=24).mean()
    
    df = df.dropna()
    
    if len(df) < 24 * 7:
        # Not enough data for lag_1w, gracefully degrade
        return fallback_forecast(df_hourly)
        
    X = df[['hour', 'day_of_week', 'is_weekend', 'lag_1h', 'lag_24h', 'lag_1w', 'rolling_24h_mean']]
    y = df['Aggregate']
    
    if HAS_XGBOOST:
        model = XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        )
    else:
        model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
    model.fit(X, y)
    
    # Predict next 7 days (168 hours)
    last_time = df.index[-1]
    future_times = [last_time + timedelta(hours=i) for i in range(1, 168 + 1)]
    
    future_df = pd.DataFrame(index=future_times)
    future_df['hour'] = future_df.index.hour
    future_df['day_of_week'] = future_df.index.dayofweek
    future_df['is_weekend'] = future_df['day_of_week'].isin([5, 6]).astype(int)
    
    # Autoregressive prediction
    predictions = []
    
    # We need to simulate the rolling features. 
    # For a hackathon demo, using the last known lag_24h and lag_1w from history is an acceptable approximation.
    history_aggregate = df['Aggregate'].tolist()
    
    for i in range(168):
        h = future_df.iloc[i]
        lag_1h = predictions[-1] if i > 0 else df['Aggregate'].iloc[-1]
        lag_24h = history_aggregate[-(24 - i)] if i < 24 else predictions[i - 24]
        lag_1w = history_aggregate[-(168 - i)] if i < 168 else predictions[i - 168]
        
        # Approximate rolling mean
        if i == 0:
            rolling_24h = df['rolling_24h_mean'].iloc[-1]
        else:
            window = (history_aggregate[-(24-i):] + predictions) if i < 24 else predictions[-24:]
            rolling_24h = np.mean(window)
            
        x_pred = pd.DataFrame([{
            'hour': h['hour'],
            'day_of_week': h['day_of_week'],
            'is_weekend': h['is_weekend'],
            'lag_1h': lag_1h,
            'lag_24h': lag_24h,
            'lag_1w': lag_1w,
            'rolling_24h_mean': rolling_24h
        }])
        
        pred = model.predict(x_pred)[0]
        # Never predict negative energy
        pred = max(0, pred)
        predictions.append(pred)
        history_aggregate.append(pred)
        
    future_df['predicted_aggregate'] = predictions
    
    # Format response
    forecast_data = []
    for t, row in future_df.iterrows():
        forecast_data.append({
            'timestamp': t.isoformat(),
            'predicted_kwh': round(row['predicted_aggregate'], 3)
        })
        
    return forecast_data

def fallback_forecast(df_hourly):
    """
    Statistical baseline if ML fails or insufficient data.
    Uses the average of that hour for that day of the week.
    """
    last_time = df_hourly.index[-1]
    future_times = [last_time + timedelta(hours=i) for i in range(1, 168 + 1)]
    
    avg_by_hour_day = df_hourly.groupby(['day_of_week', 'hour'])['Aggregate'].mean()
    
    forecast_data = []
    for t in future_times:
        d = t.dayofweek
        h = t.hour
        pred = avg_by_hour_day.get((d, h), df_hourly['Aggregate'].mean())
        forecast_data.append({
            'timestamp': t.isoformat(),
            'predicted_kwh': round(pred, 3) if not pd.isna(pred) else 0.0
        })
        
    return forecast_data
