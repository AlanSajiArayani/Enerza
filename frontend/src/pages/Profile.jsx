import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    preferredCurrency: profile?.preferred_currency || 'INR',
    electricityTariff: profile?.electricity_tariff ?? 8.0,
    monthlyEnergyGoal: profile?.monthly_energy_goal ?? 220.0,
    notificationPreference: profile?.notification_preference ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && profile) {
      setFormData({
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        preferredCurrency: profile.preferred_currency || 'INR',
        electricityTariff: profile.electricity_tariff ?? 8.0,
        monthlyEnergyGoal: profile.monthly_energy_goal ?? 220.0,
        notificationPreference: profile.notification_preference ?? true,
      });
    }
  }, [user, profile]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        preferred_currency: formData.preferredCurrency,
        electricity_tariff: parseFloat(formData.electricityTariff),
        monthly_energy_goal: parseFloat(formData.monthlyEnergyGoal),
        notification_preference: formData.notificationPreference,
      });
      setSuccessMsg('Profile and preferences updated successfully!');
    } catch (err) {
      setErrorMsg('Failed to update profile. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400">Manage your personal details and energy optimization preferences.</p>
      </header>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-2">
          <CheckCircle2 size={20} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="glass-panel p-8 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User size={20} className="text-blue-400" />
              Personal Information
            </h2>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize flex items-center gap-1">
              <ShieldCheck size={14} />
              Role: {user?.role || 'Citizen'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
              <input
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Kochi, Kerala"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Energy Preferences */}
        <div className="glass-panel p-8 rounded-2xl space-y-6">
          <div className="border-b border-slate-700/50 pb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              Energy & Tariff Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Preferred Currency</label>
              <select
                name="preferredCurrency"
                value={formData.preferredCurrency}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Electricity Tariff (/ kWh)</label>
              <input
                type="number"
                step="0.1"
                name="electricityTariff"
                value={formData.electricityTariff}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Monthly Energy Goal (kWh)</label>
              <input
                type="number"
                name="monthlyEnergyGoal"
                value={formData.monthlyEnergyGoal}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-3">
            <input
              type="checkbox"
              id="notificationPreference"
              name="notificationPreference"
              checked={formData.notificationPreference}
              onChange={handleChange}
              className="w-5 h-5 accent-blue-500 rounded cursor-pointer"
            />
            <label htmlFor="notificationPreference" className="text-sm text-slate-300 cursor-pointer">
              Enable anomaly and energy waste notifications
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
