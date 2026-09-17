import pandas as pd
from sklearn.ensemble import IsolationForest

def detect_anomalies(df_hourly):
    """
    Runs Isolation Forest on hourly appliance data to detect consumption anomalies,
    and identifies real-time abnormal high usage spikes.
    """
    anomalies = []
    if df_hourly is None or len(df_hourly) == 0:
        return anomalies

    latest_timestamp = df_hourly.index.max()
    recent_df = df_hourly.tail(24 * 7).copy()
    
    appliance_cols = [col for col in recent_df.columns if col.startswith('Appliance') and not col.endswith('_cost')]
    
    for app in appliance_cols:
        features = recent_df[[app, 'hour']].copy()
        active_mask = features[app] > 0.01
        
        if active_mask.sum() < 12:
            continue
            
        model = IsolationForest(contamination=0.08, random_state=42)
        model.fit(features[active_mask])
        
        recent_df.loc[active_mask, f'{app}_anomaly'] = model.predict(features[active_mask])
        recent_df[f'{app}_anomaly'] = recent_df.get(f'{app}_anomaly', 1)
        
        app_anomalies = recent_df[recent_df[f'{app}_anomaly'] == -1]
        
        for idx, row in app_anomalies.iterrows():
            if row[app] < 0.05:
                continue
                
            hist_mean = df_hourly[df_hourly['hour'] == row['hour']][app].mean()
            if row[app] <= hist_mean:
                continue
                
            deviation = ((row[app] - hist_mean) / hist_mean) * 100 if hist_mean > 0 else 100
            if deviation < 25:
                continue
                
            excess_kwh = row[app] - hist_mean
            time_diff_hours = (latest_timestamp - idx).total_seconds() / 3600.0 if pd.notnull(idx) else 999
            # Real-time alert is strictly defined as occurring in the current simulation hour
            is_realtime = (time_diff_hours <= 1.0)
            
            anomalies.append({
                'timestamp': idx.isoformat(),
                'appliance_id': app,
                'issue': 'Abnormal High Usage Surge' if deviation > 75 else 'Abnormal Consumption Spike',
                'consumption': round(row[app], 3),
                'normal_avg': round(hist_mean, 3),
                'deviation_percent': round(deviation, 1),
                'excess_kwh': round(excess_kwh, 3),
                'estimated_cost': round(excess_kwh * 8.0, 2),
                'severity': 'high' if (deviation > 100 or is_realtime) else 'medium',
                'is_realtime': is_realtime,
                'explanation': f"Current consumption ({round(row[app], 2)} kWh) is {round(deviation, 1)}% above average for this time window.",
                'recommendation': "Inspect appliance immediately for malfunction or unneeded operation."
            })
            
    return sorted(anomalies, key=lambda x: (x['is_realtime'], x['timestamp']), reverse=True)

