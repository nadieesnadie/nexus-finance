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
  const [activePayload, setActivePayload] = useState<any>(null);

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
      <p className="text-white text-xl font-light tracking-[0.3em] animate-pulse">NEXUS TERMINAL BOOTING...</p>
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
    <div className="flex h-screen bg-[#0d081a] text-white font-sans antialiased overflow-hidden">
      
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1435,transparent)] pointer-events-none" />

      {/* SIDEBAR */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 260 : 80 }}
        className="h-full border-r border-white/5 bg-[#080514]/90 backdrop-blur-3xl flex flex-col py-8 px-4 z-50 relative hidden lg:flex"
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
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 bg-transparent">
        <div className="p-8 lg:p-12 max-w-[1700px] mx-auto pb-32">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-normal text-white tracking-tight">{selectedAsset?.name}</h1>
                  <span className="text-2xl text-white/40 font-light uppercase">{selectedAsset?.symbol}</span>
                </div>
                <div className="flex items-center gap-6 mt-2">
                  <span className="text-4xl font-normal text-white tabular-nums">
                    ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <div className={`flex items-center gap-2 text-xl font-medium ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? '+' : ''}{selectedAsset?.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            <ConnectButton />
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 flex flex-col gap-12">
              
              {/* YAHOO STYLE CHART CARD */}
              <div className="bg-black/40 border border-white/10 rounded-[2rem] p-8 min-h-[600px] flex flex-col relative overflow-visible">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0d081a]/80 backdrop-blur-sm z-30 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-violet-500" size={32} />
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-10 z-10 px-2">
                  <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setRange(r.value)}
                        className={`px-5 py-2 text-[10px] font-bold tracking-widest transition-all border-r border-white/10 last:border-0 uppercase ${currentRange === r.value ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Verified Data Stream</div>
                </div>

                <div className="flex-1 w-full min-h-[400px] cursor-crosshair relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart 
                      data={history} 
                      margin={{ top: 20, right: 10, left: 10, bottom: 40 }}
                      onMouseMove={(e: any) => {
                        if (e.activePayload) setActivePayload(e.activePayload[0].payload);
                      }}
                      onMouseLeave={() => setActivePayload(null)}
                    >
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="time" 
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.5 }}
                        dy={25}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.5 }}
                        tickFormatter={(val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        width={80}
                      />
                      
                      {/* YAHOO CROSSHAIR SYSTEM */}
                      <Tooltip 
                        isAnimationActive={false}
                        cursor={{ stroke: '#FFFFFF', strokeWidth: 1, strokeDasharray: '5 5' }}
                        content={() => null} // We use a custom display below
                      />
                      
                      {activePayload && (
                        <ReferenceLine y={activePayload.value} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                      )}

                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={chartColor} 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={500}
                        activeDot={{ r: 5, fill: '#FFF', stroke: chartColor, strokeWidth: 3 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* CUSTOM YAHOO TOOLTIP OVERLAY */}
                  <AnimatePresence>
                    {activePayload && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute top-0 left-0 bg-white text-black px-4 py-2 rounded shadow-2xl z-40 font-bold text-xs"
                      >
                        {format(new Date(activePayload.time), 'MMM dd, HH:mm:ss')} • ${activePayload.value.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* TECHNICAL DATA - YAHOO STYLE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-1">
                <StatRow label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                <StatRow label="Circulating Supply" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
                <StatRow label="Volume (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
                <StatRow label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label="Day's Range" value={`$${selectedAsset?.low_24h?.toLocaleString()} - $${selectedAsset?.high_24h?.toLocaleString()}`} />
                <StatRow label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="All-time High" value={`$${selectedAsset?.ath?.toLocaleString()}`} />
                <StatRow label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label="All-time Low" value={`$${selectedAsset?.atl?.toLocaleString()}`} />
                <StatRow label="Fully Diluted Val." value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
              </div>
            </div>

            {/* RIGHT SIDE: TRENDING */}
            <div className="xl:col-span-4 flex flex-col gap-12">
              <div>
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-8 flex items-center gap-2 opacity-40">
                  <Activity size={16} /> Market Intensity
                </h3>
                <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="p-5 text-[10px] font-bold text-white/40 uppercase">Ticker</th>
                        <th className="p-5 text-[10px] font-bold text-white/40 uppercase text-right">Last</th>
                        <th className="p-5 text-[10px] font-bold text-white/40 uppercase text-right">Shift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.slice(0, 10).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-5">
                            <div className="font-bold text-sm text-white">{asset.symbol.toUpperCase()}</div>
                            <div className="text-[10px] text-white/30 truncate max-w-[100px]">{asset.name}</div>
                          </td>
                          <td className="p-5 text-right font-normal text-sm tabular-nums">${asset.current_price.toLocaleString()}</td>
                          <td className="p-5 text-right">
                            <div className={`inline-block font-bold text-[10px] px-2 py-1 rounded ${asset.price_change_percentage_24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
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
    <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
      <span className="text-white text-[11px] font-bold uppercase tracking-[0.1em] opacity-40">{label}</span>
      <span className="text-white text-base font-normal tabular-nums">{value}</span>
    </div>
  );
}
