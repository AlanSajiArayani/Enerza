import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, BarChart3, Info } from 'lucide-react';

const ApplianceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-5 page-enter pb-12">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
          <ArrowLeft size={17} style={{ color: '#94a3b8' }} />
        </button>
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Appliance Detail</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">{id}</h1>
        </div>
      </div>

      {/* Placeholder detail card */}
      <div className="premium-card p-8 flex flex-col items-center text-center gap-5">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <BarChart3 size={28} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white mb-2">Per-Appliance Deep Dive</h2>
          <p className="text-[13px] leading-relaxed" style={{ color: '#64748b' }}>
            This view will show hourly usage patterns, normal vs actual comparison,
            historical trend and AI-generated insights specific to <strong className="text-white">{id}</strong>.
          </p>
        </div>
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-left"
          style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.12)' }}>
          <Info size={14} style={{ color: '#22d3ee', marginTop: 1, flexShrink: 0 }} />
          <p className="text-[12px]" style={{ color: '#94a3b8' }}>
            Check the <span className="text-white font-medium">Dashboard</span>, <span className="text-white font-medium">Alerts</span>, and <span className="text-white font-medium">What-If</span> pages for aggregated appliance insights now.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplianceDetail;
