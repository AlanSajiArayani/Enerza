def detect_waste(df_hourly):
    """
    Rule-based waste detection on hourly appliance data.
    Rule 1: Extended usage (runs for many hours continuously).
    Rule 2: Vampire load / standby (constant low consumption 24/7).
    """
    waste_alerts = []
    
    # We focus on the last 7 days
    recent_df = df_hourly.tail(24 * 7).copy()
    
    appliance_cols = [col for col in recent_df.columns if col.startswith('Appliance') and not col.endswith('_cost')]
    
    for app in appliance_cols:
        # Rule 1: Extended usage
        # Detect if an appliance that normally runs < 3 hours is running for 10+ hours
        # This requires calculating rolling active hours
        is_active = recent_df[app] > 0.05
        rolling_active_24h = is_active.rolling(24).sum()
        
        # Check if today it ran much more than normal
        avg_daily_active = is_active.sum() / 7
        max_active_24h = rolling_active_24h.max()
        
        if max_active_24h > (avg_daily_active * 2) and max_active_24h > 5:
            # Found extended usage
            peak_time = rolling_active_24h.idxmax()
            excess_hours = max_active_24h - avg_daily_active
            avg_consumption = recent_df[is_active][app].mean()
            excess_kwh = excess_hours * avg_consumption
            
            if excess_kwh > 0.5:
                waste_alerts.append({
                    'timestamp': peak_time.isoformat(),
                    'appliance_id': app,
                    'issue': 'Extended Usage',
                    'explanation': f'Ran for {int(max_active_24h)} hours in a 24h period, normally runs for {int(avg_daily_active)} hours.',
                    'excess_kwh': round(excess_kwh, 2),
                    'estimated_cost': round(excess_kwh * 8.0, 2),
                    'recommendation': 'Reduce runtime or check if appliance was left on accidentally.',
                    'severity': 'high' if excess_kwh > 5 else 'medium'
                })
                
        # Rule 2: Vampire Load
        # Detect if appliance never goes to 0 (always > 0.01 kW = 10W)
        if recent_df[app].min() > 0.01:
            base_load = recent_df[app].min()
            wasted_kwh_per_month = base_load * 24 * 30
            
            # If vampire load costs more than Rs 100 / month
            if wasted_kwh_per_month * 8.0 > 100:
                waste_alerts.append({
                    'timestamp': recent_df.index[-1].isoformat(),
                    'appliance_id': app,
                    'issue': 'High Standby Power',
                    'explanation': f'Draws at least {round(base_load*1000)}W 24/7 even when not actively used.',
                    'excess_kwh': round(wasted_kwh_per_month, 2), # Monthly
                    'estimated_cost': round(wasted_kwh_per_month * 8.0, 2), # Monthly cost
                    'recommendation': 'Unplug when not in use or use a smart plug to cut power.',
                    'severity': 'medium'
                })

    # Deduplicate alerts for same appliance and issue
    seen = set()
    unique_alerts = []
    for alert in sorted(waste_alerts, key=lambda x: x['estimated_cost'], reverse=True):
        key = (alert['appliance_id'], alert['issue'])
        if key not in seen:
            seen.add(key)
            unique_alerts.append(alert)

    return unique_alerts
