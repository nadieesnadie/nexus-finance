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
    history, setRange, currentRange, isHistoryLoading, error: storeError
  } = useFinanceStore();

  useEffect(() => {
    fetchAssets();
    const interval = setInterval(() => fetchAssets(), 60000);
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId) || assets[0],
  [assets, selectedAssetId]);

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
    const padding = (max - min) * 0.15 || min * 0.05;
    return [min - padding, max + padding];
  }, [history]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-screen bg-black text-white/50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium tracking-tight text-white">Connecting to Nexus Terminal...</p>
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
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center justify-center">
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight text-white">{selectedAsset?.name || 'Loading...'}</h1>
                  <span className="text-xl text-gray-400 font-medium uppercase">{selectedAsset?.symbol}</span>
                  <a 
                    href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-apple-blue transition-colors"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-3xl font-bold text-white">
                    ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className={`flex items-center gap-1 text-lg font-bold ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
                    {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => exportToCSV(assets, 'nexus-analytics')} 
                className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all text-white"
              >
                Export CSV
              </button>
              <ConnectButton />
            </div>
          </header>

          {storeError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 flex justify-between items-center">
              <span className="font-bold">{storeError}</span>
              <button onClick={() => fetchAssets()} className="underline text-sm font-black">RETRY CONNECTION</button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 flex flex-col gap-8">
              {/* Chart Card */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 min-h-[550px] flex flex-col relative overflow-hidden">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] z-30 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      <p className="text-xs font-black tracking-widest text-white uppercase">Syncing Price Action...</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mb-10 z-10">
                  <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        disabled={isHistoryLoading}
                        onClick={() => setRange(r.value)}
                        className={`px-5 py-2 rounded-xl text-xs font-black tracking-tighter transition-all ${currentRange === r.value ? 'bg-white text-black shadow-[0_4px_20px_rgba(255,255,255,0.2)]' : 'text-gray-500 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 bg-white/5 px-4 py-2 rounded-full border border-white/5 uppercase tracking-[0.2em]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Nexus Terminal Live
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 10, fontWeight: 700 }}
                        minTickGap={40}
                        height={30}
                        dy={10}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#888', fontSize: 10, fontWeight: 800 }}
                        tickFormatter={(val) => val.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: val < 1 ? 6 : 2 
                        })}
                        width={80}
                      />                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-[#141414] border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
                                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.1em] mb-2">
                                  {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                                </p>
                                <p className="text-white font-black text-2xl tracking-tighter">
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
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={1500}
                        isAnimationActive={!isHistoryLoading}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Table Section */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  <StatRow label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
                  <StatRow label="Fully Diluted Val." value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
                  <StatRow label="Volume (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
                  <StatRow label="Circulating Supply" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
                  <StatRow label="Day's Range" value={`$${selectedAsset?.low_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})} - $${selectedAsset?.high_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})}`} />
                  <StatRow label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
                  <StatRow label="All-time High" value={`$${selectedAsset?.ath?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} subValue={selectedAsset?.ath_date ? format(new Date(selectedAsset.ath_date), 'MMM dd, yyyy') : ''} />
                  <StatRow label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
                  <StatRow label="All-time Low" value={`$${selectedAsset?.atl?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} subValue={selectedAsset?.atl_date ? format(new Date(selectedAsset.atl_date), 'MMM dd, yyyy') : ''} />
                  <StatRow label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="bg-gradient-to-br from-apple-blue/10 to-transparent border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 text-white/5 group-hover:text-white/10 transition-colors">
                  <Sparkles size={200} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6 text-apple-blue font-black tracking-[0.2em] text-xs">
                    <Sparkles size={18} />
                    <span>NEXUS AI INSIGHT</span>
                  </div>
                  <h3 className="text-3xl font-bold mb-6 text-white tracking-tight">Market Protocol: {selectedAsset?.name}</h3>
                  <p className="text-gray-300 leading-relaxed text-xl font-medium">
                    {selectedAsset?.name} maintains a current market position of ${selectedAsset?.current_price?.toLocaleString(undefined, {maximumFractionDigits: 6})}. 
                    The asset exhibits a {selectedAsset?.price_change_percentage_24h >= 0 ? 'bullish' : 'bearish'} 24h delta of {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%. 
                    With a liquidity depth of ${(selectedAsset?.total_volume / 1e9).toFixed(2)}B, technical analysis indicates 
                    {selectedAsset?.price_change_percentage_24h >= 0 ? ' strong buy-side pressure ' : ' selling exhaustion '} 
                    near the {currentRange}D mean.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar Right */}
            <div className="xl:col-span-4 flex flex-col gap-8">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2rem] p-8">
                <h3 className="text-sm font-black mb-6 flex items-center gap-3 text-gray-400 uppercase tracking-widest">
                  <Activity size={16} className="text-apple-blue" />
                  Global Indices
                </h3>
                <div className="flex flex-col gap-6">
                  <MarketSmallRow label="S&P 500" value="5,841.53" change="+0.45%" up />
                  <MarketSmallRow label="Nasdaq 100" value="18,384.47" change="+0.12%" up />
                  <MarketSmallRow label="Dow Jones" value="42,475.90" change="-0.08%" up={false} />
                  <MarketSmallRow label="Gold (Spot)" value="2,645.10" change="+1.20%" up />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-black px-4 text-gray-400 uppercase tracking-widest">Top Assets</h3>
                {assets.slice(0, 10).map((asset) => (
                  <motion.div 
                    whileHover={{ scale: 1.02, x: 5 }}
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                    className={`p-5 rounded-[1.5rem] cursor-pointer transition-all flex justify-between items-center border ${selectedAssetId === asset.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full ${selectedAssetId === asset.id ? 'bg-black/10' : 'bg-white/10'} p-1.5`}>
                        <img src={asset.image} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className={`font-bold text-sm tracking-tight ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name}</div>
                    </div>
                    <div className={`text-sm font-black ${selectedAssetId === asset.id ? 'text-black' : (asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500')}`}>
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
    <div className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 group cursor-help">
        <span className="text-gray-300 text-sm font-bold uppercase tracking-tighter">{label}</span>
        <Info size={14} className="text-gray-600 group-hover:text-white transition-colors" />
      </div>
      <div className="text-right">
        <div className="font-black text-white text-base tracking-tight">{value}</div>
        {subValue && <div className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{subValue}</div>}
      </div>
    </div>
  );
}

function MarketSmallRow({ label, value, change, up }: { label: string; value: string; change: string; up: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm font-bold text-gray-300">{label}</span>
      <div className="text-right">
        <div className="text-base font-black text-white">{value}</div>
        <div className={`text-[10px] font-black ${up ? 'text-green-500' : 'text-red-500'}`}>{change}</div>
      </div>
    </div>
  );
}
