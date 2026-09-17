import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Zap, TrendingDown, TrendingUp, IndianRupee, Activity, Lightbulb, Sparkles } from 'lucide-react';
import { getDashboardSummary } from '../services/api';

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
          <span className="font-semibold text-white">{p.value?.toFixed ? p.value.toFixed(3) : p.value} kWh</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Dashboard ─── */
const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDashboardSummary()
      .then(res => { setData(res); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  /* Loading */
  if (loading) {
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

  /* Error */
  if (error || !data) {
    return (
      <div className="page-enter glass-panel rounded-2xl p-12 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <Activity size={24} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Unable to load energy data</h2>
          <p className="text-sm" style={{ color: '#64748b' }}>Check that the backend is running on port 8000.</p>
        </div>
        <button onClick={() => { setError(false); setLoading(true); getDashboardSummary().then(r => { setData(r); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
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
    <div className="space-y-5 pb-12 page-enter">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Overview</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Energy Intelligence</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>Household consumption at a glance · REFIT historical data</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tracking-wide"
          style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 pulse-dot" />
          {data.status}
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

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main area chart */}
        <div className="lg:col-span-2 premium-card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Consumption</p>
              <h2 className="text-[15px] font-semibold text-white">24-Hour Energy Profile</h2>
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
            <span className="text-white font-medium">{data.appliance_distribution[0]?.name}</span> is the dominant consumer in this period.{' '}
            {data.potential_savings > 0
              ? <>Potential monthly savings of <span className="text-emerald-400 font-semibold">₹{data.potential_savings}</span> identified from detected waste events.</>
              : 'No significant waste detected in this period.'}
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
          <span className="badge badge-slate">Last 30 days</span>
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
