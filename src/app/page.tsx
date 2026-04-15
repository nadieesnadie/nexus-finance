'use client';

import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { exportToCSV } from '@/lib/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { 
    assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, 
    history, setRange, currentRange, isHistoryLoading, error: storeError,
    selectedAssetDetails: details
  } = useFinanceStore();

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(() => fetchAssets(), 60000);
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId) || assets[0],
  [assets, selectedAssetId]);

  // Color dinámico basado en el rendimiento del periodo
  const chartColor = useMemo(() => {
    if (history.length < 2) return '#007AFF';
    const first = history[0].value;
    const last = history[history.length - 1].value;
    return last >= first ? '#22c55e' : '#ef4444';
  }, [history]);

  const yDomain = useMemo(() => {
    if (history.length === 0) return ['auto', 'auto'];
    const values = history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15;
    return [min - padding, max + padding];
  }, [history]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-full bg-black text-white/50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium tracking-tight">Accessing Nexus Terminal...</p>
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
    <div className="flex h-screen bg-black text-[#f5f5f7] overflow-hidden">
      {/* Main Content Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center">
                <img src={selectedAsset?.image} alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight">{selectedAsset?.name}</h1>
                  <span className="text-xl text-gray-500 font-medium uppercase">{selectedAsset?.symbol}</span>
                  <a 
                    href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol.toUpperCase()}-USD`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-apple-blue transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-3xl font-semibold">${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className={`flex items-center gap-1 text-lg font-medium ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                    {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => exportToCSV(assets, 'nexus-data')} className="glass px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-white/10 transition-all">Export</button>
              <ConnectButton />
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Center Column: Chart & Stats */}
            <div className="xl:col-span-8 flex flex-col gap-8">
              {/* Chart Card */}
              <div className="glass rounded-[2rem] p-8 min-h-[500px] flex flex-col relative overflow-hidden border-white/5">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-8 z-10">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        disabled={isHistoryLoading}
                        onClick={() => setRange(r.value)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRange === r.value ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-widest">
                    Real-time Data
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="time" hide />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#4b4b4b', fontSize: 11, fontWeight: 600 }}
                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val.toFixed(2)}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#1c1c1e] border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                                  {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                                </p>
                                <p className="text-white font-bold text-xl leading-none">
                                  ${payload[0].value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
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
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={1500}
                        isAnimationActive={!isHistoryLoading}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Grid - Yahoo Finance Style */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 glass rounded-[2rem] p-8 border-white/5">
                <StatRow label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                <StatRow label="Fully Diluted Valuation" value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(2)}B`} />
                <StatRow label="Volume (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(2)}B`} />
                <StatRow label="Circulating Supply" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol.toUpperCase()}`} />
                <StatRow label="Day's Range" value={`$${selectedAsset?.low_24h?.toLocaleString()} - $${selectedAsset?.high_24h?.toLocaleString()}`} />
                <StatRow label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                <StatRow label="All-time High" value={`$${selectedAsset?.ath?.toLocaleString()}`} subValue={selectedAsset?.ath_date ? format(new Date(selectedAsset.ath_date), 'MMM yyyy') : ''} />
                <StatRow label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                <StatRow label="All-time Low" value={`$${selectedAsset?.atl?.toLocaleString()}`} subValue={selectedAsset?.atl_date ? format(new Date(selectedAsset.atl_date), 'MMM yyyy') : ''} />
                <StatRow label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
              </div>

              {/* AI Overview Section */}
              <div className="glass rounded-[2rem] p-8 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 text-apple-blue/20 group-hover:text-apple-blue/40 transition-colors">
                  <Sparkles size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4 text-apple-blue font-bold tracking-tight">
                    <Sparkles size={20} />
                    <span>NEXUS AI INSIGHT</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Market Analysis: {selectedAsset?.name}</h3>
                  <p className="text-gray-400 leading-relaxed text-lg">
                    {selectedAsset?.name} is currently trading at ${selectedAsset?.current_price?.toLocaleString()}, showing a 
                    {selectedAsset?.price_change_percentage_24h >= 0 ? ' bullish ' : ' bearish '} 
                    momentum of {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}% in the last 24 hours. 
                    With a market dominance reflected in its ${(selectedAsset?.market_cap / 1e9).toFixed(2)}B valuation, 
                    the asset is testing its recent resistance levels. Technical indicators suggest 
                    {selectedAsset?.price_change_percentage_24h >= 0 ? ' continued accumulation ' : ' cautious consolidation '} 
                    near the {selectedAsset?.symbol.toUpperCase()} {currentRange}D support zone.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Trending & Markets */}
            <div className="xl:col-span-4 flex flex-col gap-8">
              {/* US Markets Summary */}
              <div className="glass rounded-[2rem] p-6 border-white/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-apple-blue" />
                  US Markets
                </h3>
                <div className="flex flex-col gap-4">
                  <MarketSmallRow label="S&P 500" value="5,241.53" change="+0.45%" up />
                  <MarketSmallRow label="Nasdaq" value="16,384.47" change="+0.12%" up />
                  <MarketSmallRow label="Dow Jones" value="39,475.90" change="-0.08%" up={false} />
                  <MarketSmallRow label="Gold" value="2,345.10" change="+1.20%" up />
                </div>
              </div>

              {/* Trending Tickers */}
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold px-2">Trending Assets</h3>
                {assets.slice(0, 8).map((asset) => (
                  <motion.div 
                    whileHover={{ x: 6, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center border border-transparent ${selectedAssetId === asset.id ? 'bg-white/5 border-white/10' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/10 p-1.5">
                        <img src={asset.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="font-bold text-sm tracking-tight">{asset.name}</div>
                    </div>
                    <div className={`text-sm font-bold ${asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 group cursor-help">
        <span className="text-gray-500 text-sm font-medium">{label}</span>
        <Info size={12} className="text-gray-700 group-hover:text-gray-500" />
      </div>
      <div className="text-right">
        <div className="font-bold text-[#f5f5f7]">{value}</div>
        {subValue && <div className="text-[10px] text-gray-600 font-bold uppercase">{subValue}</div>}
      </div>
    </div>
  );
}

function MarketSmallRow({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-gray-400">{label}</span>
      <div className="text-right">
        <div className="text-sm font-bold">{value}</div>
        <div className={`text-[10px] font-black ${up ? 'text-green-500' : 'text-red-500'}`}>{change}</div>
      </div>
    </div>
  );
}
