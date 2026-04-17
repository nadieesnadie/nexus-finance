'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Bar, LineChart, Line, Cell, ComposedChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles, LayoutDashboard, Wallet, Settings, Menu, RefreshCw, ShieldCheck, DatabaseZap, ChartArea, ChartLine, ChartCandlestick, ChartBar, Globe } from 'lucide-react';
import { exportToCSV } from '@/lib/utils';
import { format, startOfDay, addHours, addDays, startOfMonth, addMonths, startOfYear, addYears } from 'date-fns';

const translations = {
  en: {
    terminal: 'TERMINAL',
    syncing: 'STREAMS SYNCING...',
    feed_error: 'INSTITUTIONAL FEED ERROR',
    feed_msg: 'The primary market data stream is temporarily unavailable.',
    reset_conn: 'RESET CONNECTION',
    audit: 'AUDIT CSV',
    about: 'ABOUT',
    ranking: 'global market cap',
    milestone: 'historical milestone',
    intensity: 'Current intraday intensity shows a performance delta of',
    participation: 'with high institutional participation.',
    market_intensity: 'MARKET INTENSITY',
    liquidity: 'MARKET LIQUIDITY (TOP 50)',
    powered: 'POWERED BY',
    stats: {
      mcap: 'MARKET CAP',
      supply: 'AVAILABLE SUPPLY',
      vol: 'VOLUME (24H)',
      total_supply: 'TOTAL PROTOCOL SUPPLY',
      range: 'INTRADAY RANGE',
      ath: 'MARKET HIGH (ATH)',
      genesis: 'PROTOCOL GENESIS',
      fdv: 'FULLY DILUTED VAL.'
    }
  },
  es: {
    terminal: 'TERMINAL',
    syncing: 'SINCRONIZANDO...',
    feed_error: 'ERROR DE FEED INSTITUCIONAL',
    feed_msg: 'El flujo de datos de mercado principal no está disponible temporalmente.',
    reset_conn: 'REINICIAR CONEXIÓN',
    audit: 'AUDITAR CSV',
    about: 'SOBRE',
    ranking: 'capitalización de mercado global',
    milestone: 'hito histórico',
    intensity: 'La intensidad intradía actual muestra un delta de rendimiento de',
    participation: 'con alta participación institucional.',
    market_intensity: 'INTENSIDAD DE MERCADO',
    liquidity: 'LIQUIDEZ DE MERCADO (TOP 50)',
    powered: 'POTENCIADO POR',
    stats: {
      mcap: 'CAP. DE MERCADO',
      supply: 'SUMINISTRO DISPONIBLE',
      vol: 'VOLUMEN (24H)',
      total_supply: 'SUMINISTRO TOTAL',
      range: 'RANGO INTRADÍA',
      ath: 'MÁXIMO HISTÓRICO (ATH)',
      genesis: 'GÉNESIS DEL PROTOCOLO',
      fdv: 'VALUACIÓN DILUIDA'
    }
  }
};

export default function Dashboard() {
  const { 
    assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, 
    history, setRange, currentRange, isHistoryLoading, error: storeError, historyError,
    chartType, setChartType, language, setLanguage
  } = useFinanceStore();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [hoverData, setHoverData] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const t = translations[language];

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

  const baselineValue = useMemo(() => {
    if (!history || history.length === 0) return 0;
    return history[0].close;
  }, [history]);

  const yDomainInfo = useMemo(() => {
    if (!history || history.length === 0) return { min: 0, max: 0, off: 0 };
    const highs = history.map(h => h.high);
    const lows = history.map(h => h.low);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.15 || (min * 0.02);
    const dMin = min - padding;
    const dMax = max + padding;
    const off = dMax === dMin ? 0 : (dMax - baselineValue) / (dMax - dMin);
    return { min: dMin, max: dMax, off: off * 100 };
  }, [history, baselineValue]);

  const xTicks = useMemo(() => {
    if (!history || history.length === 0) return [];
    const ticks = [];
    const first = history[0].time;
    const last = history[history.length - 1].time;
    if (currentRange === '1') {
      for (let t = startOfDay(first).getTime(); t <= last; t = addHours(t, 2).getTime()) { if (t >= first) ticks.push(t); }
    } else if (currentRange === '5') {
      for (let t = startOfDay(first).getTime(); t <= last; t = addHours(t, 12).getTime()) { if (t >= first) ticks.push(t); }
    } else if (currentRange === '30') {
      for (let t = startOfDay(first).getTime(); t <= last; t = addDays(t, 5).getTime()) { if (t >= first) ticks.push(t); }
    } else {
       for (let t = startOfMonth(first).getTime(); t <= last; t = addMonths(t, 2).getTime()) { if (t >= first) ticks.push(t); }
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
    <div className="flex items-center justify-center h-screen bg-[#0a0518]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-white rounded-full animate-spin"></div>
        <p className="text-violet-200 text-lg font-black uppercase tracking-[0.5em] animate-pulse">CONNECTING NEXUS</p>
      </div>
    </div>
  );

  if (!assets || assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0518]">
      <div className="flex flex-col items-center gap-6 p-12 bg-white/5 border border-white/10 rounded-[3rem] max-w-lg text-center backdrop-blur-xl">
        <DatabaseZap size={64} className="text-red-500" />
        <h2 className="text-white text-3xl font-black tracking-tight uppercase">{t.feed_error}</h2>
        <p className="text-white/60 text-lg leading-relaxed">{t.feed_msg}</p>
        <button onClick={() => { window.location.reload(); }} className="mt-8 px-10 py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]">{t.reset_conn}</button>
      </div>
    </div>
  );

  const ranges = [
    { label: '1D', value: '1' }, { label: '5D', value: '5' }, { label: '1M', value: '30' }, { label: '6M', value: '180' }, { label: 'YTD', value: 'ytd' }, { label: '1Y', value: '365' }, { label: '5Y', value: '1825' }, { label: 'ALL', value: 'max' },
  ];

  const chartModes = [
    { id: 'mountain', label: 'Mountain', icon: <ChartArea size={16} /> },
    { id: 'line', label: 'Line', icon: <ChartLine size={16} /> },
    { id: 'baseline', label: 'Base', icon: <Activity size={16} /> },
    { id: 'candle', label: 'Candle', icon: <ChartCandlestick size={16} /> },
    { id: 'bar', label: 'Bar', icon: <ChartBar size={16} /> },
  ];

  return (
    <div className="flex h-screen bg-[#0a0518] text-white font-sans antialiased overflow-hidden selection:bg-violet-500/30">
      
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e0c3a,transparent)] pointer-events-none" />

      {/* SIDEBAR: COLLAPSIBLE */}
      <motion.aside 
        onHoverStart={() => setIsSidebarExpanded(true)}
        onHoverEnd={() => setIsSidebarExpanded(false)}
        animate={{ width: isSidebarExpanded ? 240 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-full border-r border-white/5 bg-[#0a0518]/95 backdrop-blur-3xl flex flex-col py-8 px-4 z-50 relative hidden lg:flex"
      >
        <div className="flex items-center gap-3 mb-16 px-2 overflow-hidden">
          <div className="w-12 h-12 bg-white text-black flex items-center justify-center font-black text-2xl rounded shadow-[0_0_20px_rgba(255,255,255,0.2)] shrink-0">N</div>
          <AnimatePresence mode="wait">
            {isSidebarExpanded && (
              <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-white font-black text-2xl tracking-tighter uppercase whitespace-nowrap">EXUS</motion.span>
            )}
          </AnimatePresence>
        </div>
        <nav className="flex flex-col gap-4 w-full px-2">
          <SidebarItem icon={<LayoutDashboard size={28} />} label={t.terminal} active expanded={isSidebarExpanded} />
        </nav>
      </motion.aside>

      {/* MAIN VIEW */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="p-8 lg:p-14 max-w-[1800px] mx-auto pb-32">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-14">
            <div className="flex items-center gap-10">
              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2rem] p-5 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-6">
                  <h1 className="text-7xl font-normal text-white tracking-tighter leading-none">{selectedAsset?.name || t.syncing}</h1>
                  <span className="text-3xl text-white/40 font-light uppercase tracking-widest">{selectedAsset?.symbol}</span>
                  <a href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} target="_blank" className="text-white/20 hover:text-violet-400 transition-all">
                    <ExternalLink size={24} />
                  </a>
                </div>
                <div className="flex items-center gap-10 mt-4">
                  <span className="text-6xl font-normal text-white tabular-nums tracking-tighter">
                    ${(selectedAsset?.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <div className={`flex items-center gap-2 text-3xl font-medium px-4 py-1 rounded-2xl ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? <ArrowUp size={28} /> : <ArrowDown size={28} />}
                    {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-2xl">
                <button onClick={() => exportToCSV(assets, 'nexus-audit')} className="px-6 py-3 text-white/80 hover:text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5 rounded-xl">{t.audit}</button>
                <div className="w-px h-6 bg-white/10" />
                <button 
                  onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} 
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-violet-500 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.4)]"
                >
                  <Globe size={16} />
                  {language.toUpperCase()}
                </button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 flex flex-col gap-12">
              
              <div className="bg-black/20 border border-white/10 rounded-[3rem] p-10 min-h-[600px] flex flex-col relative overflow-visible shadow-2xl backdrop-blur-md">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0a0518]/90 backdrop-blur-xl z-30 flex items-center justify-center flex-col gap-6 rounded-[3rem]">
                    <RefreshCw className="animate-spin text-violet-500" size={48} />
                    <p className="text-violet-200 text-sm font-black tracking-[0.5em] uppercase animate-pulse">{t.syncing}</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 z-10 gap-8">
                  <div className="flex gap-4">
                    <div className="flex bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                      {ranges.map((r) => (
                        <button key={r.label} onClick={() => setRange(r.value)} className={`px-6 py-3 text-[10px] font-black tracking-widest transition-all border-r border-white/10 last:border-0 uppercase ${currentRange === r.value ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}>
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                      {chartModes.map((m) => (
                        <button key={m.id} onClick={() => setChartType(m.id as any)} className={`px-5 py-3 text-xs font-black transition-all border-r border-white/10 last:border-0 ${chartType === m.id ? 'bg-violet-600 text-white shadow-[0_0_20px_#8b5cf6]' : 'text-white/40 hover:text-white'}`}>
                          {m.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 shadow-2xl">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                    Institutional Feed
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[450px] cursor-crosshair relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={history} margin={{ top: 20, right: 10, left: 10, bottom: 60 }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={chartType === 'line' ? 0 : 0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4}/>
                          <stop offset={`${yDomainInfo.off}%`} stopColor="#22c55e" stopOpacity={0.1}/>
                          <stop offset={`${yDomainInfo.off}%`} stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4}/>
                        </linearGradient>
                        <linearGradient id="strokeBaseline" x1="0" y1="0" x2="0" y2="1">
                          <stop offset={`${yDomainInfo.off}%`} stopColor="#22c55e" stopOpacity={1}/>
                          <stop offset={`${yDomainInfo.off}%`} stopColor="#ef4444" stopOpacity={1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" vertical={true} horizontal={true} stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} ticks={xTicks} tickFormatter={(t) => format(new Date(t), 'HH:mm')} axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 13, opacity: 0.4, fontWeight: 700 }} dy={30} />
                      <YAxis domain={[yDomainInfo.min, yDomainInfo.max]} orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 13, opacity: 0.4, fontWeight: 700 }} tickFormatter={(val) => val.toLocaleString()} width={100} />
                      <Tooltip isAnimationActive={false} cursor={{ stroke: 'rgba(255,255,255,0.3)', strokeWidth: 1.5, strokeDasharray: '4 4' }} content={() => null} />
                      {(chartType === 'baseline' || hoverData) && ( <ReferenceLine y={hoverData ? hoverData.close : baselineValue} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" /> )}
                      {chartType === 'mountain' && <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" animationDuration={0} activeDot={{ r: 6, fill: '#FFF' }} />}
                      {chartType === 'line' && <Line type="monotone" dataKey="close" stroke={chartColor} strokeWidth={3} dot={false} animationDuration={0} activeDot={{ r: 6, fill: '#FFF' }} />}
                      {chartType === 'baseline' && <Area type="monotone" dataKey="close" stroke="url(#strokeBaseline)" strokeWidth={3} fill="url(#colorBaseline)" animationDuration={0} baseValue={baselineValue} />}
                      {chartType === 'candle' && <Bar dataKey="close" barSize={6}>{history.map((e, i) => <Cell key={i} fill={e.close >= e.open ? '#22c55e' : '#ef4444'} />)}</Bar>}
                      {chartType === 'bar' && <Bar dataKey="close" barSize={3}>{history.map((e, i) => <Cell key={i} fill={chartColor} />)}</Bar>}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <AnimatePresence>
                    {hoverData && (
                      <>
                        <div className="absolute right-0 bg-white text-black px-3 py-1.5 rounded-l font-black text-xs z-40 tabular-nums shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ top: mousePos.y - 12 }}> ${hoverData.close.toLocaleString(undefined, { maximumFractionDigits: 4 })} </div>
                        <div className="absolute bottom-[20px] bg-white text-black px-4 py-2 rounded font-black text-xs z-40 whitespace-nowrap shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ left: mousePos.x - 60 }}> {format(new Date(hoverData.time), 'HH:mm:ss')} </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                {/* POWERED BY: URL ATTACHED */}
                <div className="flex justify-end mt-6">
                  <a 
                    href={currentRange === '1' || currentRange === '5' ? "https://www.binance.com" : "https://www.coingecko.com"} 
                    target="_blank"
                    className="flex items-center gap-2 text-[10px] font-black text-white hover:text-violet-400 transition-all uppercase tracking-[0.4em] opacity-30 hover:opacity-100"
                  >
                    {t.powered} {currentRange === '1' || currentRange === '5' ? 'Binance Institutional API' : 'CoinGecko Global Feed'}
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* TECHNICAL DATA: LARGER TEXT */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-2">
                <StatRow label={t.stats.mcap} value={`$${((selectedAsset?.market_cap || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label={t.stats.supply} value={`${((selectedAsset?.circulating_supply || 0) / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase() || ''}`} />
                <StatRow label={t.stats.vol} value={`$${((selectedAsset?.total_volume || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label={t.stats.total_supply} value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label={t.stats.range} value={`$${(selectedAsset?.low_24h || 0).toLocaleString()} - $${(selectedAsset?.high_24h || 0).toLocaleString()}`} />
                <StatRow label={t.stats.ath} value={`$${(selectedAsset?.ath || 0).toLocaleString()}`} />
                <StatRow label={t.stats.genesis} value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label={t.stats.fdv} value={`$${((selectedAsset?.fully_diluted_valuation || 0) / 1e9).toFixed(3)}B`} />
              </div>

              {/* ASSET DESCRIPTION: BOLDER */}
              <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 mt-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-violet-500/5 group-hover:text-violet-500/10 transition-colors">
                  <Sparkles size={200} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8 text-violet-400 font-black tracking-[0.5em] text-[11px] uppercase">
                    <Sparkles size={20} /> <span>NEXUS AI INSIGHT</span>
                  </div>
                  <h3 className="text-4xl font-normal mb-6 text-white tracking-tight">{t.about} {selectedAsset?.name}</h3>
                  <p className="text-white/90 text-2xl font-light leading-relaxed tracking-tight">
                    {selectedAsset?.name} ({selectedAsset?.symbol?.toUpperCase()}) is a decentralized digital asset currently positioned at #{assets?.indexOf(selectedAsset) + 1} in {t.ranking}. 
                    With a {t.milestone} of <span className="text-white font-normal">${selectedAsset?.ath?.toLocaleString()}</span> achieved on {selectedAsset?.ath_date ? format(new Date(selectedAsset.ath_date), 'MMM dd, yyyy') : 'recorded history'}, 
                    the asset remains a fundamental pillar of the digital finance ecosystem. {t.intensity} <span className="text-white font-normal">{selectedAsset?.price_change_percentage_24h?.toFixed(2)}%</span> {t.participation}
                  </p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 flex flex-col gap-12">
              <div>
                <h3 className="text-white text-[11px] font-black tracking-[0.5em] uppercase mb-10 flex items-center gap-3 opacity-30">
                  <Activity size={18} className="text-violet-500" /> {t.market_intensity}
                </h3>
                <div className="bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03]">
                        <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-widest">Symbol</th>
                        <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Last</th>
                        <th className="p-6 text-[10px] font-black text-white/30 uppercase tracking-widest text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets?.slice(0, 15).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.02] last:border-0 hover:bg-violet-600/10 cursor-pointer transition-all ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-6">
                            <div className="font-bold text-lg text-white uppercase tracking-tighter">{asset.symbol}</div>
                            <div className="text-[11px] text-white/30 truncate max-w-[120px] font-medium">{asset.name}</div>
                          </td>
                          <td className="p-6 text-right font-normal text-lg tabular-nums text-white">${(asset.current_price || 0).toLocaleString()}</td>
                          <td className="p-6 text-right">
                            <div className={`inline-block font-black text-xs px-3 py-1.5 rounded-xl tabular-nums ${asset.price_change_percentage_24h >= 0 ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'}`}>
                              {asset.price_change_percentage_24h >= 0 ? '+' : ''}{(asset.price_change_percentage_24h || 0).toFixed(2)}%
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
    <div className={`flex items-center gap-5 p-5 rounded-2xl cursor-pointer transition-all ${active ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'text-white/30 hover:text-white hover:bg-white/5'}`}>
      <div className="shrink-0">{icon}</div>
      <AnimatePresence mode="wait">
        {expanded && (
          <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-lg font-black tracking-tight uppercase whitespace-nowrap">{label}</motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-6 border-b border-white/5 last:border-0">
      <span className="text-white text-[12px] font-black uppercase tracking-[0.3em] opacity-30">{label}</span>
      <span className="text-white text-2xl font-normal tabular-nums tracking-tighter">{value}</span>
    </div>
  );
}

function ConnectButtonReplacer() {
   return <div className="bg-violet-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(139,92,246,0.3)]">Nexus Terminal Active</div>;
}
