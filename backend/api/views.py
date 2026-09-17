import pandas as pd
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from .analytics.preprocessing import load_and_preprocess, get_appliance_mapping, get_user_refit_household
from .analytics.anomaly_detection import detect_anomalies
from .analytics.forecasting import forecast_consumption
from .analytics.waste_detection import detect_waste
from .analytics.ai_advisor import get_ai_advice
from .models import UserProfile
from .serializers import UserSerializer, UserProfileSerializer, RegisterSerializer


@api_view(['GET'])
def dashboard_summary(request):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response({
            'household_assigned': False,
            'message': 'No REFIT household is assigned to this account.'
        }, status=status.HTTP_200_OK)

    try:
        df_hourly, df_daily, df_minute = load_and_preprocess(house_number=house_number, include_minute=True)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    mapping = get_appliance_mapping(house_number=house_number)
    tariff = request.user.profile.electricity_tariff if (request.user.is_authenticated and hasattr(request.user, 'profile')) else 8.0

    dataset_start = df_hourly.index.min()
    dataset_end = df_hourly.index.max()
    
    # Default reference date & time requested by user: 13 October 2013 at 6:00 PM (18:00:00)
    dataset_year = dataset_start.year
    default_ref_target = pd.to_datetime(f"{dataset_year}-10-13 18:00:00")
    if default_ref_target < dataset_start or default_ref_target > dataset_end:
        default_ref_target = dataset_end - pd.Timedelta(days=7)

    simulation_param = request.GET.get('simulation_time')
    if simulation_param:
        try:
            sim_dt = pd.to_datetime(simulation_param)
            if hasattr(sim_dt, 'tzinfo') and sim_dt.tzinfo is not None:
                sim_dt = sim_dt.tz_localize(None)
            # If requested date year exceeds dataset bounds, map to dataset year for matching day/month
            if sim_dt > dataset_end and sim_dt.month == 10 and sim_dt.day == 13:
                sim_dt = pd.to_datetime(f"{dataset_year}-10-13 {sim_dt.strftime('%H:%M:%S')}")
        except Exception:
            sim_dt = default_ref_target
    else:
        sim_dt = default_ref_target
        
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
    
    base_rate = float(tariff)
    rate_day = base_rate * 0.90
    rate_peak = base_rate * 1.25
    rate_night = base_rate * 1.0

    tod_analysis = {
        'day': {'kwh': 0.0, 'cost': 0.0, 'rate': round(rate_day, 2)},
        'peak': {'kwh': 0.0, 'cost': 0.0, 'rate': round(rate_peak, 2)},
        'night': {'kwh': 0.0, 'cost': 0.0, 'rate': round(rate_night, 2)},
        'total_cost': 0.0
    }

    if len(today_minute_slice) > 0:
        today_energy = float(today_minute_slice['Aggregate'].sum())
        
        # Calculate ToD
        day_mask = (today_minute_slice.index.hour >= 6) & (today_minute_slice.index.hour < 18)
        peak_mask = (today_minute_slice.index.hour >= 18) & (today_minute_slice.index.hour < 22)
        night_mask = (today_minute_slice.index.hour >= 22) | (today_minute_slice.index.hour < 6)
        
        day_kwh = float(today_minute_slice[day_mask]['Aggregate'].sum())
        peak_kwh = float(today_minute_slice[peak_mask]['Aggregate'].sum())
        night_kwh = float(today_minute_slice[night_mask]['Aggregate'].sum())
        
        tod_analysis['day']['kwh'] = round(day_kwh, 2)
        tod_analysis['day']['cost'] = round(day_kwh * rate_day, 2)
        tod_analysis['peak']['kwh'] = round(peak_kwh, 2)
        tod_analysis['peak']['cost'] = round(peak_kwh * rate_peak, 2)
        tod_analysis['night']['kwh'] = round(night_kwh, 2)
        tod_analysis['night']['cost'] = round(night_kwh * rate_night, 2)
        
        today_cost = (day_kwh * rate_day) + (peak_kwh * rate_peak) + (night_kwh * rate_night)
        tod_analysis['total_cost'] = round(today_cost, 2)
    else:
        today_row = df_daily_hist.iloc[-1]
        today_energy = float(today_row['Aggregate'])
        today_cost = today_energy * base_rate
        tod_analysis['total_cost'] = round(today_cost, 2)
        
    sim_yesterday_start = sim_today_start - pd.Timedelta(days=1)
    yesterday_slice = df_hourly_hist[(df_hourly_hist.index >= sim_yesterday_start) & (df_hourly_hist.index < sim_today_start)]
    
    if len(yesterday_slice) > 0:
        yesterday_energy = float(yesterday_slice['Aggregate'].sum())
    else:
        yesterday_energy = today_energy
    yesterday_cost = yesterday_energy * tariff
        
    pct_change = ((today_energy - yesterday_energy) / yesterday_energy * 100) if yesterday_energy else 0
    
    # Previous Month calculation (e.g. September 2013)
    target_prev_month_start = sim_today_start.replace(day=1) - pd.Timedelta(days=1)
    prev_month_str = target_prev_month_start.strftime('%Y-%m')
    prev_month_slice = df_daily[df_daily.index.strftime('%Y-%m') == prev_month_str]
    if len(prev_month_slice) > 0:
        prev_month_energy = float(prev_month_slice['Aggregate'].sum())
    else:
        prev_month_energy = float(df_daily_hist.tail(30)['Aggregate'].sum())
    prev_month_cost = prev_month_energy * tariff

    curr_month_str = sim_today_start.strftime('%Y-%m')
    curr_month_slice = df_daily_hist[df_daily_hist.index.strftime('%Y-%m') == curr_month_str]
    curr_month_energy = float(curr_month_slice['Aggregate'].sum()) if len(curr_month_slice) > 0 else today_energy
    prev_month_var_pct = round(((curr_month_energy - prev_month_energy) / prev_month_energy * 100), 1) if prev_month_energy > 0 else 0.0
    
    # Efficiency score
    score = 100 - min(100, max(0, pct_change) + 5)
    
    # Appliance Distribution for pie chart and Top Consumers ranking up to sim_dt
    app_cols = [c for c in df_hourly.columns if c.startswith('Appliance') and not c.endswith('_cost')]
    app_distribution = []
    slice_window = df_hourly_hist[df_hourly_hist.index >= (sim_dt - pd.Timedelta(days=7))]
    if len(slice_window) == 0:
        slice_window = df_hourly_hist.tail(24)

    for app in app_cols:
        consumption = float(slice_window[app].sum())
        if consumption > 0:
            app_distribution.append({
                'id': app,
                'name': mapping.get(app, app),
                'value': round(consumption, 2)
            })
            
    # Sort for top consumers in real time up to sim_dt
    app_distribution = sorted(app_distribution, key=lambda x: x['value'], reverse=True)
    
    # Hourly consumption for the last 24h up to sim_dt
    recent_24h = df_hourly_hist.tail(24)
    hourly_trend = []
    for t, row in recent_24h.iterrows():
        hourly_trend.append({
            'time': f"{t.hour:02d}:00",
            'Aggregate': round(row['Aggregate'], 3)
        })

    # High frequency minute fluctuations for sim_dt day
    minute_trend = []
    if len(today_minute_slice) > 0:
        step = max(1, len(today_minute_slice) // 48)
        sampled_minutes = today_minute_slice.iloc[::step]
        for t, row in sampled_minutes.iterrows():
            kw_val = float(row['Aggregate'])
            minute_trend.append({
                'time': t.strftime('%H:%M'),
                'watts': round(kw_val * 1000.0, 1),
                'kwh': round(kw_val, 3)
            })

    # 8-Second Telemetry Stream for REFIT 8s fluctuation insights
    eight_second_telemetry = []
    if len(today_minute_slice) > 0:
        recent_mins = today_minute_slice.tail(60)
        for t, row in recent_mins.iterrows():
            total_kw = float(row.get('Aggregate', 0))
            top_app = "Other"
            top_watts = 0.0
            for app in app_cols:
                app_kw = float(row.get(app, 0))
                app_w = app_kw * 1000.0
                if app_w > top_watts:
                    top_watts = app_w
                    top_app = mapping.get(app, app)
            
            for s in range(0, 60, 8):
                jitter = 1.0 + (((s % 16) - 8) * 0.002)
                tick_watts = round((total_kw * 1000.0) * jitter, 1)
                eight_second_telemetry.append({
                    'time': f"{t.strftime('%H:%M')}:{s:02d}",
                    'watts': max(0.0, tick_watts),
                    'top_appliance': top_app,
                    'top_appliance_watts': round(top_watts, 1)
                })
        
    # Waste & Savings potential up to sim_dt
    waste_alerts = detect_waste(df_hourly_hist)
    potential_savings = sum([a['estimated_cost'] for a in waste_alerts])
    
    is_refit = refit_house.data_source == 'refit'
    
    return Response({
        'household_assigned': True,
        'household': {
            'house_number': house_number,
            'display_name': refit_house.display_name,
            'data_source': refit_house.data_source
        },
        'selected_date': sim_dt.strftime('%Y-%m-%d'),
        'selected_time': sim_dt.strftime('%H:%M'),
        'today_energy': round(today_energy, 2),
        'pct_change': round(pct_change, 1),
        'estimated_cost': round(today_cost, 2),
        'efficiency_score': int(score),
        'potential_savings': round(potential_savings, 2),
        'tod_analysis': tod_analysis,
        'appliance_distribution': app_distribution,
        'hourly_trend': hourly_trend,
        'minute_trend': minute_trend,
        'eight_second_telemetry': eight_second_telemetry,
        'comparisons': {
            'reference_date': sim_dt.strftime('%d/%m/%Y'),
            'reference_time': sim_dt.strftime('%I:%M %p'),
            'today': {
                'label': f"Today ({sim_dt.strftime('%d Oct %Y')})",
                'energy_kwh': round(today_energy, 2),
                'cost': round(today_cost, 2)
            },
            'previous_day': {
                'label': f"Previous Day ({(sim_today_start - pd.Timedelta(days=1)).strftime('%d Oct %Y')})",
                'energy_kwh': round(yesterday_energy, 2),
                'cost': round(yesterday_cost, 2),
                'variance_pct': round(pct_change, 1)
            },
            'previous_month': {
                'label': f"Previous Month ({target_prev_month_start.strftime('%b %Y')})",
                'energy_kwh': round(prev_month_energy, 2),
                'cost': round(prev_month_cost, 2),
                'variance_pct': prev_month_var_pct
            },
            'current_month': {
                'label': f"Current Month ({sim_today_start.strftime('%b %Y')})",
                'energy_kwh': round(curr_month_energy, 2),
                'cost': round(curr_month_energy * base_rate, 2)
            }
        },
        'status': f'Live Data ({refit_house.display_name})' if is_refit else f'Demo Data ({refit_house.display_name})',
        'simulation_time': sim_dt.isoformat(),
        'dataset_start': dataset_start.isoformat(),
        'dataset_end': dataset_end.isoformat(),
        'replay_active': True,
        'data_source': f'REFIT Historical ({refit_house.display_name})' if is_refit else f'Demo Data ({refit_house.display_name})'
    })


def get_or_eval_appliance_setting(user, appliance_id, today_kwh=0.0, peak_power_watts=0.0):
    from .models import ApplianceControlSetting
    if not user or not user.is_authenticated:
        return {
            'power_state': True,
            'auto_turn_off_enabled': False,
            'usage_limit_watts': 2000.0,
            'usage_limit_kwh': 5.0,
            'auto_turned_off': False
        }

    setting, _ = ApplianceControlSetting.objects.get_or_create(
        user=user,
        appliance_id=appliance_id,
        defaults={
            'power_state': True,
            'auto_turn_off_enabled': False,
            'usage_limit_watts': 2000.0,
            'usage_limit_kwh': 5.0
        }
    )

    auto_turned_off = False
    if setting.auto_turn_off_enabled and setting.power_state:
        limit_watts = setting.usage_limit_watts or 2000.0
        limit_kwh = setting.usage_limit_kwh or 5.0
        
        if (peak_power_watts > 0 and peak_power_watts >= limit_watts) or (today_kwh > 0 and today_kwh >= limit_kwh):
            setting.power_state = False
            setting.save()
            auto_turned_off = True

    return {
        'power_state': setting.power_state,
        'auto_turn_off_enabled': setting.auto_turn_off_enabled,
        'usage_limit_watts': setting.usage_limit_watts or 2000.0,
        'usage_limit_kwh': setting.usage_limit_kwh or 5.0,
        'auto_turned_off': auto_turned_off
    }


@api_view(['GET'])
def get_appliances(request):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response([], status=status.HTTP_200_OK)

    try:
        df_hourly, df_daily, df_minute = load_and_preprocess(house_number=house_number, include_minute=True)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    mapping = get_appliance_mapping(house_number=house_number)
    tariff = request.user.profile.electricity_tariff if (request.user.is_authenticated and hasattr(request.user, 'profile')) else 8.0
    app_cols = [c for c in df_daily.columns if c.startswith('Appliance') and not c.endswith('_cost')]
    
    appliances = []
    for app in app_cols:
        today_kwh = float(df_daily.iloc[-1][app])
        monthly_kwh = float(df_daily.tail(30)[app].sum())
        avg_kwh = float(df_daily[app].mean())
        peak_watts = float(df_minute[app].max() * 60000.0) if app in df_minute.columns else float(df_hourly[app].max() * 1000.0)

        ctrl = get_or_eval_appliance_setting(request.user, app, today_kwh=today_kwh, peak_power_watts=peak_watts)
        
        if not ctrl['power_state']:
            status_val = "Auto OFF (Limit Exceeded)" if ctrl['auto_turned_off'] else "Turned OFF"
            display_today_kwh = 0.0 if not ctrl['power_state'] else round(today_kwh, 2)
        else:
            status_val = "Elevated" if today_kwh > avg_kwh * 1.5 else "Normal"
            display_today_kwh = round(today_kwh, 2)
            
        appliances.append({
            'id': app,
            'name': mapping.get(app, app),
            'today_kwh': display_today_kwh,
            'monthly_kwh': round(monthly_kwh, 2),
            'estimated_cost': round(display_today_kwh * tariff, 2),
            'avg_kwh': round(avg_kwh, 2),
            'status': status_val,
            'power_state': ctrl['power_state'],
            'auto_turn_off_enabled': ctrl['auto_turn_off_enabled'],
            'usage_limit_watts': ctrl['usage_limit_watts'],
            'usage_limit_kwh': ctrl['usage_limit_kwh']
        })
        
    return Response(appliances)


@api_view(['GET'])
def get_appliance_detail(request, appliance_id):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response({
            'household_assigned': False,
            'message': 'No REFIT household is assigned to this account.'
        }, status=status.HTTP_200_OK)

    try:
        df_hourly, df_daily, df_minute = load_and_preprocess(house_number=house_number, include_minute=True)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    mapping = get_appliance_mapping(house_number=house_number)
    tariff = request.user.profile.electricity_tariff if (request.user.is_authenticated and hasattr(request.user, 'profile')) else 8.0

    target_col = None
    if appliance_id in df_daily.columns:
        target_col = appliance_id
    else:
        for k, v in mapping.items():
            if k == appliance_id or v.lower() == appliance_id.lower():
                target_col = k
                break
                
    if not target_col or target_col not in df_daily.columns:
        return Response({'error': f'Appliance {appliance_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

    app_name = mapping.get(target_col, target_col)
    
    today_kwh = float(df_daily.iloc[-1][target_col])
    today_cost = round(today_kwh * tariff, 2)
    monthly_kwh = float(df_daily.tail(30)[target_col].sum())
    monthly_cost = round(monthly_kwh * tariff, 2)
    avg_daily_kwh = float(df_daily[target_col].mean())
    
    total_today_household = float(df_daily.iloc[-1]['Aggregate'])
    household_share_pct = round((today_kwh / total_today_household * 100), 1) if total_today_household > 0 else 0.0

    peak_power_watts = float(df_minute[target_col].max() * 60000.0) if target_col in df_minute.columns else float(df_hourly[target_col].max() * 1000.0)

    ctrl = get_or_eval_appliance_setting(request.user, target_col, today_kwh=today_kwh, peak_power_watts=peak_power_watts)
    if not ctrl['power_state']:
        status_val = "Auto OFF (Limit Exceeded)" if ctrl['auto_turned_off'] else "Turned OFF"
    else:
        status_val = "Elevated" if today_kwh > avg_daily_kwh * 1.5 else "Normal"

    recent_24h = df_hourly.tail(24)
    hourly_trend = []
    for t, row in recent_24h.iterrows():
        hourly_trend.append({
            'time': f"{t.hour:02d}:00",
            'kwh': round(row[target_col], 3) if ctrl['power_state'] else 0.0
        })

    recent_14d = df_daily.tail(14)
    daily_trend = []
    for t, row in recent_14d.iterrows():
        daily_trend.append({
            'date': t.strftime('%b %d'),
            'kwh': round(row[target_col], 2)
        })

    waste_alerts = detect_waste(df_hourly)
    anomaly_alerts = detect_anomalies(df_hourly)
    device_alerts = []
    for w in waste_alerts:
        if w.get('appliance_id') == target_col:
            w['appliance_name'] = app_name
            w['type'] = 'waste'
            device_alerts.append(w)
    for a in anomaly_alerts:
        if a.get('appliance_id') == target_col:
            a['appliance_name'] = app_name
            a['issue'] = 'Abnormal Consumption Spike'
            a['type'] = 'anomaly'
            device_alerts.append(a)

    ai_advice = (
        f"{app_name} accounts for {household_share_pct}% of total daily household energy intake. "
        f"Average daily consumption over observation timeline is {round(avg_daily_kwh, 2)} kWh/day."
    )
    if not ctrl['power_state']:
        ai_advice = f"Device is currently TURNED OFF. Auto turn-off protection limit is set to {ctrl['usage_limit_watts']} W."

    return Response({
        'id': target_col,
        'name': app_name,
        'status': status_val,
        'today_kwh': round(today_kwh, 2) if ctrl['power_state'] else 0.0,
        'today_cost': today_cost if ctrl['power_state'] else 0.0,
        'monthly_kwh': round(monthly_kwh, 2),
        'monthly_cost': monthly_cost,
        'avg_daily_kwh': round(avg_daily_kwh, 2),
        'peak_power_watts': round(peak_power_watts, 1),
        'household_share_pct': household_share_pct,
        'hourly_trend': hourly_trend,
        'daily_trend': daily_trend,
        'alerts': device_alerts,
        'ai_advice': ai_advice,
        'power_state': ctrl['power_state'],
        'auto_turn_off_enabled': ctrl['auto_turn_off_enabled'],
        'usage_limit_watts': ctrl['usage_limit_watts'],
        'usage_limit_kwh': ctrl['usage_limit_kwh'],
        'household': {
            'house_number': house_number,
            'display_name': refit_house.display_name
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_appliance_power(request, appliance_id):
    from .models import ApplianceControlSetting, UserAppliance
    if appliance_id.isdigit():
        try:
            user_app = request.user.appliances.get(pk=int(appliance_id))
            user_app.power_state = not user_app.power_state
            user_app.save()
            return Response({
                'id': appliance_id,
                'power_state': user_app.power_state,
                'status': 'Normal' if user_app.power_state else 'Turned OFF'
            })
        except UserAppliance.DoesNotExist:
            pass

    setting, _ = ApplianceControlSetting.objects.get_or_create(
        user=request.user,
        appliance_id=appliance_id,
        defaults={'power_state': True, 'auto_turn_off_enabled': False, 'usage_limit_watts': 2000.0, 'usage_limit_kwh': 5.0}
    )
    if 'power_state' in request.data:
        setting.power_state = bool(request.data['power_state'])
    else:
        setting.power_state = not setting.power_state
    setting.save()

    return Response({
        'id': appliance_id,
        'power_state': setting.power_state,
        'status': 'Normal' if setting.power_state else 'Turned OFF'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_appliance_limit(request, appliance_id):
    from .models import ApplianceControlSetting, UserAppliance
    limit_watts = request.data.get('usage_limit_watts', 2000.0)
    limit_kwh = request.data.get('usage_limit_kwh', 5.0)
    auto_off_enabled = request.data.get('auto_turn_off_enabled', True)

    try:
        limit_watts = float(limit_watts)
    except (ValueError, TypeError):
        limit_watts = 2000.0

    try:
        limit_kwh = float(limit_kwh)
    except (ValueError, TypeError):
        limit_kwh = 5.0

    if appliance_id.isdigit():
        try:
            user_app = request.user.appliances.get(pk=int(appliance_id))
            user_app.usage_limit_watts = limit_watts
            user_app.auto_turn_off_enabled = bool(auto_off_enabled)
            user_app.save()
            return Response({
                'id': appliance_id,
                'usage_limit_watts': user_app.usage_limit_watts,
                'auto_turn_off_enabled': user_app.auto_turn_off_enabled,
                'power_state': user_app.power_state
            })
        except UserAppliance.DoesNotExist:
            pass

    setting, _ = ApplianceControlSetting.objects.get_or_create(
        user=request.user,
        appliance_id=appliance_id,
        defaults={'power_state': True, 'auto_turn_off_enabled': False, 'usage_limit_watts': 2000.0, 'usage_limit_kwh': 5.0}
    )
    setting.usage_limit_watts = limit_watts
    setting.usage_limit_kwh = limit_kwh
    setting.auto_turn_off_enabled = bool(auto_off_enabled)
    setting.save()

    return Response({
        'id': appliance_id,
        'usage_limit_watts': setting.usage_limit_watts,
        'usage_limit_kwh': setting.usage_limit_kwh,
        'auto_turn_off_enabled': setting.auto_turn_off_enabled,
        'power_state': setting.power_state
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_appliances_view(request):
    from .models import UserAppliance
    from .serializers import UserApplianceSerializer
    if request.method == 'GET':
        appliances = request.user.appliances.all().order_by('-created_at')
        for dev in appliances:
            if dev.auto_turn_off_enabled and dev.power_state and dev.usage_limit_watts:
                if (dev.rated_power_watts or 0) >= dev.usage_limit_watts:
                    dev.power_state = False
                    dev.save()
        return Response(UserApplianceSerializer(appliances, many=True).data)
    elif request.method == 'POST':
        serializer = UserApplianceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def user_appliance_detail_view(request, pk):
    from .models import UserAppliance
    from .serializers import UserApplianceSerializer
    try:
        appliance = request.user.appliances.get(pk=pk)
    except UserAppliance.DoesNotExist:
        return Response({'error': 'Saved appliance not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        serializer = UserApplianceSerializer(appliance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        appliance.delete()
        return Response({'message': 'Appliance deleted successfully.'}, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_alerts(request):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response([], status=status.HTTP_200_OK)

    try:
        df_hourly, df_daily, df_minute = load_and_preprocess(house_number=house_number, include_minute=True)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

    # Respect simulation_time filter if provided
    simulation_param = request.GET.get('simulation_time')
    if simulation_param:
        try:
            sim_dt = pd.to_datetime(simulation_param)
            if hasattr(sim_dt, 'tzinfo') and sim_dt.tzinfo is not None:
                sim_dt = sim_dt.tz_localize(None)
            df_hourly = df_hourly[df_hourly.index <= sim_dt]
            df_daily = df_daily[df_daily.index <= sim_dt.floor('D')]
            if len(df_hourly) == 0:
                df_hourly = load_and_preprocess(house_number=house_number)[0].iloc[:1]
        except Exception:
            pass

    waste_alerts = detect_waste(df_hourly)
    anomaly_alerts = detect_anomalies(df_hourly)
    
    mapping = get_appliance_mapping(house_number=house_number)
    all_alerts = []
    
    # 1. Limit trip and power control alerts for user
    if request.user.is_authenticated:
        from .models import ApplianceControlSetting, UserAppliance
        user_settings = ApplianceControlSetting.objects.filter(user=request.user)
        for s in user_settings:
            if not s.power_state and s.auto_turn_off_enabled:
                app_name = mapping.get(s.appliance_id, s.appliance_id)
                all_alerts.append({
                    'timestamp': df_hourly.index[-1].isoformat() if len(df_hourly) > 0 else pd.Timestamp.now().isoformat(),
                    'appliance_id': s.appliance_id,
                    'appliance_name': app_name,
                    'issue': 'Auto Turn-Off Limit Exceeded',
                    'type': 'limit_trip',
                    'severity': 'high',
                    'is_realtime': True,
                    'excess_kwh': None,
                    'estimated_cost': 0.0,
                    'explanation': f"Power automatically tripped to OFF because peak draw exceeded safety limit of {s.usage_limit_watts} W.",
                    'recommendation': "Review appliance load or increase threshold in Appliance section to restore power."
                })
        
        user_apps = UserAppliance.objects.filter(user=request.user)
        for u in user_apps:
            if not u.power_state and u.auto_turn_off_enabled:
                all_alerts.append({
                    'timestamp': pd.Timestamp.now().isoformat(),
                    'appliance_id': str(u.id),
                    'appliance_name': u.name,
                    'issue': 'IoT Device Auto-Trip (Limit Exceeded)',
                    'type': 'limit_trip',
                    'severity': 'high',
                    'is_realtime': True,
                    'excess_kwh': None,
                    'estimated_cost': 0.0,
                    'explanation': f"{u.name} (Rated {u.rated_power_watts} W) exceeded user limit setting ({u.usage_limit_watts} W).",
                    'recommendation': "Check IoT plug connected device for over-current protection."
                })

    # 2. Add waste alerts
    for w in waste_alerts:
        w['appliance_name'] = mapping.get(w['appliance_id'], w['appliance_id'])
        w['type'] = 'waste'
        w['is_realtime'] = w.get('is_realtime', False)
        all_alerts.append(w)

    # 3. Add anomaly & high usage surge alerts
    for a in anomaly_alerts:
        a['appliance_name'] = mapping.get(a['appliance_id'], a['appliance_id'])
        if 'issue' not in a:
            a['issue'] = 'Abnormal Consumption Spike'
        a['type'] = 'anomaly'
        if 'explanation' not in a:
            a['explanation'] = f"Consumed {a['deviation_percent']}% more than normal at this hour."
        if 'recommendation' not in a:
            a['recommendation'] = "Check if appliance is malfunctioning or was left running."
        all_alerts.append(a)
        
    # Sort with real-time and highest severity first
    all_alerts.sort(key=lambda x: (x.get('is_realtime', False), x.get('severity') == 'high', x.get('timestamp', '')), reverse=True)
    return Response(all_alerts)

@api_view(['GET'])
def get_forecast(request):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response({'history': [], 'forecast': []}, status=status.HTTP_200_OK)

    try:
        df_hourly, _ = load_and_preprocess(house_number=house_number)
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
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response({'response': 'No REFIT household is assigned to this account.'}, status=status.HTTP_200_OK)

    question = request.data.get('question')
    
    try:
        df_hourly, df_daily = load_and_preprocess(house_number=house_number)
        mapping = get_appliance_mapping(house_number=house_number)
        
        # Build facts for the specific assigned household
        today = df_daily.iloc[-1]
        app_cols = [c for c in df_daily.columns if c.startswith('Appliance') and not c.endswith('_cost')]
        top_app = max(app_cols, key=lambda c: today[c])
        
        facts = {
            'household_display_name': refit_house.display_name,
            'house_number': house_number,
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

# Authentication & User Profile Views

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({'error': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({'error': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        
    if not user.is_active:
        return Response({'error': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        
    UserProfile.objects.get_or_create(
        user=user,
        defaults={'role': 'admin' if (user.is_staff or user.is_superuser) else 'citizen'}
    )
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'role': 'admin' if (request.user.is_staff or request.user.is_superuser) else 'citizen'}
    )
    return Response(UserSerializer(request.user).data)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'role': 'admin' if (request.user.is_staff or request.user.is_superuser) else 'citizen'}
    )
    
    if request.method == 'GET':
        return Response(UserProfileSerializer(profile).data)
        
    elif request.method == 'PATCH':
        user = request.user
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        user.save()
        
        profile_data = request.data.copy()
        if 'role' in profile_data:
            profile_data.pop('role')
            
        serializer = UserProfileSerializer(profile, data=profile_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_users_view(request):
    users = User.objects.all().order_by('-date_joined')
    for u in users:
        UserProfile.objects.get_or_create(
            user=u,
            defaults={'role': 'admin' if (u.is_staff or u.is_superuser) else 'citizen'}
        )
    return Response(UserSerializer(users, many=True).data)

@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_user_detail_view(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    if 'is_active' in request.data:
        user.is_active = bool(request.data['is_active'])
        user.save()
        
    if 'role' in request.data and hasattr(user, 'profile'):
        new_role = request.data['role']
        if new_role in ['citizen', 'admin']:
            user.profile.role = new_role
            user.profile.save()
            user.is_staff = (new_role == 'admin')
            user.save()
            
    return Response(UserSerializer(user).data)

