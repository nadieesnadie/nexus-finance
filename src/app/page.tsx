'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line 
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
    const padding = (max - min) * 0.1 || min * 0.02;
    return [min - padding, max + padding];
  }, [history]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-black">
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
    <div className="flex h-screen bg-black text-white font-sans antialiased overflow-hidden selection:bg-white/20">
      
      {/* LEFT SIDEBAR: Collapsible "N" Menu */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 240 : 80 }}
        className="h-full border-r border-white/10 bg-[#050505] flex flex-col items-start py-8 px-4 z-50 relative hidden lg:flex"
      >
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-bold text-xl rounded-lg shrink-0">N</div>
          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-white font-bold text-xl tracking-tighter"
              >
                NEXUS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex flex-col gap-4 w-full">
          <SidebarItem icon={<LayoutDashboard size={22} />} label="Dashboard" active expanded={isSidebarExpanded} />
          <SidebarItem icon={<TrendingUp size={22} />} label="Markets" expanded={isSidebarExpanded} />
          <SidebarItem icon={<Wallet size={22} />} label="Portfolio" expanded={isSidebarExpanded} />
          <SidebarItem icon={<Settings size={22} />} label="Settings" expanded={isSidebarExpanded} />
        </nav>

        <div className="mt-auto w-full px-2">
          <div className={`flex items-center gap-4 text-white/40 hover:text-white transition-colors cursor-pointer`}>
            <Menu size={22} />
            {isSidebarExpanded && <span className="text-sm font-medium">Terminal Help</span>}
          </div>
        </div>
      </motion.aside>

      {/* MAIN VIEW */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          
          {/* Header */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center shadow-2xl">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-normal text-white tracking-tight">{selectedAsset?.name || 'Asset Stream'}</h1>
                  <span className="text-2xl text-white/40 font-light uppercase tracking-widest">{selectedAsset?.symbol}</span>
                  <a 
                    href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} 
                    target="_blank" 
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white transition-all"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <span className="text-4xl font-normal text-white tabular-nums tracking-tighter">
                    ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className={`flex items-center gap-1 text-xl font-medium ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? '+' : ''}{selectedAsset?.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => exportToCSV(assets, 'nexus-analytics')} className="text-white hover:underline text-xs font-medium uppercase tracking-widest">Export Dataset</button>
              <ConnectButton />
            </div>
          </header>

          {storeError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-10 flex justify-between items-center text-sm font-medium">
              <span>{storeError}</span>
              <button onClick={() => fetchAssets()} className="underline font-bold">RETRY FEED</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            
            {/* CENTER: Main Chart & Tech Stats */}
            <div className="xl:col-span-8 flex flex-col gap-12">
              
              {/* Chart Card */}
              <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-10 min-h-[550px] flex flex-col relative overflow-hidden">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center">
                    <p className="text-white text-xs font-medium tracking-[0.4em] uppercase animate-pulse">Re-indexing Market Time...</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 z-10 gap-6">
                  <div className="flex border border-white/10 rounded overflow-hidden">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        disabled={isHistoryLoading}
                        onClick={() => setRange(r.value)}
                        className={`px-5 py-2.5 text-[10px] font-bold tracking-widest transition-all border-r border-white/10 last:border-0 uppercase ${currentRange === r.value ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-medium text-white/40 tracking-[0.2em] uppercase">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                    Real-time Protocol Active
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 10 }}
                        minTickGap={60}
                        dy={15}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#FFFFFF', fontSize: 10 }}
                        tickFormatter={(val) => val.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: val < 1 ? 6 : 2 
                        })}
                        width={90}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black border border-white/20 p-5 rounded-2xl shadow-2xl backdrop-blur-xl">
                                <p className="text-white/40 text-[10px] font-medium uppercase tracking-[0.1em] mb-2">
                                  {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                                </p>
                                <p className="text-white text-2xl font-light tracking-tighter tabular-nums">
                                  ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                </p>
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
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Table Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-2">
                <StatRow label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                <StatRow label="Fully Diluted Val." value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
                <StatRow label="Volume (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
                <StatRow label="Circulating Supply" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
                <StatRow label="Day's Range" value={`$${selectedAsset?.low_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})} - $${selectedAsset?.high_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})}`} />
                <StatRow label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label="All-time High" value={`$${selectedAsset?.ath?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} />
                <StatRow label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="All-time Low" value={`$${selectedAsset?.atl?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} />
                <StatRow label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
              </div>

              {/* AI Analysis Section */}
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10">
                <div className="flex items-center gap-3 mb-6 text-white/60 font-medium tracking-[0.2em] text-[10px] uppercase">
                  <Sparkles size={16} className="text-white" />
                  <span>Terminal AI Logic</span>
                </div>
                <p className="text-white text-2xl font-light leading-snug tracking-tight">
                  {selectedAsset?.name} is establishing a base at ${selectedAsset?.current_price?.toLocaleString(undefined, {maximumFractionDigits: 6})}. 
                  The intraday volatility shows a {selectedAsset?.price_change_percentage_24h >= 0 ? 'bullish' : 'bearish'} bias of {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%. 
                  Volume metrics confirm significant participation at the current level.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE: Trending Tickers (Yahoo Style) */}
            <div className="xl:col-span-4 flex flex-col gap-12">
              
              {/* Trending Tickers Widget */}
              <div>
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-8 flex items-center gap-2">
                  <Activity size={16} /> Trending Tickers
                </h3>
                <div className="bg-[#080808] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="p-4 text-[10px] font-bold text-white/40 uppercase tracking-widest">Symbol</th>
                        <th className="p-4 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Price</th>
                        <th className="p-4 text-[10px] font-bold text-white/40 uppercase tracking-widest text-right">Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets.slice(0, 10).map((asset) => (
                        <tr 
                          key={asset.id} 
                          onClick={() => setSelectedAsset(asset.id)}
                          className={`border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}
                        >
                          <td className="p-4">
                            <div className="font-bold text-sm text-white tracking-tight">{asset.symbol.toUpperCase()}</div>
                            <div className="text-[10px] text-white/40 font-medium truncate max-w-[100px]">{asset.name}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-sm font-medium text-white tabular-nums">${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className={`inline-block px-2 py-1 rounded text-[10px] font-bold tabular-nums ${asset.price_change_percentage_24h >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                              {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* All Assets Ranking (Scrollable) */}
              <div className="flex flex-col gap-4">
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-4 px-2">Market Ranking (Top 50)</h3>
                <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar border border-white/10 rounded-2xl bg-[#080808]/50">
                  {assets.map((asset) => (
                    <div 
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset.id)}
                      className={`p-5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-all ${selectedAssetId === asset.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <img src={asset.image} alt="" className="w-6 h-6 object-contain" />
                        <div>
                          <div className={`font-bold text-sm ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name}</div>
                          <div className={`text-[10px] uppercase font-medium ${selectedAssetId === asset.id ? 'text-black/60' : 'text-white/40'}`}>{asset.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium text-sm tabular-nums ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}</div>
                        <div className={`text-[10px] font-bold ${selectedAssetId === asset.id ? 'text-black/70' : (asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500')}`}>
                          {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                        </div>
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
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-sm font-bold tracking-tight whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-white/10 last:border-0">
      <span className="text-white text-sm font-medium tracking-tight uppercase tracking-widest text-[10px] opacity-60">{label}</span>
      <span className="text-white text-base font-normal tabular-nums">{value}</span>
    </div>
  );
}
