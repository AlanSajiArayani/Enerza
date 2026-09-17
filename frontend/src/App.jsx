import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Activity, CalendarClock,
  Bell, Calculator, Bot, Settings, Leaf, Database,
  User, LogOut, ShieldCheck, Users
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Appliances from './pages/Appliances';
import ApplianceDetail from './pages/ApplianceDetail';
import Forecast from './pages/Forecast';
import Alerts from './pages/Alerts';
import Simulator from './pages/Simulator';
import AIAdvisor from './pages/AIAdvisor';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

/* ─── Sidebar ─────────────────────────────────────────────── */
const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview',       path: '/',          icon: <LayoutDashboard size={17} /> },
    { name: 'Appliances',     path: '/appliances', icon: <Zap size={17} /> },
    { name: 'Energy Insights',path: '/insights',   icon: <Activity size={17} /> },
    { name: 'Forecast',       path: '/forecast',   icon: <CalendarClock size={17} /> },
    { name: 'Alerts',         path: '/alerts',     icon: <Bell size={17} /> },
    { name: 'What-If',        path: '/simulator',  icon: <Calculator size={17} /> },
    { name: 'AI Advisor',     path: '/advisor',    icon: <Bot size={17} /> },
    { name: 'My Profile',     path: '/profile',    icon: <User size={17} /> },
  ];

  if (isAdmin) {
    navItems.push({ name: 'User Management', path: '/admin', icon: <Users size={17} /> });
  }

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 flex flex-col border-r" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(8,12,20,0.95)' }}>
      {/* Brand */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
            <Zap size={16} className="text-white" />
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full" style={{ background: 'radial-gradient(#3b82f6,transparent)', opacity: 0.7 }} />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-tight gradient-text-blue">Enerza</h1>
          <p className="text-[10px] font-medium tracking-widest uppercase mt-0.5" style={{ color: '#475569' }}>AI Intelligence</p>
        </div>
      </div>

      {/* System status */}
      <div className="mx-4 mb-4 px-3 py-2 rounded-lg flex items-center gap-2.5" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div className="relative flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
          <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-ring" />
        </div>
        <span className="text-[11px] font-medium tracking-wide" style={{ color: '#34d399' }}>SYSTEM OPERATIONAL</span>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="overflow-hidden mr-2">
            <div className="text-xs font-bold text-white truncate">
              {user.first_name || user.username} {user.last_name || ''}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 capitalize mt-0.5">
              <ShieldCheck size={12} className="text-blue-400" />
              {user.role || 'Citizen'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}

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
        <div className="px-3 py-2.5 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Database size={12} style={{ color: '#475569' }} />
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>Data Source</span>
          </div>
          <p className="text-[12px] font-medium text-slate-400">REFIT Dataset</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#334155' }}>House 1 · 2013–2015</p>
        </div>
      </div>
    </aside>
  );
};

/* ─── Main Content Wrapper ─────────────────────────────── */
const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ marginLeft: '240px' }}>
        <div className="max-w-7xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
};

/* ─── App ─────────────────────────────────────────────────── */
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/appliances" element={<ProtectedRoute><Appliances /></ProtectedRoute>} />
            <Route path="/appliances/:id" element={<ProtectedRoute><ApplianceDetail /></ProtectedRoute>} />
            <Route path="/insights" element={
              <ProtectedRoute>
                <div className="page-enter glass-panel rounded-2xl p-16 text-center">
                  <Activity size={48} className="text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Energy Insights</h2>
                  <p className="text-slate-500 text-sm">Deep-dive analysis coming in the next release.</p>
                </div>
              </ProtectedRoute>
            } />
            <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
            <Route path="/advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
