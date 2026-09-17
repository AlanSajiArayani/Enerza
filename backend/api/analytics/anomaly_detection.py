import pandas as pd
from sklearn.ensemble import IsolationForest

def detect_anomalies(df_hourly):
    """
    Runs Isolation Forest on hourly appliance data to detect consumption anomalies.
    Returns a dataframe containing the anomalies.
    """
    anomalies = []
    
    # We focus on the last 7 days for the dashboard anomalies
    recent_df = df_hourly.tail(24 * 7).copy()
    
    appliance_cols = [col for col in recent_df.columns if col.startswith('Appliance') and not col.endswith('_cost')]
    
    for app in appliance_cols:
        # Features for IF
        # Consumption, Hour of day
        features = recent_df[[app, 'hour']].copy()
        
        # Only fit on non-zero consumption if the appliance is mostly off
        active_mask = features[app] > 0.01
        
        if active_mask.sum() < 24: # Not enough active data to model
            continue
            
        model = IsolationForest(contamination=0.05, random_state=42)
        # Fit on historical active periods (could be improved by training on full history)
        model.fit(features[active_mask])
        
        recent_df.loc[active_mask, f'{app}_anomaly'] = model.predict(features[active_mask])
        recent_df[f'{app}_anomaly'] = recent_df.get(f'{app}_anomaly', 1) # 1 is normal, -1 is anomaly
        
        # Extract the actual anomalies (-1)
        app_anomalies = recent_df[recent_df[f'{app}_anomaly'] == -1]
        
        for idx, row in app_anomalies.iterrows():
            if row[app] < 0.05: # ignore tiny anomalies
                continue
                
            # Calculate deviation from mean of this hour
            hist_mean = df_hourly[df_hourly['hour'] == row['hour']][app].mean()
            if row[app] <= hist_mean:
                continue # only flag unusually HIGH consumption
                
            deviation = ((row[app] - hist_mean) / hist_mean) * 100 if hist_mean > 0 else 100
            if deviation < 30: # at least 30% above normal
                continue
                
            excess_kwh = row[app] - hist_mean
            
            anomalies.append({
                'timestamp': idx.isoformat(),
                'appliance_id': app,
                'consumption': round(row[app], 3),
                'normal_avg': round(hist_mean, 3),
                'deviation_percent': round(deviation, 1),
                'excess_kwh': round(excess_kwh, 3),
                'estimated_cost': round(excess_kwh * 8.0, 2), # Using demo tariff
                'severity': 'high' if deviation > 100 else 'medium'
            })
            
    return sorted(anomalies, key=lambda x: x['timestamp'], reverse=True)
