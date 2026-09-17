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
const TypeBadge = ({ type }) => {
  if (type === 'waste') return <span className="badge badge-amber">Waste</span>;
  return <span className="badge badge-red">Anomaly</span>;
};

/* ─── Alerts Page ─── */
const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts()
      .then(res => { setAlerts(res); setLoading(false); })
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

  return (
    <div className="space-y-4 page-enter pb-12">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Alerts</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Alert Center</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>AI-detected anomalies and energy waste events.</p>
        </div>
        {alerts.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171' }}>
            {alerts.length} Active
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        /* All clear */
        <div className="premium-card p-16 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Leaf size={28} style={{ color: '#10b981' }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">All Clear</h2>
            <p className="text-sm" style={{ color: '#64748b' }}>No unusual consumption or waste detected. Your household is running efficiently.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const isHigh = alert.severity === 'high';
            const borderColor = isHigh ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)';
            const iconBg = isHigh ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)';
            const iconColor = isHigh ? '#ef4444' : '#f59e0b';

            return (
              <div key={i} className="premium-card p-5 flex gap-4 items-start"
                style={{ borderColor, boxShadow: `0 0 30px ${isHigh ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)'}` }}>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: iconBg, border: `1px solid ${borderColor}` }}>
                  {isHigh
                    ? <AlertCircle size={20} style={{ color: iconColor }} />
                    : <AlertTriangle size={20} style={{ color: iconColor }} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[14px] font-semibold text-white">{alert.issue}</h3>
                    <TypeBadge type={alert.type} />
                    <SeverityBadge severity={alert.severity} />
                    <span className="badge badge-slate">{alert.appliance_name}</span>
                  </div>

                  <p className="text-[13px] leading-relaxed" style={{ color: '#94a3b8' }}>{alert.explanation}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-wrap text-[12px]">
                    {alert.excess_kwh && (
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: '#475569' }}>Excess energy:</span>
                        <span className="font-semibold text-white">{alert.excess_kwh} kWh</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: '#475569' }}>Est. impact:</span>
                      <span className="font-semibold" style={{ color: iconColor }}>₹{alert.estimated_cost}</span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)' }}>
                    <div className="flex items-start gap-2">
                      <ArrowRight size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[12px]" style={{ color: '#7dd3fc' }}>{alert.recommendation}</p>
                    </div>
                  </div>

                  <p className="text-[11px]" style={{ color: '#334155' }}>
                    Detected: {new Date(alert.timestamp).toLocaleString()}
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
