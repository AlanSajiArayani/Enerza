import React, { useEffect, useState } from 'react';
import { getAppliances, getUserAppliances, addUserAppliance, deleteUserAppliance } from '../services/api';
import {
  Zap, IndianRupee, AlertTriangle, CheckCircle2, ChevronRight, TrendingUp,
  Plus, Trash2, Wifi, Cpu, Layers
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('refit'); // 'refit' or 'user'
  const [appliances, setAppliances] = useState([]);
  const [userAppliances, setUserAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({
    name: '',
    appliance_type: 'HVAC / Cooling',
    rated_power_watts: 1500,
    power_category: 'high',
    iot_enabled: true,
    iot_device_name: '',
    iot_status: 'Connected'
  });

  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      getAppliances().catch(() => []),
      getUserAppliances().catch(() => [])
    ]).then(([refitRes, userRes]) => {
      setAppliances(refitRes || []);
      setUserAppliances(userRes || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newDevice.name) return;
    addUserAppliance({
      ...newDevice,
      iot_device_name: newDevice.iot_device_name || `${newDevice.name}-IoT`
    }).then(() => {
      setShowAddModal(false);
      setNewDevice({
        name: '',
        appliance_type: 'HVAC / Cooling',
        rated_power_watts: 1500,
        power_category: 'high',
        iot_enabled: true,
        iot_device_name: '',
        iot_status: 'Connected'
      });
      loadData();
    }).catch(console.error);
  };

  const handleDeleteUserApp = (id, e) => {
    e.stopPropagation();
    deleteUserAppliance(id).then(() => loadData()).catch(console.error);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>Appliances</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appliance Intelligence</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>Individual device measurements and simulated IoT monitoring.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab buttons */}
          <div className="flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => setActiveTab('refit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'refit' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={13} />
              REFIT Devices ({appliances.length})
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'user' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu size={13} />
              My Saved ({userAppliances.length})
            </button>
          </div>

          {activeTab === 'user' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
            >
              <Plus size={14} /> Add Appliance
            </button>
          )}
        </div>
      </div>

      {/* ── REFIT Smart Meter Appliances Tab ── */}
      {activeTab === 'refit' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appliances.map(app => {
              const barPct = (app.today_kwh / maxKwh) * 100;
              const isElevated = app.status !== 'Normal';
              return (
                <div
                  key={app.id}
                  className="premium-card p-5 cursor-pointer group hover:border-blue-500/40 transition-all"
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
      )}

      {/* ── My Saved Appliances Tab ── */}
      {activeTab === 'user' && (
        <div className="space-y-4">
          {userAppliances.length === 0 ? (
            <div className="premium-card p-10 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Cpu size={24} />
              </div>
              <h3 className="text-base font-semibold text-white">No Saved Appliances Yet</h3>
              <p className="text-xs text-slate-400 max-w-md">Add your personal household devices or simulated IoT smart plugs to track custom power ratings and device statuses.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center gap-1.5"
              >
                <Plus size={14} /> Add First Appliance
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userAppliances.map(dev => (
                <div key={dev.id} className="premium-card p-5 relative group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                        <Wifi size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{dev.name}</h3>
                        <p className="text-[11px] text-slate-400">{dev.appliance_type}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteUserApp(dev.id, e)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1"
                      title="Delete Appliance"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-1">Power Rating</p>
                      <p className="text-[13px] font-bold text-white">{dev.rated_power_watts} W</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 mb-1">IoT Status</p>
                      <p className="text-[12px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {dev.iot_status || 'Connected'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Appliance Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="premium-card p-6 w-full max-w-md space-y-4 count-up" style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-blue-400" /> Add Custom Appliance
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Appliance Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bedroom AC"
                  value={newDevice.name}
                  onChange={e => setNewDevice({ ...newDevice, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Type / Category</label>
                  <select
                    value={newDevice.appliance_type}
                    onChange={e => setNewDevice({ ...newDevice, appliance_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="HVAC / Cooling">HVAC / Cooling</option>
                    <option value="Refrigeration">Refrigeration</option>
                    <option value="Laundry">Laundry</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Cooking / Kitchen">Cooking / Kitchen</option>
                    <option value="EV Charging">EV Charging</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Power Rating (Watts)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newDevice.rated_power_watts}
                    onChange={e => setNewDevice({ ...newDevice, rated_power_watts: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IoT Device Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. ESP32-SmartPlug-01"
                  value={newDevice.iot_device_name}
                  onChange={e => setNewDevice({ ...newDevice, iot_device_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20"
                >
                  Save Appliance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Appliances;
