'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Crosshair
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles, LayoutDashboard, Wallet, Settings, Menu } from 'lucide-react';
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
    if (history.length < 2) return '#FFFFFF';
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
    <div className="flex items-center justify-center h-screen bg-[#0a0b0d]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-sm tracking-[0.3em] font-light">NEXUS TERMINAL BOOTING...</p>
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
    <div className="flex h-screen bg-[#0a0b0d] text-white font-sans antialiased overflow-hidden selection:bg-white/20">
      
      {/* Radial Glow Effect for Background Depth */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1a1d23,transparent)] pointer-events-none" />

      {/* LEFT SIDEBAR */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 240 : 80 }}
        className="h-full border-r border-white/5 bg-[#08090a]/80 backdrop-blur-xl flex flex-col items-start py-8 px-4 z-50 relative hidden lg:flex"
      >
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-xl rounded-lg shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.1)]">N</div>
          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-white font-bold text-xl tracking-tighter">NEXUS</motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-col gap-4 w-full">
          <SidebarItem icon={<LayoutDashboard size={22} />} label="Dashboard" active expanded={isSidebarExpanded} />
          <SidebarItem icon={<TrendingUp size={22} />} label="Markets" expanded={isSidebarExpanded} />
          <SidebarItem icon={<Wallet size={22} />} label="Portfolio" expanded={isSidebarExpanded} />
          <SidebarItem icon={<Settings size={22} />} label="Settings" expanded={isSidebarExpanded} />
        </nav>
      </motion.aside>

      {/* MAIN VIEW */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center shadow-2xl backdrop-blur-md">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-normal text-white tracking-tight leading-none">{selectedAsset?.name || 'Asset Stream'}</h1>
                  <span className="text-2xl text-white/40 font-light uppercase tracking-widest">{selectedAsset?.symbol}</span>
                  <a href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} target="_blank" className="text-white/20 hover:text-white transition-all">
                    <ExternalLink size={20} />
                  </a>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <span className="text-4xl font-normal text-white tabular-nums tracking-tighter">
                    ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className={`flex items-center gap-1 text-xl font-medium ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? '+' : ''}{selectedAsset?.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => exportToCSV(assets, 'nexus-analytics')} className="text-white/60 hover:text-white hover:underline text-xs font-medium uppercase tracking-[0.2em] transition-all">Audit CSV</button>
              <ConnectButton />
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            
            {/* CENTER: Main Chart & Stats */}
            <div className="xl:col-span-8 flex flex-col gap-12">
              
              {/* Chart Card */}
              <div className="bg-[#0c0d0f]/60 border border-white/5 rounded-[2.5rem] p-10 min-h-[600px] flex flex-col relative overflow-hidden shadow-2xl backdrop-blur-sm">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0a0b0d]/80 backdrop-blur-md z-30 flex items-center justify-center">
                    <p className="text-white text-xs font-medium tracking-[0.4em] uppercase animate-pulse">Scanning Block History...</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 z-10 gap-6">
                  <div className="flex border border-white/10 rounded-lg overflow-hidden bg-black/20">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        onClick={() => setRange(r.value)}
                        className={`px-6 py-2.5 text-[10px] font-bold tracking-widest transition-all border-r border-white/10 last:border-0 uppercase ${currentRange === r.value ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-white/30 tracking-[0.2em] uppercase">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e]" />
                    Feed: Verified Yahoo 10m
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[420px] cursor-crosshair">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.25}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 10, opacity: 0.5 }}
                        minTickGap={60}
                        dy={15}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 10, opacity: 0.5 }}
                        tickFormatter={(val) => val.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                        width={90}
                      />
                      <Tooltip 
                        trigger="hover"
                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#08090a] border border-white/20 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
                                <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.2em] mb-3 border-b border-white/5 pb-2">
                                  {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                                </p>
                                <div className="flex flex-col gap-1">
                                  <span className="text-white/40 text-[9px] uppercase font-bold tracking-widest">Price Point</span>
                                  <p className="text-white text-3xl font-normal tabular-nums leading-none tracking-tighter">
                                    ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
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
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={800}
                        activeDot={{ r: 6, fill: '#FFFFFF', stroke: chartColor, strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-1">
                <StatRow label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                <StatRow label="Circulating Supply" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
                <StatRow label="Volume (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
                <StatRow label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label="Day's Range" value={`$${selectedAsset?.low_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})} - $${selectedAsset?.high_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})}`} />
                <StatRow label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="All-time High" value={`$${selectedAsset?.ath?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} />
                <StatRow label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label="All-time Low" value={`$${selectedAsset?.atl?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} />
                <StatRow label="Fully Diluted Val." value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
              </div>
            </div>

            {/* RIGHT SIDE: Trending */}
            <div className="xl:col-span-4 flex flex-col gap-12">
              
              <div>
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-8 flex items-center gap-2 opacity-60">
                  <Activity size={16} /> Market Intensity
                </h3>
                <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="p-4 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">Ticker</th>
                        <th className="p-4 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] text-right">Last Price</th>
                        <th className="p-4 text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.slice(0, 10).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.02] last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-4">
                            <div className="font-bold text-sm text-white tracking-tight">{asset.symbol.toUpperCase()}</div>
                            <div className="text-[10px] text-white/30 font-medium truncate max-w-[100px]">{asset.name}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-sm font-normal text-white tabular-nums">${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className={`inline-block font-bold tabular-nums text-xs ${asset.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-4 px-2 opacity-60 text-center">Top 50 Liquidity Ranking</h3>
                <div className="flex flex-col max-h-[500px] overflow-y-auto custom-scrollbar border border-white/5 rounded-2xl bg-black/40">
                  {assets.map((asset) => (
                    <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`p-4 cursor-pointer flex justify-between items-center border-b border-white/[0.02] last:border-0 transition-all ${selectedAssetId === asset.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}>
                      <div className="flex items-center gap-4">
                        <img src={asset.image} alt="" className="w-6 h-6 object-contain" />
                        <div>
                          <div className={`font-bold text-sm ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name}</div>
                        </div>
                      </div>
                      <div className={`text-xs font-medium tabular-nums ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>
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
    <div className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-white text-black shadow-2xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
      <div className="shrink-0">{icon}</div>
      <AnimatePresence>
        {expanded && (
          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-sm font-bold tracking-tight whitespace-nowrap">
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
      <span className="text-white text-[11px] font-bold uppercase tracking-wider opacity-40">{label}</span>
      <span className="text-white text-base font-normal tabular-nums">{value}</span>
    </div>
  );
}
