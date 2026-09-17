import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  ArrowLeft, Zap, IndianRupee, Activity, Sparkles, AlertTriangle,
  Flame, CheckCircle2, Clock, Calendar, ShieldCheck
} from 'lucide-react';
import { getApplianceDetail } from '../services/api';

/* ─── Skeleton ─── */
const Skeleton = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-[12px]" style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="font-medium text-slate-300 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-white font-semibold">
          <span style={{ color: '#60a5fa' }}>{p.name}:</span>
          <span>{p.value} kWh</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Appliance Detail Page ─── */
const ApplianceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    getApplianceDetail(id)
      .then(res => {
        setData(res);
        setLoading(false);
        setError(false);
      })
      .catch(err => {
        console.error(err);
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading && !data) {
    return (
      <div className="space-y-6 page-enter pb-12">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="premium-card p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-enter glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Zap size={24} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Appliance Not Found</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Could not load measurements for appliance "{id}".</p>
        </div>
        <button onClick={() => navigate('/appliances')}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: '#1e3a5f', border: '1px solid rgba(59,130,246,0.3)' }}>
          Back to Appliances
        </button>
      </div>
    );
  }

  const isElevated = data.status !== 'Normal';

  return (
    <div className="space-y-5 page-enter pb-12">

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-slate-800"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={17} style={{ color: '#94a3b8' }} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-blue-400">Appliance Overview</span>
              <span className="text-slate-600 text-xs">•</span>
              <span className="text-[10px] text-slate-400">{data.household?.display_name}</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              {data.name}
              <span className={`badge ${isElevated ? 'badge-amber' : 'badge-green'}`}>
                {data.status}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-auto"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa' }}>
          <Zap size={14} />
          {data.household_share_pct}% Household Energy Share
        </div>
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5 flex flex-col justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Today's Energy</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-white">{data.today_kwh}</h3>
            <span className="text-sm font-medium text-slate-400">kWh</span>
          </div>
          <p className="text-[11px] text-slate-500">Recorded for current day</p>
        </div>

        <div className="premium-card p-5 flex flex-col justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Estimated Cost</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-2xl font-bold text-amber-400">₹{data.today_cost}</h3>
          </div>
          <p className="text-[11px] text-slate-500">Based on personal profile tariff</p>
        </div>

        <div className="premium-card p-5 flex flex-col justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Peak Power</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-cyan-400">{data.peak_power_watts}</h3>
            <span className="text-sm font-medium text-slate-400">W</span>
          </div>
          <p className="text-[11px] text-slate-500">Maximum recorded draw</p>
        </div>

        <div className="premium-card p-5 flex flex-col justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400">Daily Average</p>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-emerald-400">{data.avg_daily_kwh}</h3>
            <span className="text-sm font-medium text-slate-400">kWh/day</span>
          </div>
          <p className="text-[11px] text-slate-500">Historical dataset baseline</p>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* 24-Hour Profile Chart */}
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-1 text-slate-400">24-Hour Profile</p>
              <h2 className="text-[15px] font-semibold text-white">Hourly Consumption Trend</h2>
            </div>
            <span className="badge badge-blue">kWh / hr</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourly_trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAppKwh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="kwh" name="Energy" stroke="#3b82f6" strokeWidth={2} fill="url(#colorAppKwh)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 14-Day History Chart */}
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-1 text-slate-400">14-Day History</p>
              <h2 className="text-[15px] font-semibold text-white">Daily Usage Trend</h2>
            </div>
            <span className="badge badge-cyan">kWh / day</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily_trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="kwh" name="Energy" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── AI Insight & Alerts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* AI Insight Card */}
        <div className="lg:col-span-2 premium-card ai-border p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <Sparkles size={18} style={{ color: '#22d3ee' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-cyan-400">Enerza AI Device Intelligence</p>
              <span className="badge badge-cyan">Active</span>
            </div>
            <p className="text-[13px] leading-relaxed text-slate-300 mb-3">
              {data.ai_advice}
            </p>
            <div className="flex items-center gap-3 text-[12px] text-slate-400">
              <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-emerald-400" /> Normal operating baseline</span>
              <span className="text-slate-600">•</span>
              <span>Estimated Monthly Draw: <strong className="text-white">{data.monthly_kwh} kWh</strong> (₹{data.monthly_cost})</span>
            </div>
          </div>
        </div>

        {/* Device Alerts Card */}
        <div className="premium-card p-5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-1 text-slate-400">Device Diagnostic</p>
            <h2 className="text-[15px] font-semibold text-white mb-3">Alerts & Anomalies</h2>
            
            {data.alerts && data.alerts.length > 0 ? (
              <div className="space-y-2.5">
                {data.alerts.map((a, idx) => (
                  <div key={idx} className="p-3 rounded-xl flex items-start gap-2.5"
                    style={{ background: a.type === 'anomaly' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${a.type === 'anomaly' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                    <AlertTriangle size={15} className={a.type === 'anomaly' ? 'text-red-400' : 'text-amber-400'} style={{ marginTop: 2 }} />
                    <div>
                      <p className="text-[12px] font-semibold text-white mb-0.5">{a.issue || a.rule}</p>
                      <p className="text-[11px] text-slate-400">{a.explanation || a.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl text-center flex flex-col items-center gap-2"
                style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.12)' }}>
                <CheckCircle2 size={20} className="text-emerald-400" />
                <p className="text-[12px] font-medium text-emerald-300">No active alerts for {data.name}</p>
                <p className="text-[11px] text-slate-400">Appliance is operating within healthy efficiency bounds.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ApplianceDetail;
