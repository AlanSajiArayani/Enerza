import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Zap, TrendingDown, IndianRupee, Activity, Lightbulb } from 'lucide-react';
import { getDashboardSummary } from '../services/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];

const KPICard = ({ title, value, icon, trend, subtext }) => (
  <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      </div>
      <div className="p-3 bg-slate-800/50 rounded-xl text-blue-400 border border-white/5">
        {icon}
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center space-x-2 text-sm">
        <span className={trend.startsWith('+') ? 'text-red-400 font-medium flex items-center' : 'text-emerald-400 font-medium flex items-center'}>
          {trend.startsWith('-') ? <TrendingDown size={16} className="mr-1" /> : null}
          {trend}
        </span>
        <span className="text-slate-500">{subtext}</span>
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return <div className="text-red-400 p-4 glass-panel rounded-xl">Failed to load dashboard data. Ensure backend is running.</div>;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Energy Intelligence</h1>
          <p className="text-slate-400">Your household consumption summary for today.</p>
        </div>
        <div className="px-4 py-2 bg-blue-500/10 text-blue-400 text-sm font-medium rounded-full border border-blue-500/20">
          {data.status}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Today's Energy" 
          value={`${data.today_energy} kWh`}
          icon={<Zap size={24} />}
          trend={`${data.pct_change > 0 ? '+' : ''}${data.pct_change}%`}
          subtext="vs yesterday"
        />
        <KPICard 
          title="Estimated Cost" 
          value={`₹${data.estimated_cost}`}
          icon={<IndianRupee size={24} />}
        />
        <KPICard 
          title="Efficiency Score" 
          value={`${data.efficiency_score} / 100`}
          icon={<Activity size={24} className={data.efficiency_score > 80 ? 'text-emerald-400' : 'text-amber-400'} />}
        />
        <KPICard 
          title="Potential Savings" 
          value={`₹${data.potential_savings} / mo`}
          icon={<Lightbulb size={24} className="text-amber-400" />}
          trend="-12%"
          subtext="achievable"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Consumption Trend (Last 24h)</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.hourly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAggregate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
                <Area type="monotone" dataKey="Aggregate" name="Energy (kWh)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAggregate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Appliance Distribution */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-2">Top Consumers</h2>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.appliance_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.appliance_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} itemStyle={{ color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {data.appliance_distribution.slice(0, 4).map((app, i) => (
              <div key={app.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-300">{app.name}</span>
                </div>
                <span className="font-medium text-white">{app.value} kWh</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Hackathon Live Insight */}
      <div className="bg-gradient-to-r from-blue-900/40 to-emerald-900/40 border border-blue-500/20 p-5 rounded-2xl flex items-start space-x-4">
        <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
          <Lightbulb size={24} />
        </div>
        <div>
          <h4 className="text-white font-semibold mb-1">Enerza Live Insight</h4>
          <p className="text-slate-300 text-sm leading-relaxed">
            Based on recent monitoring, <strong>{data.appliance_distribution[0]?.name}</strong> contributed the largest share of consumption. 
            There are {data.potential_savings > 0 ? "potential savings" : "no major waste events"} identified today. 
            Check the Alerts and Simulator tabs to explore optimization opportunities.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
