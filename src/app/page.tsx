'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Bar, LineChart, Line, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles, LayoutDashboard, Wallet, Settings, Menu, RefreshCw, ShieldCheck, DatabaseZap, ChartArea, ChartLine, ChartCandlestick, ChartBar } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { exportToCSV } from '@/lib/utils';
import { format, startOfDay, addHours, addDays, startOfMonth, addMonths, startOfYear, addYears } from 'date-fns';

export default function Dashboard() {
  const { 
    assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, 
    history, setRange, currentRange, isHistoryLoading, error: storeError, historyError,
    chartType, setChartType
  } = useFinanceStore();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [hoverData, setHoverData] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchAssets();
    const interval = setInterval(() => fetchAssets(), 60000);
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets?.find(a => a.id === selectedAssetId) || assets?.[0],
  [assets, selectedAssetId]);

  const chartColor = useMemo(() => {
    if (!history || history.length < 2) return '#a78bfa';
    const first = history[0].close;
    const last = history[history.length - 1].close;
    return last >= first ? '#22c55e' : '#ef4444';
  }, [history]);

  const yDomain = useMemo(() => {
    if (!history || history.length === 0) return ['auto', 'auto'];
    const highs = history.map(h => h.high);
    const lows = history.map(h => h.low);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.15 || (min * 0.05);
    return [min - padding, max + padding];
  }, [history]);

  const xTicks = useMemo(() => {
    if (!history || history.length === 0) return [];
    const ticks = [];
    const first = history[0].time;
    const last = history[history.length - 1].time;

    if (currentRange === '1') {
      for (let t = startOfDay(first).getTime(); t <= last; t = addHours(t, 2).getTime()) {
        if (t >= first) ticks.push(t);
      }
    } else if (currentRange === '5') {
      for (let t = startOfDay(first).getTime(); t <= last; t = addHours(t, 12).getTime()) {
        if (t >= first) ticks.push(t);
      }
    } else if (currentRange === '30') {
      for (let t = startOfDay(first).getTime(); t <= last; t = addDays(t, 5).getTime()) {
        if (t >= first) ticks.push(t);
      }
    }
    return ticks.length > 0 ? ticks : undefined;
  }, [history, currentRange]);

  const handleMouseMove = (e: any) => {
    if (e.activePayload && e.activePayload.length > 0) {
      setHoverData(e.activePayload[0].payload);
      setMousePos({ x: e.chartX, y: e.chartY });
    }
  };

  if (!isMounted || loading) return (
    <div className="flex items-center justify-center h-screen bg-[#130b29]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-white rounded-full animate-spin"></div>
        <p className="text-violet-200 text-sm tracking-[0.5em] font-bold uppercase animate-pulse">Connecting Nexus...</p>
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

  const chartModes = [
    { id: 'mountain', label: 'Mountain', icon: <ChartArea size={14} /> },
    { id: 'line', label: 'Line', icon: <ChartLine size={14} /> },
    { id: 'candle', label: 'Candle', icon: <ChartCandlestick size={14} /> },
    { id: 'bar', label: 'Bar', icon: <ChartBar size={14} /> },
  ];

  return (
    <div className="flex h-screen bg-[#130b29] text-white font-sans antialiased overflow-hidden selection:bg-violet-500/30">
      
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e0c3a,transparent)] pointer-events-none" />

      {/* SIDEBAR */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 260 : 80 }}
        className="h-full border-r border-white/5 bg-[#0e071f]/95 backdrop-blur-3xl flex flex-col py-8 px-4 z-50 relative hidden lg:flex"
      >
        <div className="flex items-center gap-4 mb-16 px-2">
          <div className="w-12 h-12 bg-violet-600 text-white flex items-center justify-center font-black text-2xl rounded-2xl">N</div>
          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-white font-bold text-2xl tracking-tighter">NEXUS</motion.span>
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
        <div className="p-8 lg:p-12 max-w-[1700px] mx-auto pb-32">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-5">
                  <h1 className="text-5xl font-normal text-white tracking-tight leading-none">{selectedAsset?.name || 'Syncing Stream'}</h1>
                  <span className="text-2xl text-violet-400/40 font-bold uppercase tracking-widest">{selectedAsset?.symbol || '...'}</span>
                  <a href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} target="_blank" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-violet-400 hover:bg-white/10 transition-all">
                    <ExternalLink size={20} />
                  </a>
                </div>
                <div className="flex items-center gap-8 mt-4">
                  <span className="text-5xl font-normal text-white tabular-nums tracking-tighter">
                    ${(selectedAsset?.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <div className={`flex items-center gap-2 text-xl font-medium px-4 py-1 rounded-xl ${(selectedAsset?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {(selectedAsset?.price_change_percentage_24h || 0) >= 0 ? <ArrowUp size={24} /> : <ArrowDown size={24} />}
                    {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            <ConnectButton />
          </header>

          {storeError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-3xl mb-12 flex justify-between items-center backdrop-blur-xl">
              <div className="flex items-center gap-4 text-lg font-medium">
                <Info size={24} />
                <span>{storeError}</span>
              </div>
              <button onClick={() => fetchAssets()} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2">
                <RefreshCw size={18} /> Re-establish Feed
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 flex flex-col gap-12">
              
              {/* TERMINAL DASHBOARD */}
              <div className="bg-black/40 border border-white/10 rounded-[3.5rem] p-10 min-h-[600px] flex flex-col relative overflow-visible shadow-2xl backdrop-blur-md">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#130b29]/80 backdrop-blur-xl z-30 flex items-center justify-center flex-col gap-6 rounded-[3.5rem]">
                    <RefreshCw className="animate-spin text-violet-500" size={40} />
                    <p className="text-violet-200 text-xs font-black tracking-[0.4em] uppercase animate-pulse">Syncing Precision Feed</p>
                  </div>
                )}

                {!isHistoryLoading && historyError && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center flex-col gap-4">
                    <DatabaseZap size={32} className="text-white/20" />
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm">volume not available</p>
                  </div>
                )}
                
                {/* TOOLBAR: RANGES + MODES */}
                <div className="flex flex-col xl:flex-row justify-between items-center mb-10 z-10 px-2 gap-6">
                  <div className="flex gap-4">
                    <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      {ranges.map((r) => (
                        <button key={r.label} onClick={() => setRange(r.value)} className={`px-5 py-2 text-[10px] font-bold tracking-widest transition-all border-r border-white/10 last:border-0 uppercase ${currentRange === r.value ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      {chartModes.map((m) => (
                        <button key={m.id} onClick={() => setChartType(m.id as any)} className={`px-4 py-2 text-[10px] font-bold transition-all border-r border-white/10 last:border-0 flex items-center gap-2 ${chartType === m.id ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white'}`}>
                          {m.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span>Institutional Feed v5</span>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[450px] cursor-crosshair relative">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'candle' || chartType === 'bar' ? (
                      <BarChart data={history} margin={{ top: 20, right: 10, left: 10, bottom: 60 }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                         <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} ticks={xTicks} tickFormatter={(t) => format(new Date(t), 'HH:mm')} axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.5 }} dy={30} />
                         <YAxis domain={yDomain} orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.5 }} tickFormatter={(val) => val.toLocaleString()} width={90} />
                         <Tooltip isAnimationActive={false} cursor={{fill: 'transparent'}} content={() => null} />
                         <Bar dataKey="close" barSize={currentRange === '1' ? 2 : 5}>
                            {history.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'} />
                            ))}
                         </Bar>
                      </BarChart>
                    ) : (
                      <AreaChart data={history} margin={{ top: 20, right: 10, left: 10, bottom: 60 }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartColor} stopOpacity={chartType === 'line' ? 0 : 0.2}/>
                            <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} ticks={xTicks} tickFormatter={(t) => format(new Date(t), 'HH:mm')} axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.5 }} dy={30} />
                        <YAxis domain={yDomain} orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.5 }} tickFormatter={(val) => val.toLocaleString()} width={90} />
                        <Tooltip isAnimationActive={false} cursor={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} content={() => null} />
                        {hoverData && <ReferenceLine y={hoverData.close} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />}
                        <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" animationDuration={0} activeDot={{ r: 6, fill: '#FFF', stroke: chartColor, strokeWidth: 2 }} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>

                  <AnimatePresence>
                    {hoverData && (
                      <>
                        <div className="absolute right-0 bg-[#000000] text-white px-3 py-1.5 rounded-l font-bold text-[10px] z-40 tabular-nums border border-white/10" style={{ top: mousePos.y - 12 }}>
                          ${(hoverData.close || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </div>
                        <div className="absolute bottom-[20px] bg-[#000000] text-white px-4 py-2 rounded font-bold text-[10px] z-40 whitespace-nowrap border border-white/10" style={{ left: mousePos.x - 60 }}>
                          {format(new Date(hoverData.time), 'MMM dd, yyyy • HH:mm')}
                        </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* TECHNICAL DATA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-1">
                <StatRow label="Market Cap" value={`$${((selectedAsset?.market_cap || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label="Circulating Supply" value={`${((selectedAsset?.circulating_supply || 0) / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase() || ''}`} />
                <StatRow label="Volume (24h)" value={`$${((selectedAsset?.total_volume || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label="Day's Range" value={`$${(selectedAsset?.low_24h || 0).toLocaleString()} - $${(selectedAsset?.high_24h || 0).toLocaleString()}`} />
                <StatRow label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="All-time High" value={`$${(selectedAsset?.ath || 0).toLocaleString()}`} />
                <StatRow label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label="All-time Low" value={`$${(selectedAsset?.atl || 0).toLocaleString()}`} />
                <StatRow label="Fully Diluted Val." value={`$${((selectedAsset?.fully_diluted_valuation || 0) / 1e9).toFixed(3)}B`} />
              </div>
            </div>

            <div className="xl:col-span-4 flex flex-col gap-12">
              <div>
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-8 flex items-center gap-2 opacity-40">
                  <Activity size={16} /> Market Intensity
                </h3>
                <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="p-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Ticker</th>
                        <th className="p-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] text-right">Last</th>
                        <th className="p-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] text-right">Shift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets?.slice(0, 15).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-violet-500/10 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-6">
                            <div className="font-bold text-sm text-white tracking-tighter">{asset.symbol?.toUpperCase() || ''}</div>
                            <div className="text-[10px] text-white/30 truncate max-w-[100px]">{asset.name || ''}</div>
                          </td>
                          <td className="p-6 text-right font-normal text-sm tabular-nums">${(asset.current_price || 0) < 1 ? (asset.current_price || 0).toFixed(4) : (asset.current_price || 0).toLocaleString()}</td>
                          <td className="p-6 text-right">
                            <div className={`inline-block font-bold text-[10px] px-2 py-1 rounded ${(asset.price_change_percentage_24h || 0) >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{(asset.price_change_percentage_24h || 0) >= 0 ? '+' : ''}{(asset.price_change_percentage_24h || 0).toFixed(2)}%</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                <h3 className="text-white text-[11px] font-bold tracking-[0.3em] uppercase mb-4 px-4 opacity-40 text-center">Market Liquidity (Top 50)</h3>
                <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar border border-white/5 rounded-[2.5rem] bg-black/20">
                  {assets?.map((asset) => (
                    <div key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`p-6 cursor-pointer flex justify-between items-center border-b border-white/[0.03] last:border-0 transition-all ${selectedAssetId === asset.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}>
                      <div className="flex items-center gap-5">
                        <img src={asset.image} alt="" className="w-8 h-8 object-contain" />
                        <div className={`font-bold text-base tracking-tighter ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name || ''}</div>
                      </div>
                      <div className={`text-sm font-normal tabular-nums ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>${(asset.current_price || 0) < 1 ? (asset.current_price || 0).toFixed(4) : (asset.current_price || 0).toLocaleString()}</div>
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
