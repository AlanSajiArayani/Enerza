import React, { useEffect, useState } from 'react';
import { getAlerts } from '../services/api';
import { AlertTriangle, AlertCircle, Leaf } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts().then(res => {
      setAlerts(res);
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
        <h1 className="text-3xl font-bold text-white mb-2">Alert Center</h1>
        <p className="text-slate-400">AI-detected anomalies and energy waste events.</p>
      </header>

      {alerts.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center flex flex-col items-center">
          <div className="p-4 bg-emerald-500/10 rounded-full mb-4">
            <Leaf size={48} className="text-emerald-400" />
          </div>
          <h2 className="text-xl font-medium text-white mb-2">All Clear!</h2>
          <p className="text-slate-400">No unusual consumption or waste detected recently. Your household is running efficiently.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, i) => (
            <div key={i} className={`glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start border-l-4 ${alert.severity === 'high' ? 'border-l-red-500' : 'border-l-amber-500'}`}>
              <div className={`p-3 rounded-xl shrink-0 ${alert.severity === 'high' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {alert.severity === 'high' ? <AlertCircle size={24} /> : <AlertTriangle size={24} />}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      {alert.issue}
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {alert.appliance_name}
                      </span>
                    </h3>
                    <p className="text-slate-300 mt-1">{alert.explanation}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm text-slate-400">Estimated Impact</span>
                    <span className="block font-medium text-red-400">₹{alert.estimated_cost}</span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300"><span className="font-semibold">Recommendation:</span> {alert.recommendation}</p>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Detected: {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
