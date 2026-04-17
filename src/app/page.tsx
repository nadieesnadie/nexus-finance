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
    terminal: 'Terminal', syncing: 'Syncing...', feed_error: 'Feed Error', feed_msg: 'Market data stream unavailable.', reset_conn: 'Reset', audit: 'Audit CSV', about: 'About', ranking: 'global market cap', milestone: 'historical milestone', intensity: 'Current intraday intensity shows a performance delta of', participation: 'with high institutional participation.', market_intensity: 'Market Intensity', liquidity: 'Market Liquidity (Top 50)', powered: 'Powered by',
    stats: { mcap: 'Market Cap', supply: 'Circulating Supply', vol: 'Volume (24h)', total_supply: 'Total Supply', range: 'Day Range', ath: 'All-Time High', genesis: 'Genesis Date', fdv: 'Fully Diluted Val.' }
  },
  es: {
    terminal: 'Terminal', syncing: 'Sincronizando...', feed_error: 'Error de Feed', feed_msg: 'Flujo de datos no disponible.', reset_conn: 'Reiniciar', audit: 'Auditar CSV', about: 'Sobre', ranking: 'capitalización global', milestone: 'hito histórico', intensity: 'La intensidad intradía muestra un delta de', participation: 'con alta participación institucional.', market_intensity: 'Intensidad de Mercado', liquidity: 'Liquidez de Mercado (Top 50)', powered: 'Potenciado por',
    stats: { mcap: 'Cap. de Mercado', supply: 'Suministro Circ.', vol: 'Volumen (24h)', total_supply: 'Suministro Total', range: 'Rango del Día', ath: 'Máximo Histórico', genesis: 'Fecha Génesis', fdv: 'Valuación Diluida' }
  }
};

export default function Dashboard() {
  const { assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, history, setRange, currentRange, isHistoryLoading, error: storeError, historyError, chartType, setChartType, language, setLanguage } = useFinanceStore();
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
      <motion.aside onHoverStart={() => setIsSidebarExpanded(true)} onHoverEnd={() => setIsSidebarExpanded(false)} animate={{ width: isSidebarExpanded ? 260 : 80 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="h-full border-r border-white/10 bg-[#0e071f]/95 backdrop-blur-3xl flex flex-col py-8 px-4 z-50 relative hidden lg:flex">
        <div className="flex items-center gap-4 mb-16 px-2 overflow-hidden">
          <div className="w-12 h-12 bg-violet-600 text-white flex items-center justify-center font-black text-2xl rounded shadow-[0_0_20px_rgba(255,255,255,0.2)]">N</div>
          <AnimatePresence>{isSidebarExpanded && ( <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-white font-bold text-2xl tracking-tighter uppercase whitespace-nowrap">EXUS</motion.span> )}</AnimatePresence>
        </div>
        <nav className="flex flex-col gap-6 w-full px-2"><SidebarItem icon={<LayoutDashboard size={24} />} label={t.terminal} active expanded={isSidebarExpanded} /></nav>
      </motion.aside>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
        <div className="p-8 lg:p-10 max-w-[1700px] mx-auto pb-32">
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-12">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center shadow-2xl backdrop-blur-xl">{selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}</div>
              <div>
                <div className="flex items-center gap-5">
                  <h1 className="text-5xl font-normal text-white tracking-tight leading-none">{selectedAsset?.name || t.syncing}</h1>
                  <span className="text-2xl text-white font-light uppercase tracking-widest opacity-40">{selectedAsset?.symbol}</span>
                  <a href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} target="_blank" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-violet-400 hover:bg-white/10 transition-all"><ExternalLink size={20} /></a>
                </div>
                <div className="flex items-center gap-8 mt-4">
                  <span className="text-5xl font-normal text-white tabular-nums tracking-tighter">${(selectedAsset?.current_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</span>
                  <div className={`flex items-center gap-2 text-2xl font-medium px-4 py-1 rounded-xl ${(selectedAsset?.price_change_percentage_24h || 0) >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>{(selectedAsset?.price_change_percentage_24h || 0) >= 0 ? <ArrowUp size={24} /> : <ArrowDown size={24} />}{Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10 shadow-xl">
                <button onClick={() => exportToCSV(assets, 'nexus-audit')} className="px-4 py-2 text-white hover:text-violet-300 text-[10px] font-bold uppercase transition-all hover:bg-white/5 rounded-lg">{t.audit}</button>
                <div className="w-px h-4 bg-white/10" />
                <button onClick={() => setLanguage(language === 'en' ? 'es' : 'en')} className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white text-[10px] font-bold uppercase transition-all hover:bg-violet-500 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.3)]"><Globe size={14} />{language.toUpperCase()}</button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 text-white">
            
            {/* BALANCED CHART AREA (9 COLS) */}
            <div className="xl:col-span-9 flex flex-col gap-12"> 
              <div className="bg-black/40 border border-white/10 rounded-[3.5rem] p-10 min-h-[600px] flex flex-col relative overflow-visible shadow-2xl backdrop-blur-md">
                {isHistoryLoading && (<div className="absolute inset-0 bg-[#0a0518]/90 backdrop-blur-xl z-30 flex items-center justify-center flex-col gap-6 rounded-[3.5rem]"><RefreshCw className="animate-spin text-violet-500" size={40} /><p className="text-violet-200 text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">{t.syncing}</p></div>)}
                {!isHistoryLoading && historyError && (<div className="absolute inset-0 z-20 flex items-center justify-center flex-col gap-4"><DatabaseZap size={32} className="text-white/20" /><p className="text-white/40 font-bold uppercase tracking-[0.3em] text-sm">volume not available</p></div>)}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-10 z-10 gap-6">
                  <div className="flex gap-16 items-center">
                    <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                      {ranges.map((r) => (<button key={r.label} onClick={() => setRange(r.value)} className={`px-5 py-2 text-[10px] font-bold tracking-tighter transition-all border-r border-white/10 last:border-0 uppercase ${currentRange === r.value ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>{r.label}</button>))}
                    </div>
                    <div className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10 shadow-inner">
                      {chartModes.map((m) => (<button key={m.id} onClick={() => setChartType(m.id as any)} className={`px-4 py-2 text-[9px] font-bold transition-all border-r border-white/10 last:border-0 ${chartType === m.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-white/40 hover:text-white'}`}>{m.icon}</button>))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-green-400 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 shadow-2xl"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div><span>Feed Active v7.0</span></div>
                </div>
                <div className="flex-1 w-full min-h-[450px] cursor-crosshair relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={history} margin={{ top: 20, right: 10, left: 10, bottom: 60 }} onMouseMove={handleMouseMove} onMouseLeave={() => setHoverData(null)}>
                      <defs>
                        <linearGradient id="strokeBaseline" x1="0" y1="0" x2="0" y2="1"><stop offset={`${yDomainInfo.off}%`} stopColor="#22c55e" stopOpacity={1}/><stop offset={`${yDomainInfo.off}%`} stopColor="#ef4444" stopOpacity={1}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="0" vertical={true} horizontal={true} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} ticks={xTicks} tickFormatter={(t) => format(new Date(t), 'HH:mm')} axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.3 }} dy={30} />
                      <YAxis domain={[yDomainInfo.min, yDomainInfo.max]} orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#FFFFFF', fontSize: 11, opacity: 0.3 }} tickFormatter={(val) => val.toLocaleString()} width={100} />
                      <Tooltip isAnimationActive={false} cursor={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1, strokeDasharray: '3 3' }} content={() => null} />
                      {(chartType === 'baseline' || hoverData) && ( <ReferenceLine y={hoverData ? hoverData.close : baselineValue} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" /> )}
                      {chartType === 'mountain' && <Area isAnimationActive={false} type="monotone" dataKey="close" stroke={chartColor} strokeWidth={3} fillOpacity={0.2} fill={chartColor} activeDot={{ r: 6, fill: '#FFF', stroke: chartColor, strokeWidth: 2 }} />}
                      {chartType === 'line' && <Line isAnimationActive={false} type="monotone" dataKey="close" stroke={chartColor} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#FFF' }} />}
                      {chartType === 'baseline' && <Area isAnimationActive={false} type="monotone" dataKey="close" stroke="url(#strokeBaseline)" strokeWidth={3} fill="transparent" baseValue={baselineValue} />}
                      {chartType === 'candle' && <Bar isAnimationActive={false} dataKey="close" barSize={6}>{history.map((e, i) => <Cell key={i} fill={e.close >= e.open ? '#22c55e' : '#ef4444'} />)}</Bar>}
                      {chartType === 'bar' && <Bar isAnimationActive={false} dataKey="close" barSize={3}>{history.map((e, i) => <Cell key={i} fill={chartColor} />)}</Bar>}
                    </ComposedChart>
                  </ResponsiveContainer>
                  <AnimatePresence>
                    {hoverData && (
                      <>
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-[10px] bg-white text-black px-6 py-2 rounded-full font-black text-xs z-40 whitespace-nowrap shadow-[0_0_30px_rgba(255,255,255,0.4)] border border-white/10" style={{ left: mousePos.x }}>{format(new Date(hoverData.time), 'MMM dd, yyyy • HH:mm:ss')}</div>
                        <div className="absolute right-0 bg-white text-black px-2 py-1 rounded-l font-black text-[10px] z-40 tabular-nums shadow-2xl border border-white/10" style={{ top: mousePos.y - 12 }}>${(hoverData.close || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex justify-end mt-4"><a href={currentRange === '1' || currentRange === '5' ? "https://www.binance.com" : "https://www.coingecko.com"} target="_blank" className="flex items-center gap-2 text-[10px] font-black text-white hover:text-violet-400 transition-all uppercase tracking-[0.4em] opacity-30 hover:opacity-100">{t.powered} {currentRange === '1' || currentRange === '5' ? 'Binance API' : 'CoinGecko Feed'} <ExternalLink size={12} /></a></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-1">
                <StatRow label={t.stats.mcap} value={`$${((selectedAsset?.market_cap || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label={t.stats.supply} value={`${((selectedAsset?.circulating_supply || 0) / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase() || ''}`} />
                <StatRow label={t.stats.vol} value={`$${((selectedAsset?.total_volume || 0) / 1e9).toFixed(3)}B`} />
                <StatRow label={t.stats.total_supply} value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label={t.stats.range} value={`$${(selectedAsset?.low_24h || 0).toLocaleString()} - $${(selectedAsset?.high_24h || 0).toLocaleString()}`} />
                <StatRow label={t.stats.ath} value={`$${(selectedAsset?.ath || 0).toLocaleString()}`} />
                <StatRow label={t.stats.genesis} value={selectedAsset?.genesis_date || '2009-01-03'} />
                <StatRow label={t.stats.fdv} value={`$${((selectedAsset?.fully_diluted_valuation || 0) / 1e9).toFixed(3)}B`} />
              </div>
              <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-10 mt-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 text-violet-500/5 group-hover:text-violet-500/10 transition-colors"><Sparkles size={200} /></div>
                <div className="relative z-10"><div className="flex items-center gap-3 mb-6 text-violet-300 font-bold text-xs uppercase"><Sparkles size={16} /><span>NEXUS AI INSIGHT</span></div><h3 className="text-2xl font-bold mb-4 text-white uppercase tracking-tight">{t.about} {selectedAsset?.name}</h3><p className="text-white/90 text-xl font-light leading-relaxed">{selectedAsset?.name} ({selectedAsset?.symbol?.toUpperCase()}) is a decentralized digital asset currently positioned at #{assets?.indexOf(selectedAsset) + 1} in {t.ranking}. With a {t.milestone} of ${selectedAsset?.ath?.toLocaleString()} achieved on {selectedAsset?.ath_date ? format(new Date(selectedAsset.ath_date), 'MMM dd, yyyy') : 'recorded history'}. {t.intensity} {selectedAsset?.price_change_percentage_24h?.toFixed(2)}% {t.participation}</p></div>
              </div>
            </div>

            {/* SAFE SIDEBAR AREA (3 COLS) */}
            <div className="xl:col-span-3 flex flex-col gap-12">
              <div>
                <h3 className="text-violet-300 text-xs font-bold uppercase mb-8 flex items-center gap-2"><Activity size={16} /> {t.market_intensity}</h3>
                <div className="bg-black/30 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="border-b border-white/10 bg-white/[0.03]"><th className="p-4 text-[9px] font-bold text-white uppercase">Ticker</th><th className="p-4 text-[9px] font-bold text-white uppercase text-right">Delta</th></tr></thead>
                    <tbody>
                      {assets?.slice(0, 15).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-violet-500/10 cursor-pointer transition-all ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-4"><div className="font-bold text-sm text-white uppercase">{asset.symbol?.toUpperCase() || ''}</div><div className="text-[10px] text-white font-normal">${(asset.current_price || 0).toLocaleString()}</div></td>
                          <td className="p-4 text-right"><div className={`inline-block font-bold text-[9px] px-2 py-1 rounded ${(asset.price_change_percentage_24h || 0) >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{(asset.price_change_percentage_24h || 0) >= 0 ? '+' : ''}{(asset.price_change_percentage_24h || 0).toFixed(2)}%</div></td>
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
    <div className={`flex items-center gap-5 p-4 rounded-xl cursor-pointer transition-all ${active ? 'bg-white text-black shadow-2xl shadow-white/10' : 'text-white/20 hover:text-white hover:bg-white/5'}`}>
      <div className="shrink-0">{icon}</div>
      <AnimatePresence mode="wait">{expanded && ( <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }} className="text-sm font-bold tracking-tight uppercase text-[10px] whitespace-nowrap">{label}</motion.span> )}</AnimatePresence>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-5 border-b border-white/5 last:border-0">
      <span className="text-white text-[12px] font-bold uppercase">{label}</span>
      <span className="text-white text-2xl font-normal tabular-nums tracking-tighter leading-none">{value}</span>
    </div>
  );
}
