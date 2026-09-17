import pandas as pd
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .analytics.preprocessing import load_and_preprocess, get_appliance_mapping

from .analytics.anomaly_detection import detect_anomalies
from .analytics.forecasting import forecast_consumption
from .analytics.waste_detection import detect_waste
from .analytics.ai_advisor import get_ai_advice

@api_view(['GET'])
def dashboard_summary(request):
    try:
        df_hourly, df_daily, df_minute = load_and_preprocess(include_minute=True)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    mapping = get_appliance_mapping()
    dataset_start = df_hourly.index.min()
    dataset_end = df_hourly.index.max()
    
    simulation_param = request.GET.get('simulation_time')
    if simulation_param:
        try:
            sim_dt = pd.to_datetime(simulation_param)
        except Exception:
            sim_dt = dataset_end - pd.Timedelta(days=7)
    else:
        sim_dt = dataset_end - pd.Timedelta(days=7)
        
    # Clamp simulation time to dataset range
    if sim_dt < dataset_start:
        sim_dt = dataset_start
    elif sim_dt > dataset_end:
        sim_dt = dataset_end
        
    # Historical filter up to simulation time
    df_hourly_hist = df_hourly[df_hourly.index <= sim_dt]
    df_daily_hist = df_daily[df_daily.index <= sim_dt.floor('D')]
    df_minute_hist = df_minute[df_minute.index <= sim_dt]
    
    if len(df_hourly_hist) == 0:
        df_hourly_hist = df_hourly.iloc[:1]
    if len(df_daily_hist) == 0:
        df_daily_hist = df_daily.iloc[:1]
        
    sim_today_start = sim_dt.floor('D')
    today_minute_slice = df_minute_hist[df_minute_hist.index >= sim_today_start]
    
    if len(today_minute_slice) > 0:
        today_energy = float(today_minute_slice['Aggregate'].sum())
        today_cost = today_energy * 8.0
    else:
        today_row = df_daily_hist.iloc[-1]
        today_energy = float(today_row['Aggregate'])
        today_cost = float(today_row['Aggregate_cost'])
        
    sim_yesterday_start = sim_today_start - pd.Timedelta(days=1)
    yesterday_slice = df_hourly_hist[(df_hourly_hist.index >= sim_yesterday_start) & (df_hourly_hist.index < sim_today_start)]
    
    if len(yesterday_slice) > 0:
        yesterday_energy = float(yesterday_slice['Aggregate'].sum())
    else:
        yesterday_energy = today_energy
        
    pct_change = ((today_energy - yesterday_energy) / yesterday_energy * 100) if yesterday_energy else 0
    
    # Efficiency score (mock heuristic)
    score = 100 - min(100, max(0, pct_change) + 5)
    
    # Appliance Distribution for pie chart (last 30 days up to sim_dt)
    app_cols = [c for c in df_daily.columns if c.startswith('Appliance') and not c.endswith('_cost')]
    app_distribution = []
    slice_30d = df_daily_hist[df_daily_hist.index >= (sim_today_start - pd.Timedelta(days=30))]
    
    for app in app_cols:
        consumption = float(slice_30d[app].sum()) if len(slice_30d) > 0 else float(df_daily_hist.tail(30)[app].sum())
        if consumption > 0:
            app_distribution.append({
                'id': app,
                'name': mapping.get(app, app),
                'value': round(consumption, 2)
            })
            
    # Sort for top consumers
    app_distribution = sorted(app_distribution, key=lambda x: x['value'], reverse=True)
    
    # Hourly consumption for the last 24h up to sim_dt
    recent_24h = df_hourly_hist.tail(24)
    hourly_trend = []
    for t, row in recent_24h.iterrows():
        hourly_trend.append({
            'time': f"{t.hour:02d}:00",
            'Aggregate': round(row['Aggregate'], 3)
        })
        
    # Waste & Savings potential up to sim_dt
    waste_alerts = detect_waste(df_hourly_hist)
    potential_savings = sum([a['estimated_cost'] for a in waste_alerts])
    
    is_refit = 'Zenodo' not in str(df_daily.index)
    
    return Response({
        'today_energy': round(today_energy, 2),
        'pct_change': round(pct_change, 1),
        'estimated_cost': round(today_cost, 2),
        'efficiency_score': int(score),
        'potential_savings': round(potential_savings, 2),
        'appliance_distribution': app_distribution,
        'hourly_trend': hourly_trend,
        'status': 'Live Data (REFIT)' if is_refit else 'Demo Data',
        'simulation_time': sim_dt.isoformat(),
        'dataset_start': dataset_start.isoformat(),
        'dataset_end': dataset_end.isoformat(),
        'replay_active': True,
        'data_source': 'REFIT Historical Data' if is_refit else 'Demo Data'
    })


@api_view(['GET'])
def get_appliances(request):
    try:
        df_hourly, df_daily = load_and_preprocess()
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    mapping = get_appliance_mapping()
    app_cols = [c for c in df_daily.columns if c.startswith('Appliance') and not c.endswith('_cost')]
    
    appliances = []
    for app in app_cols:
        today_kwh = float(df_daily.iloc[-1][app])
        monthly_kwh = float(df_daily.tail(30)[app].sum())
        
        # Calculate daily average
        avg_kwh = float(df_daily[app].mean())
        
        status = "Normal"
        if today_kwh > avg_kwh * 1.5:
            status = "Elevated"
            
        appliances.append({
            'id': app,
            'name': mapping.get(app, app),
            'today_kwh': round(today_kwh, 2),
            'monthly_kwh': round(monthly_kwh, 2),
            'estimated_cost': round(today_kwh * 8.0, 2),
            'avg_kwh': round(avg_kwh, 2),
            'status': status
        })
        
    return Response(appliances)

@api_view(['GET'])
def get_alerts(request):
    try:
        df_hourly, _ = load_and_preprocess()
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    waste_alerts = detect_waste(df_hourly)
    anomaly_alerts = detect_anomalies(df_hourly)
    
    mapping = get_appliance_mapping()
    
    # Format and combine
    all_alerts = []
    
    for w in waste_alerts:
        w['appliance_name'] = mapping.get(w['appliance_id'], w['appliance_id'])
        w['type'] = 'waste'
        all_alerts.append(w)
        
    for a in anomaly_alerts:
        a['appliance_name'] = mapping.get(a['appliance_id'], a['appliance_id'])
        a['issue'] = 'Abnormal Consumption Spike'
        a['explanation'] = f"Consumed {a['deviation_percent']}% more than normal at this hour."
        a['type'] = 'anomaly'
        a['recommendation'] = "Check if appliance is malfunctioning or was left running."
        all_alerts.append(a)
        
    # Sort by timestamp
    all_alerts.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    return Response(all_alerts)

@api_view(['GET'])
def get_forecast(request):
    try:
        df_hourly, _ = load_and_preprocess()
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    forecast_data = forecast_consumption(df_hourly)
    
    # Return historical + forecast
    recent_history = df_hourly.tail(48)
    history_data = []
    for t, row in recent_history.iterrows():
        history_data.append({
            'timestamp': t.isoformat(),
            'actual_kwh': round(row['Aggregate'], 3)
        })
        
    return Response({
        'history': history_data,
        'forecast': forecast_data
    })

@api_view(['POST'])
def ai_advisor(request):
    question = request.data.get('question')
    
    try:
        df_hourly, df_daily = load_and_preprocess()
        mapping = get_appliance_mapping()
        
        # Build facts
        today = df_daily.iloc[-1]
        app_cols = [c for c in df_daily.columns if c.startswith('Appliance') and not c.endswith('_cost')]
        top_app = max(app_cols, key=lambda c: today[c])
        
        facts = {
            'total_energy_today_kwh': round(today['Aggregate'], 2),
            'top_consuming_appliance': mapping.get(top_app, top_app),
            'top_appliance_kwh': round(today[top_app], 2),
            'detected_anomalies': len(detect_anomalies(df_hourly)),
            'detected_waste_events': len(detect_waste(df_hourly))
        }
        
        advice = get_ai_advice(facts, question)
        return Response({'response': advice})
    except Exception as e:
        return Response({'error': str(e)}, status=500)
