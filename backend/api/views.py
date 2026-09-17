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
    
    simulation_param = request.GET.get('simulation_time')
    if simulation_param:
        try:
            sim_dt = pd.to_datetime(simulation_param)
            if hasattr(sim_dt, 'tzinfo') and sim_dt.tzinfo is not None:
                sim_dt = sim_dt.tz_localize(None)
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
        today_cost = today_energy * tariff
    else:
        today_row = df_daily_hist.iloc[-1]
        today_energy = float(today_row['Aggregate'])
        today_cost = today_energy * tariff
        
    sim_yesterday_start = sim_today_start - pd.Timedelta(days=1)
    yesterday_slice = df_hourly_hist[(df_hourly_hist.index >= sim_yesterday_start) & (df_hourly_hist.index < sim_today_start)]
    
    if len(yesterday_slice) > 0:
        yesterday_energy = float(yesterday_slice['Aggregate'].sum())
    else:
        yesterday_energy = today_energy
        
    pct_change = ((today_energy - yesterday_energy) / yesterday_energy * 100) if yesterday_energy else 0
    
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
        'today_energy': round(today_energy, 2),
        'pct_change': round(pct_change, 1),
        'estimated_cost': round(today_cost, 2),
        'efficiency_score': int(score),
        'potential_savings': round(potential_savings, 2),
        'appliance_distribution': app_distribution,
        'hourly_trend': hourly_trend,
        'status': f'Live Data ({refit_house.display_name})' if is_refit else f'Demo Data ({refit_house.display_name})',
        'simulation_time': sim_dt.isoformat(),
        'dataset_start': dataset_start.isoformat(),
        'dataset_end': dataset_end.isoformat(),
        'replay_active': True,
        'data_source': f'REFIT Historical ({refit_house.display_name})' if is_refit else f'Demo Data ({refit_house.display_name})'
    })


@api_view(['GET'])
def get_appliances(request):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response([], status=status.HTTP_200_OK)

    try:
        df_hourly, df_daily = load_and_preprocess(house_number=house_number)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    mapping = get_appliance_mapping(house_number=house_number)
    tariff = request.user.profile.electricity_tariff if (request.user.is_authenticated and hasattr(request.user, 'profile')) else 8.0
    app_cols = [c for c in df_daily.columns if c.startswith('Appliance') and not c.endswith('_cost')]
    
    appliances = []
    for app in app_cols:
        today_kwh = float(df_daily.iloc[-1][app])
        monthly_kwh = float(df_daily.tail(30)[app].sum())
        
        # Calculate daily average
        avg_kwh = float(df_daily[app].mean())
        
        status_val = "Normal"
        if today_kwh > avg_kwh * 1.5:
            status_val = "Elevated"
            
        appliances.append({
            'id': app,
            'name': mapping.get(app, app),
            'today_kwh': round(today_kwh, 2),
            'monthly_kwh': round(monthly_kwh, 2),
            'estimated_cost': round(today_kwh * tariff, 2),
            'avg_kwh': round(avg_kwh, 2),
            'status': status_val
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
    status_val = "Elevated" if today_kwh > avg_daily_kwh * 1.5 else "Normal"

    recent_24h = df_hourly.tail(24)
    hourly_trend = []
    for t, row in recent_24h.iterrows():
        hourly_trend.append({
            'time': f"{t.hour:02d}:00",
            'kwh': round(row[target_col], 3)
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
    if status_val == "Elevated":
        ai_advice += f" Today's reading of {round(today_kwh, 2)} kWh is higher than normal."

    return Response({
        'id': target_col,
        'name': app_name,
        'status': status_val,
        'today_kwh': round(today_kwh, 2),
        'today_cost': today_cost,
        'monthly_kwh': round(monthly_kwh, 2),
        'monthly_cost': monthly_cost,
        'avg_daily_kwh': round(avg_daily_kwh, 2),
        'peak_power_watts': round(peak_power_watts, 1),
        'household_share_pct': household_share_pct,
        'hourly_trend': hourly_trend,
        'daily_trend': daily_trend,
        'alerts': device_alerts,
        'ai_advice': ai_advice,
        'household': {
            'house_number': house_number,
            'display_name': refit_house.display_name
        }
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_appliances_view(request):
    from .models import UserAppliance
    from .serializers import UserApplianceSerializer
    if request.method == 'GET':
        appliances = request.user.appliances.all().order_by('-created_at')
        return Response(UserApplianceSerializer(appliances, many=True).data)
    elif request.method == 'POST':
        serializer = UserApplianceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def user_appliance_detail_view(request, pk):
    from .models import UserAppliance
    try:
        appliance = request.user.appliances.get(pk=pk)
    except UserAppliance.DoesNotExist:
        return Response({'error': 'Saved appliance not found.'}, status=status.HTTP_404_NOT_FOUND)
    appliance.delete()
    return Response({'message': 'Appliance deleted successfully.'}, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_alerts(request):
    house_number, refit_house = get_user_refit_household(request.user)
    if house_number is None:
        return Response([], status=status.HTTP_200_OK)

    try:
        df_hourly, _ = load_and_preprocess(house_number=house_number)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
        
    waste_alerts = detect_waste(df_hourly)
    anomaly_alerts = detect_anomalies(df_hourly)
    
    mapping = get_appliance_mapping(house_number=house_number)
    
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

