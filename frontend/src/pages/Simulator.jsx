import React, { useState, useEffect } from 'react';
import { getAppliances } from '../services/api';
import { Calculator, ArrowRight, IndianRupee } from 'lucide-react';

const Simulator = () => {
  const [appliances, setAppliances] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [currentHours, setCurrentHours] = useState(0);
  const [targetHours, setTargetHours] = useState(0);

  useEffect(() => {
    getAppliances().then(res => {
      setAppliances(res);
      if (res.length > 0) {
        setSelectedAppId(res[0].id);
        setCurrentHours(6); // Mock default
        setTargetHours(4);
      }
    }).catch(err => console.error(err));
  }, []);

  const selectedApp = appliances.find(a => a.id === selectedAppId);
  
  // Calculate mock savings based on linear reduction
  const reductionRatio = currentHours > 0 ? (currentHours - targetHours) / currentHours : 0;
  const currentMonthly = selectedApp ? selectedApp.monthly_kwh : 0;
  const savedKwh = currentMonthly * Math.max(0, reductionRatio);
  const savedCost = savedKwh * 8.0; // Rs 8 per kWh

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">What-If Simulator</h1>
        <p className="text-slate-400">Discover how changing appliance habits impacts your wallet.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 rounded-2xl space-y-8">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Appliance</label>
            <select 
              value={selectedAppId} 
              onChange={e => setSelectedAppId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            >
              {appliances.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4">Current Usage: {currentHours} hours/day</label>
            <input 
              type="range" 
              min="0" 
              max="24" 
              value={currentHours} 
              onChange={e => setCurrentHours(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-4">Target Usage: {targetHours} hours/day</label>
            <input 
              type="range" 
              min="0" 
              max="24" 
              value={targetHours} 
              onChange={e => setTargetHours(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="glass-panel p-8 rounded-2xl flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-emerald-500/10 rounded-full mb-6">
            <Calculator size={48} className="text-emerald-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Estimated Impact</h2>
          <p className="text-slate-400 mb-8">By reducing {selectedApp?.name || 'appliance'} usage from {currentHours}h to {targetHours}h per day.</p>

          <div className="w-full space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <span className="text-slate-300">Energy Reduction</span>
              <span className="text-xl font-bold text-white">{savedKwh.toFixed(1)} kWh/mo</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <span className="text-slate-300">Monthly Savings</span>
              <span className="text-xl font-bold text-emerald-400 flex items-center">
                <IndianRupee size={20} className="mr-1" />
                {savedCost.toFixed(0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-emerald-900/30 rounded-xl border border-emerald-500/30">
              <span className="text-emerald-300 font-medium">Annual Savings</span>
              <span className="text-2xl font-bold text-emerald-400 flex items-center">
                <IndianRupee size={24} className="mr-1" />
                {(savedCost * 12).toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
