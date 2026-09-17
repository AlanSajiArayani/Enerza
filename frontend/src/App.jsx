import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Activity, CalendarClock,
  Bell, Calculator, Bot, Settings, Leaf, Database
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Appliances from './pages/Appliances';
import ApplianceDetail from './pages/ApplianceDetail';
import Forecast from './pages/Forecast';
import Alerts from './pages/Alerts';
import Simulator from './pages/Simulator';
import AIAdvisor from './pages/AIAdvisor';

/* ─── Sidebar ─────────────────────────────────────────────── */
const Sidebar = () => {
  const navItems = [
    { name: 'Overview',       path: '/',          icon: <LayoutDashboard size={17} /> },
    { name: 'Appliances',     path: '/appliances', icon: <Zap size={17} /> },
    { name: 'Energy Insights',path: '/insights',   icon: <Activity size={17} /> },
    { name: 'Forecast',       path: '/forecast',   icon: <CalendarClock size={17} /> },
    { name: 'Alerts',         path: '/alerts',     icon: <Bell size={17} /> },
    { name: 'What-If',        path: '/simulator',  icon: <Calculator size={17} /> },
    { name: 'AI Advisor',     path: '/advisor',    icon: <Bot size={17} /> },
  ];

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(8,12,20,0.95)' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
            <Zap size={16} className="text-white" />
          </div>
          {/* small glow under logo */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full" style={{ background: 'radial-gradient(#3b82f6,transparent)', opacity: 0.7 }} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight gradient-text-blue">Enerza</h1>
          <p className="text-[10px] font-medium tracking-widest uppercase mt-0.5" style={{ color: '#475569' }}>AI Intelligence</p>
        </div>
      </div>

      {/* System status */}
      <div className="mx-4 mb-5 px-3 py-2.5 rounded-lg flex items-center gap-2.5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="relative flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring" />
        </div>
        <span className="text-[11px] font-medium tracking-wide" style={{ color: '#34d399' }}>SYSTEM OPERATIONAL</span>
      </div>

      {/* Section label */}
      <p className="px-5 mb-2 text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#334155' }}>Navigation</p>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-[13px] font-medium group ${
                isActive
                  ? 'text-blue-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`
            }
            style={({ isActive }) => isActive ? {
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.15)',
              boxShadow: '0 0 20px rgba(59,130,246,0.08)'
            } : {}}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400 transition-colors'}>
                  {item.icon}
                </span>
                {item.name}
                {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-blue-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Data source */}
        <div className="px-3 py-2.5 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Database size={12} style={{ color: '#475569' }} />
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Data Source</span>
          </div>
          <p className="text-[12px] font-medium text-slate-400">REFIT Dataset</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#334155' }}>House 1 · 2013–2015</p>
        </div>

        <button className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-lg text-[13px] font-medium text-slate-500 hover:text-slate-300 transition-colors group">
          <Settings size={15} className="group-hover:rotate-45 transition-transform duration-300" />
          Settings
        </button>
      </div>
    </aside>
  );
};

/* ─── App ─────────────────────────────────────────────────── */
function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ marginLeft: '240px' }}>
          <div className="max-w-7xl mx-auto px-8 py-8">
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/appliances" element={<Appliances />} />
              <Route path="/appliances/:id" element={<ApplianceDetail />} />
              <Route path="/insights"   element={
                <div className="page-enter glass-panel rounded-2xl p-16 text-center">
                  <Activity size={48} className="text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Energy Insights</h2>
                  <p className="text-slate-500 text-sm">Deep-dive analysis coming in the next release.</p>
                </div>
              } />
              <Route path="/forecast"   element={<Forecast />} />
              <Route path="/alerts"     element={<Alerts />} />
              <Route path="/simulator"  element={<Simulator />} />
              <Route path="/advisor"    element={<AIAdvisor />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
