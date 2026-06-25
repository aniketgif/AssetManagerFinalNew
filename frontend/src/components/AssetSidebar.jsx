import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { X, SlidersHorizontal, AlertTriangle, Crosshair, ChevronRight } from 'lucide-react';

const AssetSidebar = ({ asset, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayDays, setDelayDays] = useState(0); // For What-If Simulation

  useEffect(() => {
    if (asset) {
      setLoading(true);
      setDelayDays(0);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      fetch(`${API_URL}/api/assets/${asset.asset_id}/history`)
        .then(res => res.json())
        .then(data => {
          setHistory(data.history);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch history", err);
          setLoading(false);
        });
    }
  }, [asset]);

  if (!asset) return null;

  // The Big 'D' is Decisions: Simulation Logic
  const baseRisk = asset.risk_score / 100;
  
  // What-If logic: Each day of delay increases the probability of catastrophic failure by 3%
  const simulatedRisk = Math.min(1.0, baseRisk + (delayDays * 0.03));
  
  const unplannedCost = 2550000;
  const plannedCost = 30000;
  
  // Active Exploration: Dynamic cost modeling
  const baselineSavings = (unplannedCost * baseRisk) - plannedCost;
  const simulatedSavings = (unplannedCost * simulatedRisk) - plannedCost;
  
  // Negative Externality of the delay decision
  const costOfInaction = simulatedSavings - baselineSavings;

  const isAtRisk = asset.risk_status === 'Yellow' || asset.risk_status === 'Red';
  
  // Functional Styling logic
  const statusColor = asset.risk_status === 'Red' ? 'text-alert-red' : asset.risk_status === 'Yellow' ? 'text-alert-amber' : 'text-electric-green';
  const statusBorder = asset.risk_status === 'Red' ? 'border-alert-red' : asset.risk_status === 'Yellow' ? 'border-alert-amber' : 'border-electric-green';

  return (
    <div className={`fixed top-0 right-0 h-full w-[450px] glass-panel transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${asset ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto z-50 flex flex-col border-l border-white/10`}>
      
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-start sticky top-0 bg-obsidian-900/80 backdrop-blur-md z-10">
        <div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1 mb-1">
            <Crosshair size={12} /> Asset Selected
          </span>
          <h2 className="text-3xl font-mono text-white tracking-tight">{asset.asset_id}</h2>
          <p className="text-gray-400 text-xs font-mono mt-1">LAT {asset.latitude.toFixed(3)} • LON {asset.longitude.toFixed(3)}</p>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6 flex flex-col gap-8">
        
        {/* Core State (Context is Mandatory) */}
        <section>
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Diagnostic State</h3>
            <span className={`text-sm font-bold uppercase tracking-widest ${statusColor}`}>
              {asset.risk_status}
            </span>
          </div>
          <div className="bg-obsidian-900 border border-white/5 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Remaining Useful Life</span>
              <span className="font-mono text-lg text-white">{asset.rul}</span>
            </div>
            <div className="w-full bg-obsidian-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full ${statusColor.replace('text-', 'bg-')}`}
                style={{ width: `${asset.risk_score}%` }}>
              </div>
            </div>
            <p className="text-[10px] text-right mt-2 text-gray-500 font-mono">Algorithm Confidence: {asset.risk_score.toFixed(1)}%</p>
          </div>
        </section>

        {/* Causal Charting (Context over Data Dump) */}
        <section>
          <h3 className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-3">Root Cause: Pressure Drift (TP2)</h3>
          <div className="h-40 w-full bg-obsidian-900 rounded-lg p-3 border border-white/5 relative">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm font-mono">Querying Node...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#475569" fontSize={10} width={25} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                    labelStyle={{ display: 'none' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  {/* Context is Mandatory: The Baseline */}
                  <ReferenceLine y={history.length ? history[Math.floor(history.length/2)].TP2 : 0} stroke="#475569" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="TP2" stroke="#00ff9d" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              <div className="w-2 h-0.5 bg-[#475569] border-dashed border"></div>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">Expected Baseline</span>
            </div>
          </div>
        </section>

        {/* The Art of Problem Solving: What-If Simulator */}
        {isAtRisk && (
          <section className="bg-electric-dim border border-electric-green/20 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs text-electric-green uppercase tracking-widest font-semibold flex items-center gap-2">
                <SlidersHorizontal size={14} /> Decision Simulator
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Defer Maintenance By:</span>
                <span className="text-sm font-mono text-white">{delayDays} Days</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="14" 
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value))}
                className="w-full accent-electric-green h-1 bg-obsidian-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Surface Externalities explicitly */}
            <div className="space-y-3 pt-4 border-t border-electric-green/10">
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Projected Failure Probability</span>
                <span className="text-xs font-mono text-alert-red">{(simulatedRisk * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">Cost of Inaction (Externality)</span>
                <span className="text-xs font-mono text-alert-red">+${(costOfInaction / 1000).toFixed(1)}k</span>
              </div>
            </div>

            <button className="w-full mt-6 bg-electric-green hover:bg-[#00e68d] text-obsidian-900 font-bold text-sm py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 tracking-wide">
              DISPATCH CREW NOW <ChevronRight size={16} />
            </button>
          </section>
        )}

      </div>
    </div>
  );
};

export default AssetSidebar;
