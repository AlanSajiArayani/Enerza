import React, { useState, useEffect } from 'react';
import { getAppliances } from '../services/api';
import { Zap, IndianRupee, ChevronDown } from 'lucide-react';

/* ─── Simulator Page ─── */
const Simulator = () => {
  const [appliances, setAppliances] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [currentHours, setCurrentHours] = useState(0);
  const [targetHours, setTargetHours] = useState(0);

  useEffect(() => {
    getAppliances().then(res => {
      setAppliances(res);
      if (res.length > 0) {
        setSelectedAppId(res[0].id);
        setCurrentHours(6); // Mock default
        setTargetHours(4);
      }
    }).catch(err => console.error(err));
  }, []);

  const selectedApp = appliances.find(a => a.id === selectedAppId);

  /* ─── Core calculation (unchanged logic) ─── */
  const reductionRatio = currentHours > 0 ? (currentHours - targetHours) / currentHours : 0;
  const currentMonthly = selectedApp ? selectedApp.monthly_kwh : 0;
  const savedKwh = currentMonthly * Math.max(0, reductionRatio);
  const savedCost = savedKwh * 8.0; // Rs 8 per kWh
  const pctReduction = currentHours > 0 ? Math.max(0, Math.round(((currentHours - targetHours) / currentHours) * 100)) : 0;

  return (
    <div className="space-y-5 page-enter pb-12">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Simulator</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">What If You Used Less?</h1>
        <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>Explore how changing habits translates into real savings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Controls */}
        <div className="premium-card p-6 space-y-7">

          {/* Appliance selector */}
          <div>
            <label className="block text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#475569' }}>Appliance</label>
            <div className="relative">
              <select
                value={selectedAppId}
                onChange={e => setSelectedAppId(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-[13px] font-medium text-white pr-10 cursor-pointer focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {appliances.map(a => (
                  <option key={a.id} value={a.id} style={{ background: '#0d1520' }}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Current hours slider */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Current Usage</label>
              <span className="text-[15px] font-bold text-white">{currentHours} <span className="text-[11px] font-normal text-slate-500">hrs/day</span></span>
            </div>
            <div className="relative py-1">
              <div className="progress-bar mb-0" style={{ height: 4 }}>
                <div className="progress-fill" style={{ width: `${(currentHours / 24) * 100}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
              </div>
              <input
                type="range" min="0" max="24" value={currentHours}
                onChange={e => setCurrentHours(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                style={{ margin: 0 }}
              />
              {/* Visual track */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${(currentHours / 24) * 100}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
                </div>
                <div className="absolute h-4 w-4 rounded-full border-2 border-blue-400 bg-slate-900 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
                  style={{ left: `calc(${(currentHours / 24) * 100}% - 8px)` }} />
              </div>
            </div>
          </div>

          {/* Target hours slider */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <label className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Target Usage</label>
              <span className="text-[15px] font-bold text-emerald-400">{targetHours} <span className="text-[11px] font-normal text-slate-500">hrs/day</span></span>
            </div>
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-1 rounded-full transition-all" style={{ width: `${(targetHours / 24) * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
                </div>
                <div className="absolute h-4 w-4 rounded-full border-2 border-emerald-400 bg-slate-900 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                  style={{ left: `calc(${(targetHours / 24) * 100}% - 8px)` }} />
              </div>
              <input
                type="range" min="0" max="24" value={targetHours}
                onChange={e => setTargetHours(Number(e.target.value))}
                className="relative z-10 w-full opacity-0 cursor-pointer"
                style={{ height: 24 }}
              />
            </div>
          </div>

          {/* Before/After bar comparison */}
          {selectedApp && (
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#334155' }}>Visual Comparison</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1"><span style={{ color: '#64748b' }}>Before</span><span className="text-white">{currentHours}h</span></div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(currentHours / 24) * 100}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] mb-1"><span style={{ color: '#64748b' }}>After</span><span className="text-emerald-400">{targetHours}h</span></div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(targetHours / 24) * 100}%`, background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Headline result */}
          <div className="premium-card p-6 text-center" style={{ border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 0 40px rgba(16,185,129,0.06)' }}>
            <p className="text-[10px] font-semibold tracking-widest uppercase mb-3" style={{ color: '#334155' }}>
              Reducing {selectedApp?.name || '—'} by {pctReduction}%
            </p>
            <div className="text-5xl font-bold mb-1 gradient-text-green">{savedKwh.toFixed(1)}</div>
            <p className="text-[13px]" style={{ color: '#64748b' }}>kWh saved per month</p>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <div className="premium-card px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Monthly Saving</p>
                <p className="text-[13px]" style={{ color: '#64748b' }}>Using demo tariff · ₹8/kWh</p>
              </div>
              <span className="text-2xl font-bold text-emerald-400 flex items-center gap-0.5">
                <IndianRupee size={20} />{savedCost.toFixed(0)}
              </span>
            </div>

            <div className="premium-card px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Annual Impact</p>
                <p className="text-[13px]" style={{ color: '#64748b' }}>Projected over 12 months</p>
              </div>
              <span className="text-2xl font-bold text-white flex items-center gap-0.5">
                <IndianRupee size={20} className="text-emerald-400" />{(savedCost * 12).toFixed(0)}
              </span>
            </div>

            <div className="premium-card px-5 py-4 flex justify-between items-center">
              <div>
                <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Energy Reduction</p>
              </div>
              <span className="text-xl font-bold text-blue-400">{pctReduction}%</span>
            </div>
          </div>

          <p className="text-[11px] text-center" style={{ color: '#334155' }}>
            Calculated from actual appliance consumption data. Demo tariff applies.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
