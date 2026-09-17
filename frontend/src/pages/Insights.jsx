import React, { useEffect, useState } from 'react';
import { getDashboardSummary, getAlerts, getForecast } from '../services/api';
import { Activity, Lightbulb, Zap, TrendingDown, IndianRupee, PieChart, AlertCircle, Clock, BatteryCharging } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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

  const { dashboard, alerts, forecast } = data;
  
  // Computations
  const totalAnomalies = alerts.filter(a => a.type === 'anomaly').length;
  const totalWaste = alerts.filter(a => a.type === 'waste').length;
  const potentialSavings = alerts.reduce((acc, a) => acc + (a.estimated_cost || 0), 0);
  
  const tod = dashboard?.tod_analysis;
  const topAppliance = dashboard?.appliance_distribution?.[0];

  const chartData = tod ? [
    { name: 'Day', cost: tod.day.cost, kwh: tod.day.kwh, fill: '#10b981' },
    { name: 'Peak', cost: tod.peak.cost, kwh: tod.peak.kwh, fill: '#f43f5e' },
    { name: 'Night', cost: tod.night.cost, kwh: tod.night.kwh, fill: '#3b82f6' }
  ] : [];

  return (
    <div className="page-enter space-y-6">
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase mb-1.5 text-slate-400">Deep-Dive Analysis</p>
        <h1 className="text-2xl font-bold text-white tracking-tight">Energy Insights Report</h1>
        <p className="text-[13px] mt-1 text-slate-500">Comprehensive overview of your energy usage patterns, costs, and optimization opportunities.</p>
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
          title="Total Cost" 
          value={`₹${dashboard?.estimated_cost || 0}`} 
          icon={<IndianRupee size={18} />} 
          accentColor="#06b6d4" 
          subtext="Calculated using ToD Tariff"
        />
        <KPICard 
          title="Detected Issues" 
          value={totalAnomalies + totalWaste} 
          icon={<AlertCircle size={18} />} 
          accentColor="#f59e0b" 
          subtext={`${totalAnomalies} Anomalies, ${totalWaste} Waste Events`}
        />
        <KPICard 
          title="Potential Savings" 
          value={`₹${potentialSavings.toFixed(2)}`} 
          icon={<TrendingDown size={18} />} 
          accentColor="#10b981" 
          subtext="If all waste is eliminated"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="premium-card p-6">
          <h2 className="text-[15px] font-semibold text-white mb-6 flex items-center gap-2">
            <Clock size={16} className="text-blue-400" /> Time-of-Day Cost Distribution
          </h2>
          {tod ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="cost" name="Cost (₹)" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-500 text-sm">ToD data unavailable</div>
          )}
        </div>

        {/* Actionable Insights */}
        <div className="premium-card p-6 flex flex-col">
          <h2 className="text-[15px] font-semibold text-white mb-6 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" /> AI Actionable Insights
          </h2>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            
            {/* Insight 1: Top Consumer */}
            {topAppliance && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-blue-400"><BatteryCharging size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-100">Top Energy Drain: {topAppliance.name}</h4>
                    <p className="text-xs text-blue-200/70 mt-1">
                      This appliance consumed {topAppliance.value} kWh, accounting for the largest portion of your energy usage. Consider running it during off-peak hours.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight 2: ToD Optimization */}
            {tod && tod.peak.cost > tod.day.cost && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-rose-400"><TrendingDown size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-rose-100">High Peak Consumption</h4>
                    <p className="text-xs text-rose-200/70 mt-1">
                      You spent ₹{tod.peak.cost} during Peak hours (highest rate). Shifting 20% of this usage to Daytime (10% discount) could save you significantly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Insight 3: Waste Alerts */}
            {totalWaste > 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-emerald-400"><PieChart size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-100">Eliminate Phantom Loads</h4>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      We detected {totalWaste} potential phantom loads or wasted energy events. Check your Alerts page to resolve them and save ₹{potentialSavings.toFixed(2)}.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-emerald-400"><Sparkles size={18} /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-100">Excellent Efficiency</h4>
                    <p className="text-xs text-emerald-200/70 mt-1">
                      No significant energy waste detected! Your baseline standby consumption is perfectly optimized.
                    </p>
                  </div>
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
