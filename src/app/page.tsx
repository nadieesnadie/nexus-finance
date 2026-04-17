'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles, LayoutDashboard, Wallet, Settings, Menu, RefreshCw } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { exportToCSV } from '@/lib/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { 
    assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, 
    history, setRange, currentRange, isHistoryLoading, error: storeError
  } = useFinanceStore();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(() => fetchAssets(), 60000);
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId) || assets[0],
  [assets, selectedAssetId]);

  const chartColor = useMemo(() => {
    if (history.length < 2) return '#a78bfa';
    const first = history[0].value;
    const last = history[history.length - 1].value;
    return last >= first ? '#22c55e' : '#ef4444';
  }, [history]);

  const yDomain = useMemo(() => {
    if (history.length === 0) return ['auto', 'auto'];
    const values = history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15 || min * 0.02;
    return [min - padding, max + padding];
  }, [history]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-[#0d081a]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-t-4 border-violet-500 rounded-full animate-spin"></div>
        <p className="text-violet-200 text-sm tracking-[0.5em] font-light uppercase">Nexus Terminal Initializing</p>
      </div>
    </div>
  );

  const ranges = [
    { label: '1D', value: '1' },
    { label: '5D', value: '5' },
    { label: '1M', value: '30' },
    { label: '6M', value: '180' },
    { label: 'YTD', value: 'ytd' },
    { label: '1Y', value: '365' },
    { label: '5Y', value: '1825' },
    { label: 'ALL', value: 'max' },
  ];

  return (
    <div className="flex h-screen bg-[#0d081a] text-white font-sans antialiased overflow-hidden selection:bg-violet-500/30">
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1435,transparent)] pointer-events-none" />

      {/* SIDEBAR */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 260 : 80 }}
        className="h-full border-r border-white/5 bg-[#080514]/90 backdrop-blur-3xl flex flex-col items-start py-8 px-4 z-50 relative hidden lg:flex"
      >
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-violet-600 text-white flex items-center justify-center font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.4)]">N</div>
          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-white font-black text-2xl tracking-tighter">NEXUS</motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-col gap-6 w-full px-2">
          <SidebarItem icon={<LayoutDashboard size={24} />} label="Terminal" active expanded={isSidebarExpanded} />
          <SidebarItem icon={<TrendingUp size={24} />} label="Market Pulse" expanded={isSidebarExpanded} />
          <SidebarItem icon={<Wallet size={24} />} label="Assets" expanded={isSidebarExpanded} />
          <SidebarItem icon={<Settings size={24} />} label="Engine" expanded={isSidebarExpanded} />
        </nav>
      </motion.aside>

      {/* MAIN VIEW */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="p-8 lg:p-12 max-w-[1700px] mx-auto">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16">
            <div className="flex items-center gap-10">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-center justify-center shadow-2xl backdrop-blur-xl group hover:border-violet-500/50 transition-all">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-5">
                  <h1 className="text-6xl font-normal text-white tracking-tighter leading-none">{selectedAsset?.name || 'Syncing...'}</h1>
                  <span className="text-2xl text-violet-400/50 font-bold uppercase tracking-widest">{selectedAsset?.symbol}</span>
                  <a href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} target="_blank" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-violet-400 hover:bg-white/10 transition-all">
                    <ExternalLink size={20} />
                  </a>
                </div>
                <div className="flex items-center gap-8 mt-4">
                  <span className="text-5xl font-normal text-white tabular-nums tracking-tighter">
                    ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <div className={`flex items-center gap-2 text-2xl font-medium px-4 py-1 rounded-xl ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? <ArrowUp size={24} /> : <ArrowDown size={24} />}
                    {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <button onClick={() => exportToCSV(assets, 'nexus-audit')} className="text-violet-300/60 hover:text-white font-bold text-xs uppercase tracking-[0.3em] border-b border-transparent hover:border-white transition-all">Download Audit</button>
              <ConnectButton />
            </div>
          </header>

          {storeError && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-3xl mb-12 flex justify-between items-center backdrop-blur-xl">
              <div className="flex items-center gap-4 text-lg font-medium">
                <Info size={24} />
                <span>{storeError}</span>
              </div>
              <button onClick={() => fetchAssets()} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                <RefreshCw size={18} /> Re-establish Feed
              </button>
            </motion.div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            
            <div className="xl:col-span-8 flex flex-col gap-16">
              
              {/* Main Terminal Chart */}
              <div className="bg-[#0c0a1f]/40 border border-white/5 rounded-[3.5rem] p-12 min-h-[650px] flex flex-col relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.4)] backdrop-blur-md">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0d081a]/90 backdrop-blur-xl z-30 flex items-center justify-center flex-col gap-6">
                    <div className="w-12 h-12 border-2 border-violet-500 border-t-white rounded-full animate-spin"></div>
                    <p className="text-violet-200 text-xs font-black tracking-[0.5em] uppercase animate-pulse">Syncing Time-Series Data</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-16 z-10 gap-8">
                  <div className="flex bg-black/40 backdrop-blur-2xl p-1 rounded-2xl border border-white/10 shadow-2xl">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setRange(r.value)}
                        className={`px-7 py-3 text-[11px] font-black tracking-widest transition-all rounded-xl uppercase ${currentRange === r.value ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.2)]' : 'text-white/40 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-black text-violet-400 bg-violet-500/5 px-6 py-3 rounded-full border border-violet-500/20 uppercase tracking-[0.3em]">
                    <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_15px_#8b5cf6] animate-pulse" />
                    Terminal: Online
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[450px] cursor-crosshair">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.01)" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.3, fontWeight: 700 }}
                        minTickGap={70}
                        dy={20}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.3, fontWeight: 700 }}
                        tickFormatter={(val) => val.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{ stroke: 'rgba(139, 92, 246, 0.4)', strokeWidth: 1 }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#0d081a] border border-white/20 p-6 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-3">
                                  {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                                </p>
                                <div className="flex flex-col gap-2">
                                  <span className="text-violet-400 text-[9px] uppercase font-black tracking-[0.3em]">Snapshot Value</span>
                                  <p className="text-white text-4xl font-normal tabular-nums leading-none tracking-tighter">
                                    ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chartColor} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Technical Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-2">
                <StatRow label="Market Capitalization" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                <StatRow label="Available Liquidity (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
                <StatRow label="Current Circulation" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
                <StatRow label="Max Protocol Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="Intraday Volatility" value={`$${selectedAsset?.low_24h?.toLocaleString(undefined, {maximumFractionDigits: 2})} - $${selectedAsset?.high_24h?.toLocaleString(undefined, {maximumFractionDigits: 2})}`} />
                <StatRow label="Historical Milestone (ATH)" value={`$${selectedAsset?.ath?.toLocaleString(undefined, {maximumFractionDigits: 2})}`} />
                <StatRow label="Protocol Genesis" value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label="Fully Diluted Valuation" value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
              </div>

              {/* AI Section */}
              <div className="border border-white/10 p-12 rounded-[3.5rem] bg-gradient-to-br from-violet-600/10 to-transparent">
                <div className="flex items-center gap-4 mb-8 text-violet-400 font-black tracking-[0.4em] text-xs uppercase">
                  <Sparkles size={20} />
                  <span>Nexus Intelligence Report</span>
                </div>
                <p className="text-white text-3xl font-light leading-tight tracking-tight">
                  {selectedAsset?.name} is currently processing at ${selectedAsset?.current_price?.toLocaleString(undefined, {maximumFractionDigits: 4})}. 
                  Market sentiment is {selectedAsset?.price_change_percentage_24h >= 0 ? 'expanding' : 'contracting'} with a 24h efficiency of {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%. 
                </p>
              </div>
            </div>

            {/* RIGHT SIDE: Yahoo Trending Widget */}
            <div className="xl:col-span-4 flex flex-col gap-16">
              
              <div>
                <h3 className="text-white text-[11px] font-black tracking-[0.4em] uppercase mb-10 flex items-center gap-3 opacity-40">
                  <Activity size={18} className="text-violet-500" /> Market Intensity
                </h3>
                <div className="bg-black/30 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Asset</th>
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right">Price</th>
                        <th className="p-6 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] text-right">Shift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.slice(0, 10).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-violet-500/10 cursor-pointer transition-all ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-6">
                            <div className="font-black text-base text-white tracking-tighter">{asset.symbol.toUpperCase()}</div>
                            <div className="text-[11px] text-white/40 font-medium truncate max-w-[120px]">{asset.name}</div>
                          </td>
                          <td className="p-6 text-right">
                            <div className="text-base font-normal text-white tabular-nums">${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}</div>
                          </td>
                          <td className="p-6 text-right">
                            <div className={`font-black tabular-nums text-xs ${asset.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ranking */}
              <div className="flex flex-col gap-6">
                <h3 className="text-white text-[11px] font-black tracking-[0.4em] uppercase mb-4 px-4 opacity-40 text-center">Top 50 Ranking</h3>
                <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar border border-white/5 rounded-[2.5rem] bg-black/20">
                  {assets.map((asset) => (
                    <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`p-6 cursor-pointer flex justify-between items-center border-b border-white/[0.03] last:border-0 transition-all ${selectedAssetId === asset.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}>
                      <div className="flex items-center gap-5">
                        <img src={asset.image} alt="" className="w-8 h-8 object-contain" />
                        <div>
                          <div className={`font-black text-base tracking-tighter ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-normal tabular-nums ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>
                        ${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, expanded = false }: { icon: React.ReactNode; label: string; active?: boolean; expanded?: boolean }) {
  return (
    <div className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-violet-600 text-white shadow-[0_0_30px_rgba(139,92,246,0.3)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
      <div className="shrink-0">{icon}</div>
      <AnimatePresence>
        {expanded && (
          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-base font-black tracking-tight whitespace-nowrap">
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-5 border-b border-white/5 last:border-0">
      <span className="text-white text-[11px] font-black uppercase tracking-[0.2em] opacity-30">{label}</span>
      <span className="text-white text-lg font-normal tabular-nums">{value}</span>
    </div>
  );
}
