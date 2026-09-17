import React, { useEffect, useState } from 'react';
import { getAppliances } from '../services/api';
import { Zap, IndianRupee, AlertTriangle, CheckCircle2, ChevronRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Skeleton ─── */
const CardSkeleton = () => (
  <div className="premium-card p-5 space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2"><div className="skeleton h-4 w-28 rounded" /><div className="skeleton h-3 w-20 rounded" /></div>
      <div className="skeleton h-8 w-8 rounded-xl" />
    </div>
    <div className="skeleton h-1 w-full rounded-full" />
    <div className="skeleton h-3 w-24 rounded" />
  </div>
);

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    Normal:   { cls: 'badge-green',  label: 'Normal' },
    Elevated: { cls: 'badge-amber',  label: 'Elevated' },
    Abnormal: { cls: 'badge-red',    label: 'Abnormal' },
    default:  { cls: 'badge-slate',  label: status },
  };
  const { cls, label } = map[status] || map.default;
  return <span className={`badge ${cls}`}>{label}</span>;
};

/* ─── Appliances Page ─── */
const Appliances = () => {
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAppliances()
      .then(res => { setAppliances(res); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 page-enter">
        <div className="mb-6"><div className="skeleton h-7 w-48 rounded mb-2" /><div className="skeleton h-4 w-64 rounded" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const maxKwh = Math.max(...appliances.map(a => a.today_kwh), 0.001);

  return (
    <div className="space-y-5 page-enter pb-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Appliances</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appliance Intelligence</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>Individual device consumption and status.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa' }}>
          {appliances.length} Devices
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appliances.map(app => {
          const barPct = (app.today_kwh / maxKwh) * 100;
          const isElevated = app.status !== 'Normal';
          return (
            <div
              key={app.id}
              className="premium-card p-5 cursor-pointer group"
              onClick={() => navigate(`/appliances/${app.id}`)}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isElevated ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', border: `1px solid ${isElevated ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}` }}>
                    <Zap size={15} style={{ color: isElevated ? '#f59e0b' : '#3b82f6' }} />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-white group-hover:text-blue-400 transition-colors leading-tight">{app.name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
              </div>

              {/* Consumption bar */}
              <div className="mb-4">
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-[11px]" style={{ color: '#475569' }}>Today's usage</span>
                  <span className="text-[13px] font-bold text-white">{app.today_kwh} kWh</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${barPct}%`, background: isElevated ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ color: '#334155' }}>Monthly</p>
                  <p className="text-[13px] font-semibold text-white">{app.monthly_kwh} kWh</p>
                </div>
                <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ color: '#334155' }}>Est. Cost</p>
                  <p className="text-[13px] font-semibold text-amber-400 flex items-center gap-0.5">
                    <IndianRupee size={11} />{app.estimated_cost}
                  </p>
                </div>
              </div>

              {/* Avg comparison */}
              {app.avg_kwh > 0 && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    {app.today_kwh > app.avg_kwh
                      ? <TrendingUp size={12} style={{ color: '#f59e0b' }} />
                      : <CheckCircle2 size={12} style={{ color: '#10b981' }} />}
                    <span style={{ color: '#475569' }}>Avg: {app.avg_kwh} kWh/day</span>
                    {app.today_kwh > app.avg_kwh && (
                      <span className="ml-auto font-medium" style={{ color: '#f59e0b' }}>
                        +{Math.round(((app.today_kwh - app.avg_kwh) / app.avg_kwh) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Appliances;
