import React, { useEffect, useState } from 'react';
import { 
  getAppliances, 
  getUserAppliances, 
  getApplianceCatalog, 
  createUserAppliance, 
  updateUserAppliance, 
  deleteUserAppliance 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Zap, IndianRupee, AlertTriangle, CheckCircle2, ChevronRight, TrendingUp,
  Plus, Trash2, Edit3, Filter, ArrowUpDown, X, Activity, Radio, Cpu,
  Tv, Laptop, Monitor, Lightbulb, Fan, Snowflake, Flame, Wifi, Coffee, Droplet, Plug
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

/* ─── REFIT Status badge ─── */
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

/* ─── Icon Resolver ─── */
const renderApplianceIcon = (iconKey, size = 18, className = '') => {
  switch (iconKey) {
    case 'tv': return <Tv size={size} className={className} />;
    case 'laptop': return <Laptop size={size} className={className} />;
    case 'desktop': return <Monitor size={size} className={className} />;
    case 'bulb': return <Lightbulb size={size} className={className} />;
    case 'fan': return <Fan size={size} className={className} />;
    case 'ac': return <Snowflake size={size} className={className} />;
    case 'heater':
    case 'geyser': return <Flame size={size} className={className} />;
    case 'wifi': return <Wifi size={size} className={className} />;
    case 'fridge': return <Cpu size={size} className={className} />;
    case 'washing_machine': return <Activity size={size} className={className} />;
    case 'kettle':
    case 'blender': return <Coffee size={size} className={className} />;
    case 'pump': return <Droplet size={size} className={className} />;
    case 'microwave':
    case 'oven':
    case 'cooktop': return <Flame size={size} className={className} />;
    default: return <Plug size={size} className={className} />;
  }
};

/* ─── Category Badge ─── */
const CategoryBadge = ({ category }) => {
  if (category === 'high') {
    return <span className="badge badge-red font-semibold">High Power</span>;
  }
  if (category === 'moderate') {
    return <span className="badge badge-amber font-semibold">Moderate Power</span>;
  }
  return <span className="badge badge-green font-semibold">Low Power</span>;
};

/* ─── Appliances Page ─── */
const Appliances = () => {
  const { profile } = useAuth();
  const tariff = profile?.electricity_tariff || 8.0;
  const navigate = useNavigate();

  // State for REFIT appliances
  const [refitAppliances, setRefitAppliances] = useState([]);
  const [loadingRefit, setLoadingRefit] = useState(true);

  // State for User appliances
  const [userAppliances, setUserAppliances] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [catalog, setCatalog] = useState([]);

  // UI state for filter, sort, modal
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, high, moderate, low
  const [sortBy, setSortBy] = useState('newest'); // newest, name, power_desc, power_asc
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    appliance_type: 'Refrigerator',
    rated_power_watts: 150,
    icon_key: 'fridge',
    iot_enabled: false,
    iot_device_name: '',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState(null);

  // Dummy live IoT power readings simulator
  const [liveReadings, setLiveReadings] = useState({});

  // Fetch data
  const loadUserAppliances = async () => {
    try {
      const data = await getUserAppliances();
      setUserAppliances(data);
    } catch (err) {
      console.error('Failed to load user appliances:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    getAppliances()
      .then(res => { setRefitAppliances(res); setLoadingRefit(false); })
      .catch(err => { console.error(err); setLoadingRefit(false); });

    loadUserAppliances();

    getApplianceCatalog()
      .then(res => setCatalog(res))
      .catch(err => console.error('Failed to load catalog:', err));
  }, []);

  // Update IoT dummy live readings periodically (every 3s)
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveReadings(prev => {
        const next = { ...prev };
        userAppliances.forEach(app => {
          if (app.iot_enabled) {
            // Variation around rated power (-10% to +15%)
            const base = app.rated_power_watts || 100;
            const variance = (Math.random() * 0.25 - 0.1);
            const simulatedCurrentPower = Math.max(1, Math.round(base * (1 + variance)));
            next[app.id] = {
              current_watts: simulatedCurrentPower,
              last_updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            };
          }
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [userAppliances]);

  // Handle Catalog Selection in Form
  const handleCatalogSelect = (e) => {
    const selectedType = e.target.value;
    const catItem = catalog.find(c => c.type === selectedType);
    if (catItem) {
      setFormData(prev => ({
        ...prev,
        appliance_type: catItem.type,
        name: catItem.default_name,
        rated_power_watts: catItem.default_power,
        icon_key: catItem.icon_key,
        iot_device_name: prev.iot_enabled ? `${catItem.default_name} IoT Sensor` : '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        appliance_type: selectedType,
        icon_key: 'custom',
      }));
    }
  };

  // Open Modal for Add
  const openAddModal = () => {
    setEditingAppliance(null);
    const defaultCat = catalog[0] || { type: 'Refrigerator', default_name: 'Kitchen Refrigerator', default_power: 150, icon_key: 'fridge' };
    setFormData({
      name: defaultCat.default_name || 'Kitchen Fridge',
      appliance_type: defaultCat.type || 'Refrigerator',
      rated_power_watts: defaultCat.default_power || 150,
      icon_key: defaultCat.icon_key || 'fridge',
      iot_enabled: false,
      iot_device_name: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const openEditModal = (app) => {
    setEditingAppliance(app);
    setFormData({
      name: app.name,
      appliance_type: app.appliance_type,
      rated_power_watts: app.rated_power_watts,
      icon_key: app.icon_key,
      iot_enabled: app.iot_enabled,
      iot_device_name: app.iot_device_name || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Form Submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Appliance name is required.');
      return;
    }
    if (formData.rated_power_watts <= 0) {
      setFormError('Rated power must be a positive number.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        name: formData.name.trim(),
        appliance_type: formData.appliance_type,
        rated_power_watts: parseFloat(formData.rated_power_watts),
        icon_key: formData.icon_key,
        iot_enabled: formData.iot_enabled,
        iot_device_name: formData.iot_enabled ? (formData.iot_device_name || `${formData.name} Sensor`) : '',
        iot_status: formData.iot_enabled ? 'Simulated Connected' : 'Not Connected',
      };

      if (editingAppliance) {
        await updateUserAppliance(editingAppliance.id, payload);
      } else {
        await createUserAppliance(payload);
      }

      setIsModalOpen(false);
      await loadUserAppliances();
    } catch (err) {
      console.error('Failed to save appliance:', err);
      setFormError('Failed to save appliance. Please check your input.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await deleteUserAppliance(deletingId);
      setDeletingId(null);
      await loadUserAppliances();
    } catch (err) {
      console.error('Failed to delete appliance:', err);
    }
  };

  // Filter & Sort User Appliances
  const filteredUserAppliances = userAppliances.filter(app => {
    if (categoryFilter === 'all') return true;
    return app.power_category === categoryFilter;
  });

  const sortedUserAppliances = [...filteredUserAppliances].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'power_desc') return b.rated_power_watts - a.rated_power_watts;
    if (sortBy === 'power_asc') return a.rated_power_watts - b.rated_power_watts;
    return new Date(b.created_at) - new Date(a.created_at); // newest
  });

  const maxRefitKwh = Math.max(...refitAppliances.map(a => a.today_kwh), 0.001);

  return (
    <div className="space-y-8 page-enter pb-16">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Citizen Dashboard</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Appliance Management & Intelligence</h1>
          <p className="text-[13px] mt-1" style={{ color: '#64748b' }}>Manage your personal appliances, simulate IoT devices, and inspect REFIT analytics.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} />
          <span>Add Appliance</span>
        </button>
      </div>

      {/* ─── SECTION 1: MY SAVED APPLIANCES ─── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <Cpu className="text-blue-400" size={20} />
            <h2 className="text-lg font-bold text-white">My Saved Appliances</h2>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {userAppliances.length} Saved
            </span>
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter Tabs */}
            <div className="flex items-center rounded-xl p-1 gap-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'high', label: 'High Power' },
                { id: 'moderate', label: 'Moderate' },
                { id: 'low', label: 'Low Power' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    categoryFilter === tab.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-slate-300 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-slate-900 text-white">Newest Added</option>
                <option value="name" className="bg-slate-900 text-white">Name A–Z</option>
                <option value="power_desc" className="bg-slate-900 text-white">Highest Power</option>
                <option value="power_asc" className="bg-slate-900 text-white">Lowest Power</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Appliances Grid / Empty State */}
        {loadingUser ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : sortedUserAppliances.length === 0 ? (
          <div className="premium-card p-8 text-center space-y-3 max-w-lg mx-auto my-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
              <Plug size={24} />
            </div>
            <h3 className="text-base font-bold text-white">No appliances added yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add your first appliance to organize household device specs and enable simulated live IoT monitoring.
            </p>
            <button
              onClick={openAddModal}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl"
            >
              <Plus size={14} />
              <span>Add Your First Appliance</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedUserAppliances.map(app => {
              const live = liveReadings[app.id] || { current_watts: app.rated_power_watts, last_updated: 'Just now' };
              const dailyKwhEst = app.iot_enabled 
                ? ((live.current_watts * 24) / 1000).toFixed(2)
                : ((app.rated_power_watts * 8) / 1000).toFixed(2); // Assume 8h average usage for static estimate
              const estCost = (dailyKwhEst * tariff).toFixed(1);

              return (
                <div key={app.id} className="premium-card p-5 space-y-4 relative group">
                  {/* Top Bar: Icon + Name + Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                        {renderApplianceIcon(app.icon_key, 20)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{app.name}</h3>
                        <p className="text-[11px] text-slate-400">{app.appliance_type}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-95">
                      <button
                        onClick={() => openEditModal(app)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Edit Appliance"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingId(app.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Appliance"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Specs Row */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Rated Power</span>
                      <span className="text-xs font-bold text-white">{app.rated_power_watts} W</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-0.5">Category</span>
                      <CategoryBadge category={app.power_category} />
                    </div>
                  </div>

                  {/* IoT Section */}
                  {app.iot_enabled ? (
                    <div className="rounded-xl p-3 space-y-2 bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Simulated IoT Data
                        </span>
                        <span className="text-[10px] text-slate-400">{live.last_updated}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-black/20 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block">Current Reading</span>
                          <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                            <Zap size={11} className="text-blue-400" />
                            {live.current_watts} W
                          </span>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <span className="text-[10px] text-slate-400 block">Est. Daily Cost</span>
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                            <IndianRupee size={10} />
                            {estCost}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl p-2.5 bg-white/[0.02] border border-white/5 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">IoT Connection</span>
                      <span className="text-slate-500 font-medium">Not Connected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: REFIT APPLIANCE ANALYTICS (UNTOUCHED CORE DATASET) ─── */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="text-amber-400" size={20} />
              REFIT Appliance Analytics
            </h2>
            <p className="text-xs text-slate-400">Main historical dataset intelligence & disaggregated device status.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', color: '#60a5fa' }}>
            {refitAppliances.length} REFIT Devices
          </div>
        </div>

        {loadingRefit ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {refitAppliances.map(app => {
              const barPct = (app.today_kwh / maxRefitKwh) * 100;
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
        )}
      </div>

      {/* ─── ADD / EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={18} className="text-blue-400" />
                {editingAppliance ? 'Edit Appliance' : 'Add New Appliance'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertTriangle size={14} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Select from catalog */}
              {!editingAppliance && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select from Catalog</label>
                  <select
                    value={formData.appliance_type}
                    onChange={handleCatalogSelect}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {catalog.map(cat => (
                      <option key={cat.type} value={cat.type}>{cat.type}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Appliance Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kitchen Refrigerator"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Rated Power */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Rated Power (Watts)</label>
                <input
                  type="number"
                  value={formData.rated_power_watts}
                  onChange={e => setFormData({ ...formData, rated_power_watts: e.target.value })}
                  placeholder="e.g. 150"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Auto Category Preview: {' '}
                  <strong className="text-blue-400">
                    {formData.rated_power_watts < 300 ? 'Low Power (<300W)' : formData.rated_power_watts <= 1000 ? 'Moderate Power (300-1000W)' : 'High Power (>1000W)'}
                  </strong>
                </span>
              </div>

              {/* IoT Checkbox */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.iot_enabled}
                    onChange={e => setFormData({ 
                      ...formData, 
                      iot_enabled: e.target.checked,
                      iot_device_name: e.target.checked ? (formData.iot_device_name || `${formData.name} Sensor`) : ''
                    })}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-white">Connect Simulated IoT Device</span>
                </label>
              </div>

              {formData.iot_enabled && (
                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-2">
                  <label className="text-[11px] font-semibold text-blue-300 block">IoT Device Name</label>
                  <input
                    type="text"
                    value={formData.iot_device_name}
                    onChange={e => setFormData({ ...formData, iot_device_name: e.target.value })}
                    placeholder="e.g. Smart Plug #1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    Enabling simulated IoT will generate dynamic dummy power readings for testing.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  {isSubmitting ? 'Saving...' : editingAppliance ? 'Update Appliance' : 'Add Appliance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-bold text-white">Remove Appliance?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to remove this appliance from your saved list? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Appliances;
