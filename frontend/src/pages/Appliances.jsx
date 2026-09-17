import React, { useEffect, useState } from 'react';
import { getAppliances } from '../services/api';
import { Zap, IndianRupee, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Appliances = () => {
  const [appliances, setAppliances] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAppliances().then(res => {
      setAppliances(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Appliance Intelligence</h1>
        <p className="text-slate-400">Detailed breakdown of energy consumption by individual devices.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appliances.map(app => (
          <div 
            key={app.id} 
            className="glass-panel p-6 rounded-2xl hover:border-blue-500/30 transition-all cursor-pointer group"
            onClick={() => navigate(`/appliances/${app.id}`)}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{app.name}</h3>
              <div className="p-2 bg-slate-800 rounded-lg">
                <Zap size={18} className="text-blue-400" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-sm text-slate-400">Today's Energy</span>
                <span className="font-medium text-white">{app.today_kwh} kWh</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-sm text-slate-400">Monthly Est.</span>
                <span className="font-medium text-white">{app.monthly_kwh} kWh</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-700/50 pb-3">
                <span className="text-sm text-slate-400">Est. Cost (Today)</span>
                <span className="font-medium text-amber-400 flex items-center">
                  <IndianRupee size={14} className="mr-1" />
                  {app.estimated_cost}
                </span>
              </div>
              
              <div className="pt-2">
                {app.status === 'Normal' ? (
                  <div className="flex items-center text-sm text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-lg">
                    <CheckCircle2 size={16} className="mr-2" />
                    Operating Normally
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-amber-400 bg-amber-400/10 px-3 py-2 rounded-lg">
                    <AlertTriangle size={16} className="mr-2" />
                    Elevated Usage
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Appliances;
