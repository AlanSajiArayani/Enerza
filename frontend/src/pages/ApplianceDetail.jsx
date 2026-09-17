import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ApplianceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8 flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Appliance Details</h1>
          <p className="text-slate-400">Deep dive into {id} usage.</p>
        </div>
      </header>

      <div className="glass-panel p-8 rounded-2xl text-center">
        <h2 className="text-xl text-white font-medium mb-4">Detailed Analytics for {id}</h2>
        <p className="text-slate-400 mb-6">In a full production version, this page would show historical graphs, usage patterns, and anomaly heatmaps specifically for this appliance.</p>
        <div className="inline-block p-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
          Check the main Dashboard and Alerts pages for aggregated appliance insights.
        </div>
      </div>
    </div>
  );
};

export default ApplianceDetail;
