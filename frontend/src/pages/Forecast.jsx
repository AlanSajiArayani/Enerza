import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { getForecast } from '../services/api';
import { TrendingUp, CalendarDays } from 'lucide-react';

/* ─── Custom tooltip ─── */
const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2.5 rounded-xl text-[12px]"
      style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#334155' }}>{label}</p>
      {payload.map((p, i) => p.value !== null && (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span style={{ color: '#94a3b8' }}>{p.name}:</span>
          <span className="font-semibold text-white">{p.value?.toFixed(3)} kWh</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Stat box ─── */
const ForecastStat = ({ label, value, unit }) => (
  <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <p className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#334155' }}>{label}</p>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-[12px]" style={{ color: '#64748b' }}>{unit}</span>
    </div>
  </div>
);

/* ─── Forecast Page ─── */
const Forecast = () => {
  const [rawData, setRawData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getForecast()
      .then(res => {
        setRawData(res);
        // Merge history and forecast into one array for the chart
        const merged = [
          ...res.history.map(d => ({
            time: new Date(d.timestamp).getHours() + ':00',
            actual: d.actual_kwh,
            forecast: null,
          })),
          ...res.forecast.slice(0, 72).map(d => ({        // show 3 days ahead
            time: new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + new Date(d.timestamp).getHours() + ':00',
            actual: null,
            forecast: d.predicted_kwh,
          }))
        ];
        setChartData(merged);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  /* Derived summary stats */
  const tomorrow = rawData?.forecast?.slice(0, 24).reduce((s, d) => s + d.predicted_kwh, 0) || 0;
  const sevenDay = rawData?.forecast?.slice(0, 168).reduce((s, d) => s + d.predicted_kwh, 0) || 0;
  const monthly  = sevenDay * (30 / 7);

  if (loading) {
    return (
      <div className="space-y-5 page-enter">
        <div className="mb-6"><div className="skeleton h-7 w-48 rounded mb-2" /><div className="skeleton h-4 w-64 rounded" /></div>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 page-enter pb-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Forecast</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Consumption Forecast</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>AI-powered demand projection using XGBoost gradient boosted regression.</p>
        </div>
        <div className="flex items-center gap-2" style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
          <span className="badge badge-indigo">XGBoost Regressor</span>
          <span className="badge badge-cyan">No data leakage</span>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ForecastStat label="Tomorrow"      value={tomorrow.toFixed(1)}  unit="kWh" />
        <ForecastStat label="7-Day Projection" value={sevenDay.toFixed(1)} unit="kWh" />
        <ForecastStat label="Monthly Est."  value={monthly.toFixed(0)}   unit="kWh" />
      </div>

      {/* Chart */}
      <div className="premium-card p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Projection</p>
            <h2 className="text-[15px] font-semibold text-white">Historical vs Predicted</h2>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full" style={{ background: '#3b82f6' }} /><span style={{ color: '#64748b' }}>Actual</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full" style={{ background: '#10b981' }} /><span style={{ color: '#64748b' }}>Predicted</span></div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} dy={8} minTickGap={60} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip content={<ForecastTooltip />} />
              <Area type="monotone" dataKey="actual"   name="Actual"    stroke="#3b82f6" strokeWidth={2} fill="url(#gradActual)"   connectNulls dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }} />
              <Area type="monotone" dataKey="forecast" name="Predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" fill="url(#gradForecast)" connectNulls dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 pt-4 flex items-start gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <TrendingUp size={13} style={{ color: '#475569', marginTop: 2 }} />
          <p className="text-[11px]" style={{ color: '#475569' }}>
            Prediction based on historical usage patterns using XGBoost gradient boosted regression.
            Accuracy may vary. No future data was used for training.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Forecast;
