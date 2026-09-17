import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  Zap, TrendingDown, TrendingUp, IndianRupee, Activity, Lightbulb, Sparkles,
  Play, Pause, RotateCcw, Clock, AlertTriangle, AlertCircle, X, ArrowRight, ShieldAlert, Calendar
} from 'lucide-react';
import { getDashboardSummary, getAlerts } from '../services/api';
import { useNavigate } from 'react-router-dom';

/* ─── Constants ─── */
const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

/* ─── Skeleton loader ─── */
const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

const KPISkeleton = () => (
  <div className="premium-card p-5 flex flex-col gap-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-28" /></div>
      <Skeleton className="h-9 w-9 rounded-xl" />
    </div>
    <Skeleton className="h-3 w-24" />
  </div>
);

/* ─── KPI Card ─── */
const KPICard = ({ title, value, icon, trend, subtext, accentColor = '#3b82f6', unit }) => {
  const isNegative = trend && parseFloat(trend) < 0;
  const isPositive = trend && parseFloat(trend) > 0;

  return (
    <div className="premium-card p-5 flex flex-col justify-between gap-4 count-up">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#475569' }}>{title}</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{value}</h3>
            {unit && <span className="text-sm font-medium" style={{ color: '#64748b' }}>{unit}</span>}
          </div>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}25` }}>
          <span style={{ color: accentColor }}>{icon}</span>
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-[12px]">
          {isPositive
            ? <TrendingUp size={13} style={{ color: '#ef4444' }} />
            : <TrendingDown size={13} style={{ color: '#10b981' }} />}
          <span className="font-semibold" style={{ color: isPositive ? '#ef4444' : '#10b981' }}>
            {isPositive ? '+' : ''}{trend}%
          </span>
          <span style={{ color: '#475569' }}>{subtext}</span>
        </div>
      )}
      {!trend && subtext && (
        <p className="text-[11px]" style={{ color: '#475569' }}>{subtext}</p>
      )}
    </div>
  );
};

/* ─── Custom tooltip ─── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-[12px]" style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="font-medium text-slate-300 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: '#94a3b8' }}>{p.name}:</span>
          <span className="font-semibold text-white">{p.value?.toFixed ? p.value.toFixed(1) : p.value} {p.unit || 'kWh'}</span>
        </div>
      ))}
    </div>
  );
};

const formatSimTime = (isoString) => {
  if (!isoString) return 'Loading simulation...';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString;
  const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} • ${timeStr}`;
};

/* ─── Dashboard ─── */
const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSimTime, setCurrentSimTime] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(60);
  const [datasetBounds, setDatasetBounds] = useState({ start: null, end: null });
  const [popupAlert, setPopupAlert] = useState(null);
  const [dismissedKeys, setDismissedKeys] = useState(new Set());
  const [timeframeMode, setTimeframeMode] = useState('today');
  const [inputDate, setInputDate] = useState('2013-10-13');
  const [inputTime, setInputTime] = useState('18:00');

  const fetchDashboard = (simTime) => {
    getDashboardSummary(simTime).then(res => {
      setData(res);
      setLoading(false);
      setError(false);
      if (res.simulation_time) {
        setCurrentSimTime(res.simulation_time);
      }
      if (res.selected_date) setInputDate(res.selected_date);
      if (res.selected_time) setInputTime(res.selected_time);
      if (res.dataset_start && res.dataset_end) {
        setDatasetBounds({ start: res.dataset_start, end: res.dataset_end });
      }
    }).catch(err => {
      console.error(err);
      setError(true);
      setLoading(false);
    });
  };

  const handleApplyCustomDateTime = (e) => {
    if (e) e.preventDefault();
    setIsPlaying(false);
    const customIso = `${inputDate}T${inputTime}:00`;
    setCurrentSimTime(customIso);
    fetchDashboard(customIso);
    fetchAlertsForPopup(customIso);
  };

  const handleTimeframeSelect = (mode) => {
    setTimeframeMode(mode);
    setIsPlaying(false);
    if (mode === 'today') {
      const todayIso = '2013-10-13T18:00:00';
      setInputDate('2013-10-13');
      setInputTime('18:00');
      setCurrentSimTime(todayIso);
      fetchDashboard(todayIso);
    } else if (mode === 'previous_day') {
      const prevDayIso = '2013-10-12T18:00:00';
      setInputDate('2013-10-12');
      setInputTime('18:00');
      setCurrentSimTime(prevDayIso);
      fetchDashboard(prevDayIso);
    } else if (mode === 'previous_month') {
      const prevMonthIso = '2013-09-13T18:00:00';
      setInputDate('2013-09-13');
      setInputTime('18:00');
      setCurrentSimTime(prevMonthIso);
      fetchDashboard(prevMonthIso);
    }
  };

  const fetchAlertsForPopup = (simTime) => {
    getAlerts(simTime)
      .then(alerts => {
        if (alerts && alerts.length > 0) {
          // Strictly look ONLY for active real-time alerts that have not been dismissed
          const candidate = alerts.find(a => a.is_realtime && !dismissedKeys.has((a.appliance_id || '') + (a.issue || '') + (a.timestamp || '')));
          if (candidate) {
            setPopupAlert(candidate);
          } else {
            setPopupAlert(null);
          }
        } else {
          setPopupAlert(null);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    setData(null);
    setLoading(true);
    fetchDashboard(null);
    fetchAlertsForPopup(null);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSimTime(prevTime => {
        if (!prevTime || !datasetBounds.end) return prevTime;
        const prevMs = new Date(prevTime).getTime();
        // Dynamic step based on speed multiplier
        const stepHours = speed <= 1 ? 0.25 : speed <= 10 ? 0.5 : speed <= 60 ? 2 : 6;
        const nextMs = prevMs + stepHours * 3600 * 1000;
        const endMs = new Date(datasetBounds.end).getTime();
        
        if (nextMs >= endMs) {
          setIsPlaying(false);
          return datasetBounds.end;
        }
        
        return new Date(nextMs).toISOString();
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, speed, datasetBounds]);

  // Fetch updated data whenever simulation time changes
  useEffect(() => {
    if (currentSimTime && !loading) {
      getDashboardSummary(currentSimTime).then(res => {
        setData(res);
      }).catch(console.error);
      fetchAlertsForPopup(currentSimTime);
    }
  }, [currentSimTime]);

  const handleSliderChange = (e) => {
    if (!datasetBounds.start || !datasetBounds.end) return;
    const startMs = new Date(datasetBounds.start).getTime();
    const endMs = new Date(datasetBounds.end).getTime();
    const pct = Number(e.target.value) / 100;
    const selectedMs = startMs + pct * (endMs - startMs);
    const selectedIso = new Date(selectedMs).toISOString();
    setCurrentSimTime(selectedIso);
  };

  const getSliderValue = () => {
    if (!currentSimTime || !datasetBounds.start || !datasetBounds.end) return 50;
    const startMs = new Date(datasetBounds.start).getTime();
    const endMs = new Date(datasetBounds.end).getTime();
    const curMs = new Date(currentSimTime).getTime();
    if (endMs <= startMs) return 50;
    return Math.min(100, Math.max(0, ((curMs - startMs) / (endMs - startMs)) * 100));
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (datasetBounds.start) {
      setCurrentSimTime(datasetBounds.start);
      fetchDashboard(datasetBounds.start);
      fetchAlertsForPopup(datasetBounds.start);
    }
  };

  /* Loading */
  if (loading && !data) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-7 w-48" />
          <div className="ml-auto"><Skeleton className="h-6 w-32 rounded-full" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <KPISkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2"><Skeleton className="h-72 w-full" /></div>
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  /* Unassigned household state */
  if (data && data.household_assigned === false) {
    return (
      <div className="page-enter glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <Zap size={24} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">No Household Assigned</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>{data.message || 'No REFIT household is assigned to this account.'}</p>
        </div>
      </div>
    );
  }

  /* Error */
  if (error && !data) {
    return (
      <div className="page-enter glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Activity size={24} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Unable to load energy data</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Check that the backend is running on port 8000.</p>
        </div>
        <button onClick={() => { setError(false); setLoading(true); fetchDashboard(currentSimTime); }}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: '#1e3a5f', border: '1px solid rgba(59,130,246,0.3)' }}>
          Retry
        </button>
      </div>
    );
  }

  /* Efficiency colour */
  const effColor = data.efficiency_score >= 80 ? '#10b981' : data.efficiency_score >= 60 ? '#f59e0b' : '#ef4444';
  const total = data.appliance_distribution.reduce((s, a) => s + a.value, 0);

  return (
    <div className="space-y-5 pb-12 page-enter relative">

      {/* ── Real-Time Pop-Up Alert Toast Notification ── */}
      {popupAlert && (
        <div className="fixed top-6 right-6 z-50 max-w-md w-full page-enter">
          <div
            className="p-4 rounded-2xl shadow-2xl flex items-start gap-3.5 backdrop-blur-xl relative transition-all border"
            style={{
              background: 'rgba(15, 23, 42, 0.95)',
              borderColor: popupAlert.severity === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(245, 158, 11, 0.4)',
              boxShadow: popupAlert.severity === 'high' ? '0 10px 40px rgba(239, 68, 68, 0.25)' : '0 10px 40px rgba(245, 158, 11, 0.25)'
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: popupAlert.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                border: `1px solid ${popupAlert.severity === 'high' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
              }}
            >
              {popupAlert.severity === 'high' ? (
                <AlertCircle size={20} className="text-red-400 animate-pulse" />
              ) : (
                <AlertTriangle size={20} className="text-amber-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> Real-Time Alert
                </span>
                <span className="text-slate-400 text-xs font-semibold">• {popupAlert.appliance_name}</span>
              </div>

              <h4 className="text-sm font-bold text-white leading-tight mb-1">
                {popupAlert.issue}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
                {popupAlert.explanation || 'Abnormal usage surge detected during current simulation replay.'}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                {popupAlert.estimated_cost ? (
                  <span className="text-[11px] font-semibold text-amber-400">
                    Est. Cost: ₹{popupAlert.estimated_cost}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">Action recommended</span>
                )}

                <button
                  onClick={() => {
                    const key = (popupAlert.appliance_id || '') + (popupAlert.issue || '') + (popupAlert.timestamp || '');
                    setDismissedKeys(prev => new Set(prev).add(key));
                    setPopupAlert(null);
                    navigate('/alerts');
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 transition-all shadow-md shadow-blue-500/20"
                >
                  View in Alert Center <ArrowRight size={12} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                const key = (popupAlert.appliance_id || '') + (popupAlert.issue || '') + (popupAlert.timestamp || '');
                setDismissedKeys(prev => new Set(prev).add(key));
                setPopupAlert(null);
              }}
              className="text-slate-500 hover:text-white text-xs p-1 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Overview</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Energy Intelligence</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>
            Replaying historical {data?.household?.display_name || 'REFIT'} smart-meter measurements.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
          style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
          {data.data_source || data.status}
        </div>
      </div>

      {/* ── Timeframe View Selector & Interactive Date/Time Picker Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        
        {/* Date & Time Picker Inputs */}
        <form onSubmit={handleApplyCustomDateTime} className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Select Date:</span>
            <input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Clock size={16} className="text-cyan-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-300">Select Time:</span>
            <input
              type="time"
              value={inputTime}
              onChange={e => setInputTime(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            Jump to Timestamp
          </button>
        </form>

        {/* Quick Timeframe Preset selector buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/90 border border-slate-800/80">
          <button
            type="button"
            onClick={() => handleTimeframeSelect('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframeMode === 'today'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📅 13 Oct 2013 (6 PM)
          </button>

          <button
            type="button"
            onClick={() => handleTimeframeSelect('previous_day')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframeMode === 'previous_day'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⏪ Prev Day (12 Oct)
          </button>

          <button
            type="button"
            onClick={() => handleTimeframeSelect('previous_month')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              timeframeMode === 'previous_month'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🗓️ Prev Month (Sep 2013)
          </button>
        </div>
      </div>

      {/* Replay Control Bar */}
      <div className="premium-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Historical Replay</span>
                <span className="text-slate-500 text-[10px]">•</span>
                <span className="text-[10px] text-slate-400">{data?.household?.display_name || 'REFIT Household'}</span>
              </div>
              <div className="text-lg font-bold text-white tracking-tight mt-0.5">
                {formatSimTime(currentSimTime || data.simulation_time)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isPlaying 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <div className="flex items-center space-x-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {['8s', 1, 10, 60, 300].map(s => {
                const isSelected = speed === s || (s === '8s' && speed === 0.133);
                return (
                  <button
                    key={s}
                    onClick={() => setSpeed(s === '8s' ? 0.133 : s)}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    style={!isSelected ? { border: '1px solid transparent' } : {}}
                  >
                    {s === '8s' ? '8s Live' : `${s}x`}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={handleReset}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              title="Reset Replay Timeline"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="pt-2 relative py-1">
           <div className="absolute inset-0 flex items-center pointer-events-none px-0">
             <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
               <div className="h-1 rounded-full transition-all" style={{ width: `${getSliderValue()}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
             </div>
             <div className="absolute h-3 w-3 rounded-full border-2 border-blue-400 bg-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
               style={{ left: `calc(${getSliderValue()}% - 6px)` }} />
           </div>
          <input 
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={getSliderValue()}
            onChange={handleSliderChange}
            className="relative z-10 w-full opacity-0 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-medium">
            <span>{datasetBounds.start ? new Date(datasetBounds.start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Dataset Start'}</span>
            <span>{datasetBounds.end ? new Date(datasetBounds.end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Dataset End'}</span>
          </div>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Period Energy"
          value={data.today_energy}
          unit="kWh"
          icon={<Zap size={18} />}
          trend={data.pct_change}
          subtext="vs previous period"
          accentColor="#3b82f6"
        />
        <KPICard
          title="Est. Cost"
          value={`₹${data.estimated_cost}`}
          icon={<IndianRupee size={18} />}
          subtext="Selected demo tariff"
          accentColor="#06b6d4"
        />
        <KPICard
          title="Efficiency"
          value={data.efficiency_score}
          unit="/ 100"
          icon={<Activity size={18} />}
          subtext={data.efficiency_score >= 80 ? 'Good performance' : 'Needs attention'}
          accentColor={effColor}
        />
        <KPICard
          title="Potential Savings"
          value={`₹${data.potential_savings}`}
          unit="/ mo"
          icon={<Lightbulb size={18} />}
          subtext="Identified opportunities"
          accentColor="#f59e0b"
        />
      </div>

      {/* ── Historical Comparison & Live Fluctuation Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Live 8-Second Power Fluctuation Stream Chart */}
        <div className="lg:col-span-2 premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold tracking-widest uppercase text-cyan-400">REFIT 8-Second Telemetry Stream</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> 8s Interval
                </span>
              </div>
              <h2 className="text-[15px] font-semibold text-white">
                Live Single Day Power Fluctuation ({data.comparisons?.reference_date || '13/10/2013'} @ {data.comparisons?.reference_time || '06:00 PM'})
              </h2>
            </div>
            <span className="badge badge-cyan">Watts / 8s</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={(data.eight_second_telemetry && data.eight_second_telemetry.length > 0) ? data.eight_second_telemetry : (data.minute_trend || [])} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWatts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="watts" name="Power Draw" stroke="#06b6d4" strokeWidth={2} fill="url(#colorWatts)" dot={false} activeDot={{ r: 4, fill: '#06b6d4', stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Date Comparison Card */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">Period Comparison</p>
              <span className="badge badge-blue">13/10/2014 Context</span>
            </div>
            <h2 className="text-[15px] font-semibold text-white mb-4">Today vs Previous Period</h2>

            <div className="space-y-3">
              {/* Today */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-blue-300">📅 Today (13 Oct 2014)</p>
                  <p className="text-[13px] font-bold text-white mt-0.5">{data.comparisons?.today?.energy_kwh || data.today_energy} kWh</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-400">₹{data.comparisons?.today?.cost || data.estimated_cost}</p>
                  <span className="text-[10px] text-slate-400">Reference Day</span>
                </div>
              </div>

              {/* Previous Day */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">⏪ Previous Day (12 Oct 2014)</p>
                  <p className="text-[13px] font-bold text-white mt-0.5">{data.comparisons?.previous_day?.energy_kwh} kWh</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-400">₹{data.comparisons?.previous_day?.cost}</p>
                  <span className={`text-[10px] font-bold ${
                    (data.comparisons?.previous_day?.variance_pct || 0) <= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {data.comparisons?.previous_day?.variance_pct}% vs today
                  </span>
                </div>
              </div>

              {/* Previous Month */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400">🗓️ Previous Month (Sep 2014)</p>
                  <p className="text-[13px] font-bold text-white mt-0.5">{data.comparisons?.previous_month?.energy_kwh} kWh</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-400">₹{data.comparisons?.previous_month?.cost}</p>
                  <span className={`text-[10px] font-bold ${
                    (data.comparisons?.previous_month?.variance_pct || 0) <= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {data.comparisons?.previous_month?.variance_pct}% vs month
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main area chart */}
        <div className="lg:col-span-2 premium-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Consumption</p>
              <h2 className="text-[15px] font-semibold text-white">24-Hour Energy Profile ({data.comparisons?.reference_date || '13/10/2014'})</h2>
            </div>
            <span className="badge badge-blue">kWh / hr</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourly_trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAggregate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontFamily: 'Inter' }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569', fontFamily: 'Inter' }} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Aggregate"
                  name="Energy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAggregate)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy distribution */}
        <div className="premium-card p-5 flex flex-col">
          <div className="mb-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Distribution</p>
            <h2 className="text-[15px] font-semibold text-white">Where Energy Goes</h2>
          </div>

          {/* Donut chart */}
          <div className="h-44 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.appliance_distribution}
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.appliance_distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: 12 }} itemStyle={{ color: '#e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend rows */}
          <div className="mt-3 space-y-2.5 flex-1">
            {data.appliance_distribution.slice(0, 5).map((app, i) => {
              const pct = total > 0 ? Math.round((app.value / total) * 100) : 0;
              return (
                <div key={app.id} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[12px] flex-1 truncate" style={{ color: '#94a3b8' }}>{app.name}</span>
                  <span className="text-[11px] font-semibold text-white">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Top consumer annotation */}
          {data.appliance_distribution[0] && (
            <div className="mt-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-0.5" style={{ color: '#475569' }}>Largest contributor</p>
              <p className="text-[12px] font-medium text-blue-400">{data.appliance_distribution[0].name} · {total > 0 ? Math.round((data.appliance_distribution[0].value / total) * 100) : 0}%</p>
            </div>
          )}
        </div>
      </div>

      {/* ── ToD (Time of Day) KSEB Tariff Analysis ── */}
      {data.tod_analysis && (
        <div className="premium-card p-5 mt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Tariff Breakdown</p>
              <h2 className="text-[15px] font-semibold text-white">Time-of-Day (ToD) Cost Analysis</h2>
              <p className="text-[12px] mt-0.5" style={{ color: '#64748b' }}>Based on KSEB ToD tariff slots (Day: -10%, Peak: +25%)</p>
            </div>
            <span className="badge badge-purple">ToD Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Day Slot */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[12px] font-semibold text-emerald-300 uppercase tracking-widest">Day (06:00 - 18:00)</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{data.tod_analysis.day?.kwh}</p>
                  <p className="text-[11px] text-slate-400">kWh Consumed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">₹{data.tod_analysis.day?.cost}</p>
                  <p className="text-[10px] text-slate-400">@ ₹{data.tod_analysis.day?.rate}/unit</p>
                </div>
              </div>
            </div>

            {/* Peak Slot */}
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-[12px] font-semibold text-rose-300 uppercase tracking-widest">Peak (18:00 - 22:00)</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{data.tod_analysis.peak?.kwh}</p>
                  <p className="text-[11px] text-slate-400">kWh Consumed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-rose-400">₹{data.tod_analysis.peak?.cost}</p>
                  <p className="text-[10px] text-slate-400">@ ₹{data.tod_analysis.peak?.rate}/unit</p>
                </div>
              </div>
            </div>

            {/* Night Slot */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-[12px] font-semibold text-blue-300 uppercase tracking-widest">Night (22:00 - 06:00)</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{data.tod_analysis.night?.kwh}</p>
                  <p className="text-[11px] text-slate-400">kWh Consumed</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-400">₹{data.tod_analysis.night?.cost}</p>
                  <p className="text-[10px] text-slate-400">@ ₹{data.tod_analysis.night?.rate}/unit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Insight card ── */}
      <div className="premium-card ai-border p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
          <Sparkles size={17} style={{ color: '#22d3ee' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#06b6d4' }}>Enerza AI Insight</p>
            <span className="badge badge-cyan">Analysis Active</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: '#94a3b8' }}>
            At simulation timestamp <strong>{formatSimTime(currentSimTime || data.simulation_time)}</strong>, <strong>{data.appliance_distribution[0]?.name || 'Appliance'}</strong> contributed the largest share of consumption.{' '}
            {data.potential_savings > 0
              ? <>Potential monthly savings of <span className="text-emerald-400 font-semibold">₹{data.potential_savings}</span> identified from detected waste events.</>
              : 'No significant waste detected up to this point.'}
            {' '}Navigate to <span className="text-blue-400 font-medium">Alerts</span> or <span className="text-blue-400 font-medium">What-If</span> to explore optimizations.
          </p>
        </div>
        <div className="text-right flex-shrink-0 hidden md:block">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Confidence</p>
          <span className="badge badge-green">High</span>
        </div>
      </div>

      {/* ── Top consumers ranked list ── */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Rankings</p>
            <h2 className="text-[15px] font-semibold text-white">Top Energy Consumers</h2>
          </div>
          <span className="badge badge-slate">Up to sim time</span>
        </div>
        <div className="space-y-3">
          {data.appliance_distribution.slice(0, 5).map((app, i) => {
            const pct = total > 0 ? (app.value / total) * 100 : 0;
            return (
              <div key={app.id} className="flex items-center gap-3 group">
                <span className="text-[11px] font-bold w-4 text-center" style={{ color: '#334155' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-[13px] font-medium" style={{ color: '#cbd5e1' }}>{app.name}</span>
                    <span className="text-[12px] font-semibold text-white">{app.value.toFixed(1)} kWh</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}aa)` }} />
                  </div>
                </div>
                <span className="text-[11px] font-semibold w-9 text-right" style={{ color: COLORS[i % COLORS.length] }}>{Math.round(pct)}%</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
