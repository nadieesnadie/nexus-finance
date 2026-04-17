'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

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

  // TRADINGVIEW ENGINE INITIALIZATION
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#FFFFFF',
        fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 0, // Magnet mode (Snapping)
        vertLine: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.5)',
          style: 3,
          labelBackgroundColor: '#FFFFFF',
        },
        horzLine: {
          width: 1,
          color: 'rgba(255, 255, 255, 0.5)',
          style: 3,
          labelBackgroundColor: '#FFFFFF',
        },
      },
      rightPriceScale: {
        borderVisible: false,
        textColor: 'rgba(255, 255, 255, 0.4)',
      },
      timeScale: {
        borderVisible: false,
        textColor: 'rgba(255, 255, 255, 0.4)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: chartColor,
      topColor: `${chartColor}40`,
      bottomColor: `${chartColor}00`,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: selectedAsset?.current_price < 1 ? 6 : 2,
        minMove: 0.000001,
      },
    });

    // Map history to Lightweight Charts format
    const data = history.map(item => ({
      time: (item.time / 1000) as any, // Unix timestamp
      value: item.value,
    }));

    areaSeries.setData(data);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [history, chartColor, selectedAsset]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-[#0d081a]">
      <p className="text-white text-xl font-light tracking-[0.3em] animate-pulse">NEXUS TERMINAL CONNECTING...</p>
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
              
              {/* YAHOO / TRADINGVIEW PRECISION CHART */}
              <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-8 min-h-[600px] flex flex-col relative overflow-visible">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0d081a]/95 backdrop-blur-xl z-30 flex items-center justify-center">
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
                  <div className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
                    TradingView Engine Precision
                  </div>
                </div>

                {/* THE PROFESSIONAL CHART AREA */}
                <div ref={chartContainerRef} className="flex-1 w-full min-h-[450px]" />
              </div>

              {/* TECHNICAL DATA */}
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
                      {assets.slice(0, 15).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-violet-500/10 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
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
