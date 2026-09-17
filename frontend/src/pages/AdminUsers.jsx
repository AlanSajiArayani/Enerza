import React, { useState, useEffect } from 'react';
import { getAdminUsers, updateAdminUserStatus } from '../services/api';
import { Users, Shield, ShieldCheck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch user directory. Ensure you have Admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId, currentActive) => {
    try {
      await updateAdminUserStatus(userId, { is_active: !currentActive });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'citizen' : 'admin';
    try {
      await updateAdminUserStatus(userId, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user role.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Admin User Management</h1>
        <p className="text-slate-400">View registered accounts, profile preferences, and manage system roles.</p>
      </header>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Total Accounts</p>
            <h3 className="text-2xl font-bold text-white">{users.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Citizen Accounts</p>
            <h3 className="text-2xl font-bold text-white">{users.filter(u => u.role === 'citizen').length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Admin Accounts</p>
            <h3 className="text-2xl font-bold text-white">{users.filter(u => u.role === 'admin' || u.is_staff).length}</h3>
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">Registered Users Directory</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-700/50 bg-slate-900/50 text-slate-400 text-xs uppercase font-semibold">
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Tariff / Goal</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30 text-sm">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 pl-6 font-medium text-white">
                    {u.first_name} {u.last_name}
                    <span className="block text-xs text-slate-400">@{u.username}</span>
                  </td>
                  <td className="p-4 text-slate-300">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      u.role === 'admin' || u.is_staff 
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {u.role || (u.is_staff ? 'admin' : 'citizen')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 text-xs">
                    ₹{u.profile?.electricity_tariff || 8.0} / kWh • {u.profile?.monthly_energy_goal || 220} kWh/mo
                  </td>
                  <td className="p-4">
                    {u.is_active ? (
                      <span className="text-emerald-400 flex items-center text-xs font-medium">
                        <CheckCircle size={14} className="mr-1" /> Active
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center text-xs font-medium">
                        <XCircle size={14} className="mr-1" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      Set as {u.role === 'admin' ? 'Citizen' : 'Admin'}
                    </button>
                    <button
                      onClick={() => handleToggleActive(u.id, u.is_active)}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        u.is_active 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      }`}
                    >
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
