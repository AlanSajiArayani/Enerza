import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Zap, Activity, CalendarClock, Bell, Calculator, Bot, Settings, Leaf } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Appliances from './pages/Appliances';
import ApplianceDetail from './pages/ApplianceDetail';
import Forecast from './pages/Forecast';
import Alerts from './pages/Alerts';
import Simulator from './pages/Simulator';
import AIAdvisor from './pages/AIAdvisor';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Appliances', path: '/appliances', icon: <Zap size={20} /> },
    { name: 'Energy Insights', path: '/insights', icon: <Activity size={20} /> },
    { name: 'Forecast', path: '/forecast', icon: <CalendarClock size={20} /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={20} /> },
    { name: 'Simulator', path: '/simulator', icon: <Calculator size={20} /> },
    { name: 'AI Advisor', path: '/advisor', icon: <Bot size={20} /> },
  ];

  return (
    <div className="w-64 h-screen glass-panel fixed left-0 top-0 flex flex-col border-r border-slate-700">
      <div className="p-6 flex items-center space-x-3 mb-4">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Leaf className="text-primary" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Enerza</h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1">AI Intelligence</p>
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-md border border-emerald-400/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span>System: Monitoring</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700/50 mt-auto">
        <button className="flex items-center space-x-3 px-4 py-2 w-full text-slate-400 hover:text-slate-200 transition-colors">
          <Settings size={20} />
          <span className="font-medium text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/appliances" element={<Appliances />} />
              <Route path="/appliances/:id" element={<ApplianceDetail />} />
              <Route path="/insights" element={<div className="text-white">Energy Insights (Coming Soon)</div>} />
              <Route path="/forecast" element={<Forecast />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/advisor" element={<AIAdvisor />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
