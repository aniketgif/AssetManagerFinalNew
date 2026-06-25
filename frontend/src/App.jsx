import React, { useState, useEffect } from 'react';
import GlobeView from './components/GlobeView';
import AssetSidebar from './components/AssetSidebar';
import { ShieldAlert, Activity, DollarSign } from 'lucide-react';

function App() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch asset status on load
  useEffect(() => {
    fetch('http://localhost:8000/api/assets')
      .then(res => res.json())
      .then(data => {
        setAssets(data.assets);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch assets", err);
        setLoading(false);
      });
  }, []);

  // Compute Network Metrics for the HUD (3-Second Rule)
  const exceptions = assets.filter(a => a.risk_status === 'Red' || a.risk_status === 'Yellow');
  const criticalCount = assets.filter(a => a.risk_status === 'Red').length;
  const warningCount = assets.filter(a => a.risk_status === 'Yellow').length;
  
  // Total Risk Exposure Calculation: 
  // Unplanned Cost ($2.55M) * Average Risk Probability of Exceptions
  const avgRisk = exceptions.length > 0 
    ? exceptions.reduce((acc, a) => acc + (a.risk_score / 100), 0) / exceptions.length 
    : 0;
  const totalRiskExposure = exceptions.length * 2550000 * avgRisk;
  const formattedExposure = `$${(totalRiskExposure / 1000000).toFixed(1)}M`;

  return (
    <div className="w-screen h-screen bg-obsidian-900 overflow-hidden relative font-sans">
      
      {/* HUD: Command Center Navbar */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-widest uppercase flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-electric-green shadow-neon animate-pulse"></div>
            Global <span className="text-gray-400 font-light">Asset Network</span>
          </h1>
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mt-1">Predictive Decision Center</p>
        </div>

        {/* 3-Second Rule Metric Overlay */}
        {!loading && (
          <div className="glass-panel px-6 py-4 rounded-xl flex gap-8 pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                <Activity size={12} /> Monitored Assets
              </span>
              <span className="text-2xl font-mono text-white">{assets.length}</span>
            </div>
            
            <div className="w-px bg-white/10"></div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-alert-red uppercase tracking-widest flex items-center gap-1 mb-1 font-semibold">
                <ShieldAlert size={12} /> Critical Exceptions
              </span>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-mono text-alert-red">{criticalCount}</span>
                {warningCount > 0 && <span className="text-sm font-mono text-alert-amber mb-1">/ {warningCount} Warn</span>}
              </div>
            </div>

            <div className="w-px bg-white/10"></div>

            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                <DollarSign size={12} /> Total Risk Exposure
              </span>
              <span className="text-2xl font-mono text-white">{formattedExposure}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main 3D Globe */}
      {!loading && (
        <GlobeView 
          assets={assets} 
          onSelectAsset={(asset) => setSelectedAsset(asset)} 
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-obsidian-900 z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-t-2 border-electric-green rounded-full animate-spin"></div>
            <div className="text-gray-400 text-sm tracking-widest uppercase">Initializing Telemetry...</div>
          </div>
        </div>
      )}

      {/* Sidebar for details */}
      <AssetSidebar 
        asset={selectedAsset} 
        onClose={() => setSelectedAsset(null)} 
      />

    </div>
  );
}

export default App;
