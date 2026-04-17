'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine 
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
  const [hoverData, setHoverData] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
    const padding = (max - min) * 0.1;
    return [min - padding, max + padding];
  }, [history]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-[#0d081a]">
      <p className="text-white text-xl font-light tracking-[0.3em] animate-pulse uppercase">Connecting Nexus...</p>
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

  const handleMouseMove = (e: any) => {
    if (e.activePayload) {
      setHoverData(e.activePayload[0].payload);
      setMousePos({ x: e.chartX, y: e.chartY });
    }
  };

  return (
    <div className="flex h-screen bg-[#0d081a] text-white font-sans antialiased overflow-hidden">
      
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1435,transparent)] pointer-events-none" />

      {/* SIDEBAR */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 260 : 80 }}
        className="h-full border-r border-white/5 bg-[#080514]/95 backdrop-blur-3xl flex flex-col py-8 px-4 z-50 relative hidden lg:flex"
      >
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-violet-600 text-white flex items-center justify-center font-black text-2xl rounded-2xl">N</div>
          {isSidebarExpanded && <span className="text-white font-bold text-2xl tracking-tighter">NEXUS</span>}
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
        <div className="p-8 lg:p-12 max-w-[1700px] mx-auto pb-32">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-5">
                  <h1 className="text-6xl font-normal text-white tracking-tighter leading-none">{selectedAsset?.name}</h1>
                  <span className="text-2xl text-violet-400/40 font-bold uppercase tracking-widest">{selectedAsset?.symbol}</span>
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
            <ConnectButton />
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 flex flex-col gap-16">
              
              {/* YAHOO INTERACTIVE CHART CONTAINER */}
              <div className="bg-[#0c0a1f]/40 border border-white/10 rounded-[3.5rem] p-10 min-h-[650px] flex flex-col relative overflow-visible shadow-2xl backdrop-blur-md">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0d081a]/95 backdrop-blur-xl z-30 flex items-center justify-center flex-col gap-6 rounded-[3.5rem]">
                    <RefreshCw className="animate-spin text-violet-500" size={40} />
                    <p className="text-violet-200 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Syncing Precision Feed</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 z-10 gap-8">
                  <div className="flex bg-black/40 backdrop-blur-2xl p-1 rounded-2xl border border-white/10">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setRange(r.value)}
                        className={`px-7 py-3 text-[11px] font-black tracking-widest transition-all rounded-xl uppercase ${currentRange === r.value ? 'bg-white text-black shadow-2xl' : 'text-white/40 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[11px] font-black text-violet-400 bg-violet-500/5 px-6 py-3 rounded-full border border-violet-500/20 uppercase tracking-[0.3em]">
                    Terminal: Sync 10m
                  </div>
                </div>

                {/* THE CHART AREA */}
                <div className="flex-1 w-full min-h-[450px] cursor-crosshair relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={history} 
                      margin={{ top: 0, right: 10, left: -20, bottom: 40 }}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setHoverData(null)}
                    >
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.01)" />
                      <XAxis 
                        dataKey="time" 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.3, fontWeight: 700 }}
                        dy={25}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.3, fontWeight: 700 }}
                        tickFormatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        width={100}
                      />
                      
                      <Tooltip content={() => null} cursor={{ stroke: '#FFFFFF', strokeWidth: 1, strokeDasharray: '4 4' }} />

                      {hoverData && (
                        <ReferenceLine y={hoverData.value} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" />
                      )}

                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chartColor} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={0}
                        activeDot={{ r: 6, fill: '#FFFFFF', stroke: chartColor, strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* YAHOO AXIS BADGES (Price & Time) */}
                  <AnimatePresence>
                    {hoverData && (
                      <>
                        {/* Price Badge (Y-Axis) */}
                        <div 
                          className="absolute right-0 bg-white text-black px-3 py-1.5 rounded-l font-black text-[10px] z-40 tabular-nums pointer-events-none shadow-2xl"
                          style={{ top: mousePos.y - 12 }}
                        >
                          ${hoverData.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </div>

                        {/* Time Badge (X-Axis) */}
                        <div 
                          className="absolute bottom-[20px] bg-white text-black px-4 py-2 rounded font-black text-[10px] z-40 whitespace-nowrap pointer-events-none shadow-2xl"
                          style={{ left: mousePos.x - 60 }}
                        >
                          {format(new Date(hoverData.time), 'MMM dd, yyyy • HH:mm:ss')}
                        </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-2">
                <StatRow label="Market Capitalization" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                <StatRow label="Available Liquidity (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
                <StatRow label="Current Circulation" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
                <StatRow label="Max Protocol Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="Intraday Volatility" value={`$${selectedAsset?.low_24h?.toLocaleString()} - $${selectedAsset?.high_24h?.toLocaleString()}`} />
                <StatRow label="Historical Milestone (ATH)" value={`$${selectedAsset?.ath?.toLocaleString()}`} />
                <StatRow label="Protocol Genesis" value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label="Fully Diluted Valuation" value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
              </div>
            </div>

            {/* RIGHT SIDE: TRENDING */}
            <div className="xl:col-span-4 flex flex-col gap-12">
              <div>
                <h3 className="text-white text-[11px] font-black tracking-[0.4em] uppercase mb-10 flex items-center gap-3 opacity-30">
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
                          <td className="p-6 text-right font-normal text-base tabular-nums">${asset.current_price.toLocaleString()}</td>
                          <td className="p-6 text-right">
                            <div className={`inline-block font-black tabular-nums text-xs px-2 py-1 rounded ${asset.price_change_percentage_24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
    <div className={`flex items-center gap-5 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-violet-600 text-white shadow-2xl' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
      <div className="shrink-0">{icon}</div>
      {expanded && <span className="text-base font-bold tracking-tight">{label}</span>}
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
