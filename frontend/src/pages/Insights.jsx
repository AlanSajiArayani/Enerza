import React, { useEffect, useState } from 'react';
import { getDashboardSummary, getAlerts, getForecast } from '../services/api';
import { Activity, Lightbulb, Zap, TrendingDown, IndianRupee, PieChart, AlertCircle, Clock, BatteryCharging, ArrowRightLeft } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

const KPICard = ({ title, value, icon, subtext, accentColor }) => (
  <div className="premium-card p-5 flex flex-col justify-between gap-4">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase mb-2" style={{ color: '#475569' }}>{title}</p>
        <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{value}</h3>
      </div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}25` }}>
        <span style={{ color: accentColor }}>{icon}</span>
      </div>
    </div>
    {subtext && <p className="text-[11px]" style={{ color: '#475569' }}>{subtext}</p>}
  </div>
);

const ComparisonEngine = ({ dashboard }) => {
  const [activeTab, setActiveTab] = useState('tod'); // 'tod', 'day', 'month', 'appliance'

  if (!dashboard) return null;

  const renderTabButton = (id, label) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
        activeTab === id 
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
          : 'text-slate-400 hover:text-white hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  let chartData = [];
  let xKey = 'name';
  let bars = [];

  // Data mapping based on tab
  if (activeTab === 'tod' && dashboard.tod_analysis) {
    const { day, peak, night } = dashboard.tod_analysis;
    chartData = [
      { name: 'Day', Energy: day.kwh, Cost: day.cost },
      { name: 'Peak', Energy: peak.kwh, Cost: peak.cost },
      { name: 'Night', Energy: night.kwh, Cost: night.cost }
    ];
    bars = [
      <Bar key="Energy" dataKey="Energy" fill="#06b6d4" radius={[4, 4, 0, 0]} />,
      <Bar key="Cost" dataKey="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
    ];
  } else if (activeTab === 'day' && dashboard.comparisons?.previous_day) {
    const comp = dashboard.comparisons;
    chartData = [
      { name: 'Yesterday', Energy: comp.previous_day.energy_kwh, Cost: comp.previous_day.cost },
      { name: 'Today', Energy: comp.today.energy_kwh, Cost: comp.today.cost }
    ];
    bars = [
      <Bar key="Energy" dataKey="Energy" fill="#06b6d4" radius={[4, 4, 0, 0]} />,
      <Bar key="Cost" dataKey="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
    ];
  } else if (activeTab === 'month' && dashboard.comparisons?.previous_month && dashboard.comparisons?.current_month) {
    const comp = dashboard.comparisons;
    chartData = [
      { name: 'Last Month', Energy: comp.previous_month.energy_kwh, Cost: comp.previous_month.cost },
      { name: 'This Month', Energy: comp.current_month.energy_kwh, Cost: comp.current_month.cost }
    ];
    bars = [
      <Bar key="Energy" dataKey="Energy" fill="#06b6d4" radius={[4, 4, 0, 0]} />,
      <Bar key="Cost" dataKey="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
    ];
  } else if (activeTab === 'appliance' && dashboard.appliance_distribution) {
    // Top 5 appliances
    chartData = dashboard.appliance_distribution.slice(0, 5).map(a => ({
      name: a.name,
      Energy: a.value
    }));
    bars = [
      <Bar key="Energy" dataKey="Energy" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
    ];
  }

  return (
    <div className="premium-card p-6 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-[15px] font-semibold text-white flex items-center gap-2">
          <ArrowRightLeft size={16} className="text-blue-400" /> Interactive Comparison Engine
        </h2>
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {renderTabButton('tod', 'Time of Day')}
          {renderTabButton('day', 'Day vs Day')}
          {renderTabButton('month', 'Month vs Month')}
          {renderTabButton('appliance', 'Appliances')}
        </div>
      </div>

      <div className="h-64 mt-4">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey={xKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              {bars}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Data unavailable for this comparison.
          </div>
        )}
      </div>
    </div>
  );
};

const Insights = () => {
  const [data, setData] = useState({
    dashboard: null,
    alerts: [],
    forecast: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, alertsRes, forecastRes] = await Promise.all([
          getDashboardSummary(),
          getAlerts(),
          getForecast()
        ]);
        setData({ dashboard: dashRes, alerts: alertsRes, forecast: forecastRes });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-blue-500"><Activity size={32} /></div>
      </div>
    );
  }

  const { dashboard, alerts } = data;
  
  // Computations
  const totalAnomalies = alerts.filter(a => a.type === 'anomaly').length;
  const totalWaste = alerts.filter(a => a.type === 'waste').length;
  // Total Energy Loss = potential savings calculated from waste/phantom loads
  const potentialSavings = alerts.reduce((acc, a) => acc + (a.estimated_cost || 0), 0);
  
  const tod = dashboard?.tod_analysis;
  const topAppliance = dashboard?.appliance_distribution?.[0];

  return (
    <div className="page-enter space-y-6">
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5 text-slate-400">Deep-Dive Analysis</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Energy Insights Report</h1>
        <p className="text-[13px] mt-1 text-slate-500">Comprehensive overview of your energy usage patterns, losses, and optimization opportunities.</p>
      </div>

      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Consumption" 
          value={`${dashboard?.today_energy || 0} kWh`} 
          icon={<Zap size={18} />} 
          accentColor="#3b82f6" 
          subtext={`Efficiency Score: ${dashboard?.efficiency_score}/100`}
        />
        <KPICard 
          title="Total Energy Loss" 
          value={totalAnomalies + totalWaste} 
          icon={<AlertCircle size={18} />} 
          accentColor="#ef4444" 
          subtext={`${totalWaste} Phantom Loads, ${totalAnomalies} Anomalies`}
        />
        <KPICard 
          title="Potential Gain (Savings)" 
          value={`₹${potentialSavings.toFixed(2)}`} 
          icon={<TrendingDown size={18} />} 
          accentColor="#10b981" 
          subtext="Recoverable cost by turning off idle appliances"
        />
        <KPICard 
          title="Total Est. Cost" 
          value={`₹${dashboard?.estimated_cost || 0}`} 
          icon={<IndianRupee size={18} />} 
          accentColor="#06b6d4" 
          subtext="Calculated using KSEB ToD Tariff"
        />
      </div>

      {/* Comparison Engine */}
      <ComparisonEngine dashboard={dashboard} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actionable Recommendations */}
        <div className="premium-card p-6 flex flex-col lg:col-span-2">
          <h2 className="text-[15px] font-semibold text-white mb-6 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" /> Intelligent Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            
            {/* Recommendation 1: Loss & Gain */}
            {totalWaste > 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
                <div className="mt-0.5 text-emerald-400"><PieChart size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-100">Recover Energy Loss</h4>
                  <p className="text-xs text-emerald-200/70 mt-1 mb-2">
                    {totalWaste} waste events are drawing phantom power. Turning them off will yield a potential gain of ₹{potentialSavings.toFixed(2)}.
                  </p>
                  <button className="text-[10px] px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 font-semibold transition-colors">
                    View Idle Appliances
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex gap-3">
                <div className="mt-0.5 text-emerald-400"><Sparkles size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold text-emerald-100">Zero Phantom Losses</h4>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    Excellent! No energy loss detected from idle appliances. You are maximizing your energy gain.
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation 2: Appliance Shift */}
            {topAppliance && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
                <div className="mt-0.5 text-blue-400"><BatteryCharging size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-100">Appliance Optimization</h4>
                  <p className="text-xs text-blue-200/70 mt-1">
                    Your highest drain is <strong>{topAppliance.name}</strong> ({topAppliance.value} kWh). Consider running this appliance during the Day (06:00-18:00) to take advantage of the 10% KSEB discount.
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation 3: Peak Usage */}
            {tod && tod.peak.cost > (tod.total_cost * 0.3) && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3">
                <div className="mt-0.5 text-rose-400"><TrendingDown size={18} /></div>
                <div>
                  <h4 className="text-sm font-semibold text-rose-100">High Peak Penalty</h4>
                  <p className="text-xs text-rose-200/70 mt-1">
                    Over 30% of your costs come from Peak hours (18:00 - 22:00) where electricity is 25% more expensive. Shifting large loads to Night hours will increase your overall financial gain.
                  </p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
