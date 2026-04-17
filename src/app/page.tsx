'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts';
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
  const [isMounted, setIsMounted] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  // Fast Polling for Real-Time data
  useEffect(() => {
    setIsMounted(true);
    fetchAssets();
    const interval = setInterval(() => fetchAssets(), 10000); // 10s Live Refresh
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets?.find(a => a.id === selectedAssetId) || assets?.[0],
  [assets, selectedAssetId]);

  const chartColor = useMemo(() => {
    if (!history || history.length < 2) return '#a78bfa';
    const first = history[0].value;
    const last = history[history.length - 1].value;
    return last >= first ? '#22c55e' : '#ef4444';
  }, [history]);

  // 1. CHART INITIALIZATION (Runs ONCE)
  useEffect(() => {
    if (!isMounted || !chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#FFFFFF',
        fontFamily: 'Inter, -apple-system, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.02)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.02)' },
      },
      crosshair: {
        mode: 0, // Magnet mode
        vertLine: { width: 1, color: 'rgba(255, 255, 255, 0.3)', style: 3, labelBackgroundColor: '#000000' },
        horzLine: { width: 1, color: 'rgba(255, 255, 255, 0.3)', style: 3, labelBackgroundColor: '#000000' },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { 
        borderVisible: false, 
        timeVisible: true, 
        secondsVisible: false,
        minBarSpacing: 0.5, // Prevents infinite zoom out
      },
      handleScroll: true,
      handleScale: true,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineWidth: 2,
    });

    chartRef.current = chart;
    seriesRef.current = areaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [isMounted]);

  // 2. DATA & COLOR SYNCHRONIZATION
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || !history || history.length === 0 || !selectedAsset) return;

    seriesRef.current.applyOptions({
      lineColor: chartColor,
      topColor: `${chartColor}30`,
      bottomColor: `${chartColor}00`,
      priceFormat: {
        type: 'price',
        precision: selectedAsset.current_price < 1 ? 6 : 2,
        minMove: 0.000001,
      },
    });

    const uniqueDataMap = new Map();
    history.forEach(item => {
      if (item.time && typeof item.value === 'number' && !isNaN(item.value)) {
        uniqueDataMap.set(Math.floor(item.time / 1000), item.value);
      }
    });
    
    const data = Array.from(uniqueDataMap.entries())
      .map(([time, value]) => ({ time: time as any, value }))
      .sort((a, b) => a.time - b.time);

    try {
      if (data.length > 0) {
        seriesRef.current.setData(data);
        chartRef.current.timeScale().fitContent();
      }
    } catch (e) {
      console.error("Nexus Engine: Invalid chart data format", e);
    }
  }, [history, chartColor, selectedAsset]);

  // 3. REAL-TIME APPEND
  useEffect(() => {
    if (!seriesRef.current || !selectedAsset || !history || history.length === 0) return;
    
    const now = Math.floor(Date.now() / 1000);
    const lastDataPointTime = Math.floor(history[history.length - 1].time / 1000);

    // Append to chart if it's new data and we're looking at live ranges (1D)
    if (now > lastDataPointTime && currentRange === '1') {
      try {
        seriesRef.current.update({ time: now as any, value: selectedAsset.current_price });
      } catch (e) {
        // Silently ignore minor deduplication conflicts during rapid updates
      }
    }
  }, [selectedAsset?.current_price, currentRange]);

  if (!isMounted || (loading && (!assets || assets.length === 0))) return (
    <div className="flex items-center justify-center h-screen bg-[#0d081a]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-white text-xs tracking-[0.4em] font-light uppercase">Nexus Terminal Booting...</p>
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
                  <h1 className="text-5xl font-normal text-white tracking-tight leading-none">{selectedAsset?.name || 'Syncing Stream'}</h1>
                  <span className="text-2xl text-violet-400/40 font-bold uppercase tracking-widest">{selectedAsset?.symbol}</span>
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
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </header>

          {storeError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-6 rounded-3xl mb-12 flex justify-between items-center backdrop-blur-xl">
              <div className="flex items-center gap-4 text-lg font-medium">
                <Info size={24} />
                <span>{storeError}</span>
              </div>
              <button onClick={() => fetchAssets()} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">Retry Feed</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-16">
            <div className="xl:col-span-8 flex flex-col gap-16">
              
              <div className="bg-[#0c0a1f]/40 border border-white/10 rounded-[3.5rem] p-10 min-h-[600px] flex flex-col relative overflow-visible shadow-[0_40px_100px_rgba(0,0,0,0.4)] backdrop-blur-md">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-[#0d081a]/80 backdrop-blur-sm z-30 flex items-center justify-center rounded-[2.5rem]">
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
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Engine V5 Live Sync
                  </div>
                </div>

                <div ref={chartContainerRef} className="flex-1 w-full min-h-[450px]" />
              </div>

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
                        <th className="p-5 text-[10px] font-bold text-white/40 uppercase">Ticker</th>
                        <th className="p-5 text-[10px] font-bold text-white/40 uppercase text-right">Last</th>
                        <th className="p-5 text-[10px] font-bold text-white/40 uppercase text-right">Shift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assets?.slice(0, 15).map((asset) => (
                        <tr key={asset.id} onClick={() => setSelectedAsset(asset.id)} className={`border-b border-white/[0.03] last:border-0 hover:bg-violet-500/10 cursor-pointer transition-colors ${selectedAssetId === asset.id ? 'bg-white/10' : ''}`}>
                          <td className="p-5">
                            <div className="font-bold text-sm text-white">{asset.symbol?.toUpperCase()}</div>
                            <div className="text-[10px] text-white/30 truncate max-w-[100px]">{asset.name}</div>
                          </td>
                          <td className="p-5 text-right font-normal text-sm tabular-nums">
                            ${(asset.current_price || 0) < 1 ? (asset.current_price || 0).toFixed(4) : (asset.current_price || 0).toLocaleString()}
                          </td>
                          <td className="p-5 text-right">
                            <div className={`inline-block font-bold text-[10px] px-2 py-1 rounded ${(asset.price_change_percentage_24h || 0) >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {(asset.price_change_percentage_24h || 0) >= 0 ? '+' : ''}{(asset.price_change_percentage_24h || 0).toFixed(2)}%
                            </div>
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
                        <div className={`font-black text-base tracking-tighter ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name}</div>
                      </div>
                      <div className={`text-sm font-normal tabular-nums ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>
                        ${(asset.current_price || 0) < 1 ? (asset.current_price || 0).toFixed(4) : (asset.current_price || 0).toLocaleString()}
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
