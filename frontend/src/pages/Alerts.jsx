import React, { useEffect, useState } from 'react';
import { getAlerts } from '../services/api';
import { AlertTriangle, AlertCircle, Leaf, ArrowRight } from 'lucide-react';

/* ─── Severity pill ─── */
const SeverityBadge = ({ severity }) => {
  const map = {
    high:   { cls: 'badge-red',   label: 'HIGH' },
    medium: { cls: 'badge-amber', label: 'MED' },
    low:    { cls: 'badge-slate', label: 'LOW' },
  };
  const { cls, label } = map[severity] || map.low;
  return <span className={`badge ${cls}`}>{label}</span>;
};

/* ─── Type badge ─── */
const TypeBadge = ({ type, isRealtime }) => {
  if (type === 'limit_trip') {
    return <span className="badge badge-amber font-bold">Auto-Off Trip</span>;
  }
  if (type === 'waste') {
    return <span className="badge badge-amber">Waste</span>;
  }
  return (
    <span className={`badge ${isRealtime ? 'badge-red font-bold' : 'badge-red'}`}>
      {isRealtime ? 'Real-Time Surge' : 'Anomaly'}
    </span>
  );
};

/* ─── Alerts Page ─── */
const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    getAlerts()
      .then(res => { setAlerts(res || []); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 page-enter">
        <div className="mb-6"><div className="skeleton h-7 w-40 rounded mb-2" /><div className="skeleton h-4 w-64 rounded" /></div>
        {[...Array(3)].map((_, i) => <div key={i} className="premium-card h-28 skeleton" />)}
      </div>
    );
  }

  const realtimeCount = alerts.filter(a => a.is_realtime || a.severity === 'high').length;
  const wasteCount = alerts.filter(a => a.type === 'waste').length;
  const limitCount = alerts.filter(a => a.type === 'limit_trip').length;

  const filteredAlerts = alerts.filter(a => {
    if (activeFilter === 'realtime') return a.is_realtime || a.severity === 'high';
    if (activeFilter === 'waste') return a.type === 'waste';
    if (activeFilter === 'limit_trip') return a.type === 'limit_trip';
    return true;
  });

  return (
    <div className="space-y-4 page-enter pb-12">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1 text-slate-400">Real-Time Monitoring</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alert Center</h1>
          <p className="text-[13px] mt-0.5 text-slate-400">AI anomaly detection, real-time high usage surges, and auto turn-off trips.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl p-1 bg-slate-900/60 border border-slate-800">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setActiveFilter('realtime')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeFilter === 'realtime' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            Real-Time ({realtimeCount})
          </button>
          <button
            onClick={() => setActiveFilter('waste')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeFilter === 'waste' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Waste ({wasteCount})
          </button>
          {limitCount > 0 && (
            <button
              onClick={() => setActiveFilter('limit_trip')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeFilter === 'limit_trip' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Auto-Trips ({limitCount})
            </button>
          )}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        /* All clear */
        <div className="premium-card p-16 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
            <Leaf size={28} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">No Alerts in Selected Category</h2>
            <p className="text-sm text-slate-400">Your household appliances are operating within baseline limits.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert, i) => {
            const isHigh = alert.severity === 'high' || alert.is_realtime;
            const borderColor = isHigh ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.25)';
            const iconBg = isHigh ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)';
            const iconColor = isHigh ? '#ef4444' : '#f59e0b';

            return (
              <div key={i} className="premium-card p-5 flex gap-4 items-start relative overflow-hidden"
                style={{ borderColor, boxShadow: `0 0 30px ${isHigh ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.04)'}` }}>

                {/* Left status accent line */}
                {alert.is_realtime && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                )}

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, border: `1px solid ${borderColor}` }}>
                  {isHigh
                    ? <AlertCircle size={20} className="text-red-400 animate-pulse" />
                    : <AlertTriangle size={20} style={{ color: iconColor }} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {alert.is_realtime && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> Real-Time
                      </span>
                    )}
                    <h3 className="text-[14px] font-bold text-white">{alert.issue}</h3>
                    <TypeBadge type={alert.type} isRealtime={alert.is_realtime} />
                    <SeverityBadge severity={alert.severity} />
                    <span className="badge badge-slate">{alert.appliance_name}</span>
                  </div>

                  <p className="text-[13px] leading-relaxed text-slate-300">{alert.explanation}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-wrap text-[12px]">
                    {alert.deviation_percent && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Spike intensity:</span>
                        <span className="font-bold text-red-400">+{alert.deviation_percent}%</span>
                      </div>
                    )}
                    {alert.excess_kwh && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Excess energy:</span>
                        <span className="font-semibold text-white">{alert.excess_kwh} kWh</span>
                      </div>
                    )}
                    {alert.estimated_cost > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Est. impact:</span>
                        <span className="font-semibold" style={{ color: iconColor }}>₹{alert.estimated_cost}</span>
                      </div>
                    )}
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                    <div className="flex items-start gap-2">
                      <ArrowRight size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[12px]" style={{ color: '#7dd3fc' }}>{alert.recommendation}</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Timestamp: {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Alerts;
