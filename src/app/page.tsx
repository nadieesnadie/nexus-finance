'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, BarChart, Bar, LineChart, Line, Cell, ComposedChart
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles, LayoutDashboard, Wallet, Settings, Menu, RefreshCw, ShieldCheck, DatabaseZap, ChartArea, ChartLine, ChartCandlestick, ChartBar, Globe, X } from 'lucide-react';
import { exportToCSV } from '@/lib/utils';
import { format, startOfDay, addHours, addDays, startOfMonth, addMonths, startOfYear, addYears } from 'date-fns';

const translations = {
  en: {
    terminal: 'Terminal', syncing: 'Syncing...', feed_error: 'Feed Error', feed_msg: 'Market data stream unavailable.', reset_conn: 'Reset', audit: 'Audit CSV', about: 'About', ranking: 'global market cap', milestone: 'historical milestone', intensity: 'Current intraday intensity shows a performance delta of', participation: 'with high institutional participation.', market_intensity: 'Market Intensity', liquidity: 'Liquidity', powered: 'Powered by',
    stats: { mcap: 'Market Cap', supply: 'Circ. Supply', vol: 'Vol (24h)', total_supply: 'Total Supply', range: 'Range', ath: 'ATH', genesis: 'Genesis', fdv: 'FDV' }
  },
  es: {
    terminal: 'Terminal', syncing: 'Sincronizando...', feed_error: 'Error de Feed', feed_msg: 'Flujo de datos no disponible.', reset_conn: 'Reiniciar', audit: 'Auditar CSV', about: 'Sobre', ranking: 'capitalización global', milestone: 'hito histórico', intensity: 'La intensidad intradía muestra un delta de', participation: 'con alta participación institucional.', market_intensity: 'Intensidad', liquidity: 'Liquidez', powered: 'Potenciado por',
    stats: { mcap: 'Cap. Mercado', supply: 'Suministro', vol: 'Vol (24h)', total_supply: 'Suministro Tot.', range: 'Rango', ath: 'Máx. Hist.', genesis: 'Génesis', fdv: 'Val. Diluida' }
  }
};

export default function Dashboard() {
  const { assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, history, setRange, currentRange, isHistoryLoading, error: storeError, historyError, chartType, setChartType, language, setLanguage } = useFinanceStore();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const selectedAsset = useMemo(() => assets?.find(a => a.id === selectedAssetId) || assets?.[0], [assets, selectedAssetId]);

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
    if (currentRange === '1') { for (let t = startOfDay(first).getTime(); t <= last; t = addHours(t, 2).getTime()) { if (t >= first) ticks.push(t); } }
    else if (currentRange === '5') { for (let t = startOfDay(first).getTime(); t <= last; t = addHours(t, 12).getTime()) { if (t >= first) ticks.push(t); } }
    else if (currentRange === '30') { for (let t = startOfDay(first).getTime(); t <= last; t = addDays(t, 5).getTime()) { if (t >= first) ticks.push(t); } }
    else { for (let t = startOfMonth(first).getTime(); t <= last; t = addMonths(t, 2).getTime()) { if (t >= first) ticks.push(t); } }
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
        <div className="w-12 h-12 border-4 border-violet-500 border-t-white rounded-full animate-spin"></div>
        <p className="text-white text-base font-bold uppercase animate-pulse">Syncing Nexus Terminal...</p>
      </div>
    </div>
  );

  if (!assets || assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-[#0a0518]">
      <div className="flex flex-col items-center gap-6 p-12 bg-white/5 border border-white/10 rounded-3xl max-w-lg text-center backdrop-blur-xl">
        <DatabaseZap size={48} className="text-red-500" />
        <h2 className="text-white text-2xl font-bold tracking-tight uppercase">{t.feed_error}</h2>
        <p className="text-white/60 text-sm leading-relaxed">{t.feed_msg}</p>
        <button onClick={() => { window.location.reload(); }} className="mt-4 px-8 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform">{t.reset_conn}</button>
      </div>
    </div>
  );

  const ranges = [ { label: '1D', value: '1' }, { label: '5D', value: '5' }, { label: '1M', value: '30' }, { label: '6M', value: '180' }, { label: 'YTD', value: 'ytd' }, { label: '1Y', value: '365' }, { label: '5Y', value: '1825' }, { label: 'ALL', value: 'max' } ];
  const chartModes = [ { id: 'mountain', icon: <ChartArea size={14} /> }, { id: 'line', icon: <ChartLine size={14} /> }, { id: 'baseline', icon: <Activity size={14} /> }, { id: 'candle', icon: <ChartCandlestick size={14} /> }, { id: 'bar', icon: <ChartBar size={14} /> } ];

  return (
    <div className="flex h-screen bg-[#0a0518] text-white font-sans antialiased overflow-hidden selection:bg-violet-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e0c3a,transparent)] pointer-events-none" />
      
      <motion.aside onHoverStart={() => setIsSidebarExpanded(true)} onHoverEnd={() => setIsSidebarExpanded(false)} animate={{ width: isSidebarExpanded ? 260 : 80 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="h-full border-r border-white/10 bg-[#0e071f]/95 backdrop-blur-3xl flex flex-col py-8 px-4 z-50 relative hidden lg:flex shrink-0">
        <div className="flex items-center gap-4 mb-16 px-2 overflow-hidden">
          <div className="w-12 h-12 bg-violet-600 text-white flex items-center justify-center font-black text-2xl rounded shadow-[0_0_20px_rgba(255,255,255,0.2)]">N</div>
          <AnimatePresence>{isSidebarExpanded && ( <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-white font-bold text-2xl tracking-tighter uppercase whitespace-nowrap">EXUS</motion.span> )}</AnimatePresence>
        </div>
        <nav className="flex flex-col gap-6 w-full px-2"><SidebarItem icon={<LayoutDashboard size={24} />} label={t.terminal} active expanded={isSidebarExpanded} /></nav>
      </motion.aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" />
            <motion.div key="drawer" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#0a0518] border-r border-white/10 z-[110] p-6 lg:hidden flex flex-col shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                <div className="text-2xl font-black tracking-tighter text-white uppercase italic">NEXUS</div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10"><X size={20} /></button>
              </div>
              <h3 className="text-violet-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 px-2">Market Stream</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {assets?.map((asset) => (
                  <div key={asset.id} onClick={() => { setSelectedAsset(asset.id); setIsMobileMenuOpen(false); }} className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${selectedAssetId === asset.id ? 'bg-white border-white text-black' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                    <img src={asset.image} alt="" className="w-8 h-8 object-contain" />
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate uppercase ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.symbol}</div>
                      <div className={`text-[10px] truncate ${selectedAssetId === asset.id ? 'text-black/60' : 'text-white/40'}`}>{asset.name}</div>
                    </div>
                    <div className="text-xs font-bold tabular-nums">${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="p-4 sm:p-8 lg:p-10 max-w-[1700px] mx-auto pb-32">
          
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
            <div className="flex items-center gap-4 sm:gap-8 w-full sm:w-auto">
              <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white mr-1 shrink-0 active:scale-95 transition-transform"><Menu size={24} /></button>
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white/5 border border-white/10 rounded-3xl p-3 flex items-center justify-center shadow-2xl backdrop-blur-xl shrink-0">{selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                  <h1 className="text-3xl sm:text-6xl font-normal text-white tracking-tight leading-none truncate">{selectedAsset?.name || t.syncing}</h1>
                  <span className="text-base sm:text-3xl text-white/40 font-light uppercase shrink-0">{selectedAsset?.symbol}</span>
                </div>
                <div className="flex items-center gap-4 sm:gap-10 mt-2 sm:mt-4">
                  <span className="text-3xl sm:text-6xl font-normal text-white tabular-nums tracking-tighter leading-none">${(selectedAsset?.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                  <div className={`flex items-center gap-1 sm:gap-2 text-lg sm:text-3xl font-medium px-2 sm:px-4 py-0.5 sm:py-1 rounded-xl ${(selectedAsset?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{(selectedAsset?.price_change_percentage_24h || 0) >= 0 ? <ArrowUp size={24} /> : <ArrowDown size={24} />}{Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%</div>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-auto flex justify-end">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 shadow-2xl">
                <button onClick={() => exportToCSV(assets, 'nexus-audit')} className="px-4 py-2.5 text-white/80 hover:text-white text-[10px] font-black uppercase transition-all hover:bg-white/5 rounded-xl">{t.audit}</button>
                <div className="w-px h-5 bg-white/10" />
                <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white text-[10px] font-black uppercase transition-all hover:bg-violet-500 rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"><Globe size={14} />{language.toUpperCase()}</button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 text-white">
            <div className="lg:col-span-9 flex flex-col gap-10 lg:gap-16"> 
              <div className="bg-black/30 border border-white/10 rounded-[2.5rem] sm:rounded-[4rem] p-4 sm:p-12 min-h-[500px] sm:min-h-[700px] flex flex-col relative overflow-visible shadow-2xl backdrop-blur-md">
                {isHistoryLoading && (<div className="absolute inset-0 bg-[#0a0518]/90 backdrop-blur-xl z-30 flex items-center justify-center flex-col gap-6 rounded-[2.5rem] sm:rounded-[4rem]"><RefreshCw className="animate-spin text-violet-500" size={48} /><p className="text-violet-200 text-sm font-black uppercase animate-pulse">{t.syncing}</p></div>)}
                {!isHistoryLoading && historyError && (<div className="absolute inset-0 z-20 flex items-center justify-center flex-col gap-4"><DatabaseZap size={48} className="text-white/20" /><p className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm text-center px-4">volume not available</p></div>)}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 z-10 gap-8">
                  <div className="flex flex-col xs:flex-row gap-6 sm:gap-16 items-center w-full sm:w-auto">
                    <div className="flex bg-black/40 rounded-xl overflow-x-auto no-scrollbar border border-white/10 w-full sm:w-auto shadow-inner">
                      {ranges.map((r) => (<button key={r.label} onClick={() => setRange(r.value)} className={`px-5 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black tracking-tighter transition-all border-r border-white/10 last:border-0 uppercase shrink-0 ${currentRange === r.value ? 'bg-white text-black shadow-2xl scale-[1.02]' : 'text-white/40 hover:text-white'}`}>{r.label}</button>))}
                    </div>
                    <div className="flex bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-inner shrink-0">
                      {chartModes.map((m) => (<button key={m.id} onClick={() => setChartType(m.id as any)} className={`px-4 sm:px-5 py-2.5 sm:py-3 text-[10px] font-bold transition-all border-r border-white/10 last:border-0 ${chartType === m.id ? 'bg-violet-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>{m.icon}</button>))}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-black text-green-400 uppercase tracking-widest bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 shadow-2xl"><span>Feed Active</span></div>
                </div>
                <div className="flex-1 w-full min-h-[350px] sm:min-h-[500px] cursor-crosshair relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 60 }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)}>
                      <defs>
                        <linearGradient id="strokeBaseline" x1="0" y1="0" x2="0" y2="1"><stop offset={`${yDomainInfo.off}%`} stopColor="#22c55e" stopOpacity={1}/><stop offset={`${yDomainInfo.off}%`} stopColor="#ef4444" stopOpacity={1}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" vertical={true} horizontal={true} stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} ticks={xTicks} tickFormatter={(t) => {
                          const date = new Date(t);
                          if (currentRange === '1' || currentRange === '5') return format(date, 'HH:mm');
                          if (currentRange === '30' || currentRange === '180') return format(date, 'MMM dd');
                          if (currentRange === '365' || currentRange === 'ytd') return format(date, 'MMM yyyy');
                          return format(date, 'yyyy');
                        }} axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 12, opacity: 0.4, fontWeight: 700 }} dy={25} />
                      <YAxis domain={[yDomainInfo.min, yDomainInfo.max]} orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 12, opacity: 0.4, fontWeight: 700 }} tickFormatter={(val) => val.toLocaleString()} width={90} />
                      <Tooltip isAnimationActive={false} cursor={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 2, strokeDasharray: '4 4' }} content={() => null} />
                      {(chartType === 'baseline' || hoverData) && ( <ReferenceLine y={hoverData ? hoverData.close : baselineValue} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 4" /> )}
                      {chartType === 'mountain' && <Area isAnimationActive={false} type="monotone" dataKey="close" stroke={chartColor} strokeWidth={3} fillOpacity={0.2} fill={chartColor} activeDot={{ r: 6, fill: '#FFF' }} />}
                      {chartType === 'line' && <Line isAnimationActive={false} type="monotone" dataKey="close" stroke={chartColor} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#FFF' }} />}
                      {chartType === 'baseline' && <Area isAnimationActive={false} type="monotone" dataKey="close" stroke="url(#strokeBaseline)" strokeWidth={3} fill="transparent" baseValue={baselineValue} />}
                      {chartType === 'candle' && <Bar isAnimationActive={false} dataKey="close" barSize={6}>{history.map((e, i) => <Cell key={i} fill={e.close >= e.open ? '#22c55e' : '#ef4444'} />)}</Bar>}
                      {chartType === 'bar' && <Bar isAnimationActive={false} dataKey="close" barSize={3}>{history.map((e, i) => <Cell key={i} fill={chartColor} />)}</Bar>}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <AnimatePresence>
                    {hoverData && (
                      <>
                        <div key="date-badge" className="absolute left-1/2 -translate-x-1/2 bottom-[10px] bg-white text-black px-8 py-3 rounded-full font-black text-xs sm:text-base z-[60] whitespace-nowrap shadow-[0_0_50px_rgba(255,255,255,0.6)] border border-white/10" style={{ left: mousePos.x }}>{format(new Date(hoverData.time), currentRange === '1' ? 'HH:mm:ss' : 'MMM dd, yyyy • HH:mm')}</div>
                        <div key="price-badge" className="absolute right-0 bg-white text-black px-4 py-2 rounded-l font-black text-xs sm:text-base z-[60] tabular-nums shadow-2xl border border-white/10" style={{ top: mousePos.y - 15 }}>${(hoverData.close || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-end mt-6"><a href={currentRange === '1' || currentRange === '5' ? "https://www.binance.com" : "https://www.coingecko.com"} target="_blank" className="flex items-center gap-2 text-[10px] font-black text-white hover:text-violet-400 transition-all uppercase tracking-widest opacity-30 hover:opacity-100">{t.powered} {currentRange === '1' || currentRange === '5' ? 'Binance API' : 'CoinGecko Feed'} <ExternalLink size={12} /></a></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10">
                <StatRow label={t.stats.mcap} value={`$${((selectedAsset?.market_cap || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label={t.stats.supply} value={`${((selectedAsset?.circulating_supply || 0) / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase() || ''}`} />
                <StatRow label={t.stats.vol} value={`$${((selectedAsset?.total_volume || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label={t.stats.total_supply} value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label={t.stats.range} value={`$${(selectedAsset?.low_24h || 0).toLocaleString()} - $${(selectedAsset?.high_24h || 0).toLocaleString()}`} />
                <StatRow label={t.stats.ath} value={`$${(selectedAsset?.ath || 0).toLocaleString()}`} />
                <StatRow label={t.stats.genesis} value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label={t.stats.fdv} value={`$${((selectedAsset?.fully_diluted_valuation || 0) / 1e9).toFixed(3)}B`} />
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-[3rem] p-8 sm:p-12 mt-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-violet-500/5 group-hover:text-violet-500/10 transition-colors hidden sm:block"><Sparkles size={200} /></div>
                <div className="relative z-10"><div className="flex items-center gap-3 mb-6 text-violet-300 font-bold text-xs uppercase"><Sparkles size={20} /><span>NEXUS AI INSIGHT</span></div><h3 className="text-3xl font-bold mb-6 text-white uppercase tracking-tight">{t.about} {selectedAsset?.name}</h3><p className="text-white/90 text-lg sm:text-2xl font-light leading-relaxed tracking-tight">{selectedAsset?.name} ({selectedAsset?.symbol?.toUpperCase()}) is a decentralized digital asset currently positioned at #{assets?.indexOf(selectedAsset) + 1} in {t.ranking}. With a {t.milestone} of ${selectedAsset?.ath?.toLocaleString()} achieved on {selectedAsset?.ath_date ? format(new Date(selectedAsset.ath_date), 'MMM dd, yyyy') : 'recorded history'}. {t.intensity} {selectedAsset?.price_change_percentage_24h?.toFixed(2)}% {t.participation}</p></div>
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-12">
              <div className="hidden lg:block">
                <h3 className="text-violet-300 text-sm font-black uppercase mb-10 flex items-center gap-3"><Activity size={20} /> {t.market_intensity}</h3>
                <div className="bg-black/30 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-white/10 bg-white/[0.03]"><th className="p-6 text-[10px] font-black text-white uppercase">Ticker</th><th className="p-6 text-[10px] font-black text-white uppercase text-right">Delta</th></tr></thead>
                    <tbody>
                      {assets?.slice(0, 15).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-violet-600/10 cursor-pointer transition-all ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-6"><div className="font-bold text-lg text-white uppercase tracking-tighter">{asset.symbol}</div><div className="text-[11px] text-white font-medium opacity-60">${asset.current_price.toLocaleString()}</div></td>
                          <td className="p-6 text-right"><div className={`inline-block font-black text-[11px] px-3 py-1.5 rounded-xl ${asset.price_change_percentage_24h >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{(asset.price_change_percentage_24h || 0).toFixed(2)}%</div></td>
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
    <div className={`flex items-center gap-6 p-5 rounded-2xl cursor-pointer transition-all ${active ? 'bg-white text-black shadow-2xl shadow-white/10 scale-[1.05]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
      <div className="shrink-0">{icon}</div>
      <AnimatePresence mode="wait">{expanded && ( <motion.span key="label-text" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-lg font-black tracking-tight uppercase whitespace-nowrap">{label}</motion.span> )}</AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-6 border-b border-white/5 last:border-0">
      <span className="text-white text-[13px] font-black uppercase tracking-tight opacity-100">{label}</span>
      <span className="text-white text-2xl font-normal tabular-nums tracking-tighter leading-none text-right">{value}</span>
    </div>
  );
}
