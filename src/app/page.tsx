'use client';

import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line 
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
    if (history.length < 2) return '#3b82f6';
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
    <div className="flex items-center justify-center h-screen bg-black">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xl font-bold tracking-widest text-white animate-pulse">NEXUS TERMINAL INITIALIZING...</p>
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
    <div className="flex h-screen bg-[#050505] text-slate-50 overflow-hidden selection:bg-blue-500/30">
      {/* Sidebar Navigation Placeholder (Future expansion) */}
      <div className="w-16 border-r border-white/5 flex flex-col items-center py-8 gap-8 hidden lg:flex bg-black">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl">N</div>
        <div className="flex flex-col gap-6 text-slate-500">
          <Activity size={24} className="text-white" />
          <TrendingUp size={24} />
          <DollarSign size={24} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
          {/* Header */}
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
            <div className="flex items-center gap-8">
              <motion.div 
                layoutId="asset-icon"
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-4 shadow-2xl flex items-center justify-center"
              >
                {selectedAsset?.image && <img src={selectedAsset.image} alt="" className="w-full h-full object-contain" />}
              </motion.div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-5xl font-black tracking-tighter text-white">{selectedAsset?.name}</h1>
                  <span className="text-2xl text-slate-500 font-bold uppercase tracking-widest">{selectedAsset?.symbol}</span>
                  <a 
                    href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-white/10 transition-all shadow-xl"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <span className="text-4xl font-black text-white tabular-nums tracking-tighter">
                    ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                  </span>
                  <span className={`flex items-center gap-1 text-xl font-black px-3 py-1 rounded-lg ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                    {selectedAsset?.price_change_percentage_24h >= 0 ? <ArrowUp size={22} /> : <ArrowDown size={22} />}
                    {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5 shadow-2xl">
              <button 
                onClick={() => exportToCSV(assets, 'nexus-report')} 
                className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all text-slate-200"
              >
                Export Terminal
              </button>
              <ConnectButton />
            </div>
          </header>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-8 flex flex-col gap-10">
              {/* Main Chart */}
              <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-10 min-h-[600px] flex flex-col relative overflow-hidden shadow-2xl">
                {isHistoryLoading && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px] z-30 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-14 h-14 border-4 border-blue-500 border-t-white rounded-full animate-spin"></div>
                      <p className="text-sm font-black tracking-[0.3em] text-white uppercase animate-pulse">Syncing Nexus Streams</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-center mb-12 z-10 gap-6">
                  <div className="flex bg-black/50 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                    {ranges.map((r) => (
                      <button
                        key={r.label}
                        disabled={isHistoryLoading}
                        onClick={() => setRange(r.value)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-tight transition-all ${currentRange === r.value ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105' : 'text-slate-500 hover:text-white'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-black text-blue-400 bg-blue-500/5 px-5 py-2.5 rounded-full border border-blue-500/20 uppercase tracking-[0.2em]">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    Live Terminal Active
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="time" 
                        tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 800 }}
                        minTickGap={50}
                        dy={15}
                      />
                      <YAxis 
                        domain={yDomain} 
                        orientation="right" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 900 }}
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
                              <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] backdrop-blur-3xl">
                                <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.2em] mb-3 border-b border-white/5 pb-2">
                                  {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                                </p>
                                <p className="text-white font-black text-3xl tracking-tighter tabular-nums">
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
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorPrice)" 
                        animationDuration={2000}
                        isAnimationActive={!isHistoryLoading}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* High Contrast Stats Grid */}
              <div className="bg-[#0d0d0d] border border-white/5 rounded-[3rem] p-12 shadow-2xl">
                <h3 className="text-xl font-black mb-10 text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <Info size={24} className="text-blue-500" />
                  Technical Fundamentals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-8">
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
            </div>

            {/* Sidebar Right */}
            <div className="xl:col-span-4 flex flex-col gap-10">
              {/* Real Indices Placeholder - Using real coins as proxies */}
              <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
                <h3 className="text-xs font-black mb-8 flex items-center gap-3 text-slate-400 uppercase tracking-[0.3em]">
                  <Activity size={18} className="text-blue-500" />
                  Nexus Global Proxies
                </h3>
                <div className="flex flex-col gap-8">
                  <MarketMiniChart label="Digital Gold (BTC)" asset={assets.find(a => a.id === 'bitcoin')} />
                  <MarketMiniChart label="Smart Contracts (ETH)" asset={assets.find(a => a.id === 'ethereum')} />
                  <MarketMiniChart label="Stable Index (USDT)" asset={assets.find(a => a.id === 'tether')} />
                  <MarketMiniChart label="DeFi Proxy (SOL)" asset={assets.find(a => a.id === 'solana')} />
                </div>
              </div>

              {/* Full Asset List (50 Items) */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-4 mb-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Market Cap Ranking</h3>
                  <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">TOP 50</span>
                </div>
                <div className="flex flex-col gap-3 max-h-[800px] overflow-y-auto custom-scrollbar pr-2">
                  {assets.map((asset) => (
                    <motion.div 
                      whileHover={{ x: 8, backgroundColor: 'rgba(255,255,255,0.05)' }}
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset.id)}
                      className={`p-5 rounded-[1.5rem] cursor-pointer transition-all flex justify-between items-center border ${selectedAssetId === asset.id ? 'bg-white text-black border-white shadow-[0_10px_40px_rgba(255,255,255,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl ${selectedAssetId === asset.id ? 'bg-black/10' : 'bg-white/10'} p-2`}>
                          <img src={asset.image} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className={`font-black text-sm tracking-tight ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>{asset.name}</div>
                          <div className={`text-[10px] font-bold uppercase tracking-widest ${selectedAssetId === asset.id ? 'text-black/50' : 'text-slate-500'}`}>{asset.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-black text-sm tabular-nums ${selectedAssetId === asset.id ? 'text-black' : 'text-white'}`}>
                          ${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}
                        </div>
                        <div className={`text-[10px] font-black ${selectedAssetId === asset.id ? 'text-black/70' : (asset.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400')}`}>
                          {asset.price_change_percentage_24h >= 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                        </div>
                      </div>
                    </motion.div>
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

function StatRow({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="flex justify-between items-end py-5 border-b border-white/5 last:border-0">
      <div className="flex flex-col gap-1">
        <span className="text-slate-400 text-[11px] font-black uppercase tracking-[0.1em]">{label}</span>
        <div className="font-black text-white text-xl tracking-tighter leading-none">{value}</div>
      </div>
      {subValue && (
        <div className="text-right pb-1">
          <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md">{subValue}</div>
        </div>
      )}
    </div>
  );
}

function MarketMiniChart({ label, asset }: { label: string; asset?: any }) {
  if (!asset) return null;
  const isUp = asset.price_change_percentage_24h >= 0;
  const color = isUp ? '#22c55e' : '#ef4444';
  
  // Create simple path data from sparkline
  const sparkData = asset.sparkline_in_7d?.price.map((p: number, i: number) => ({ v: p })) || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-black text-slate-200 tracking-tight">{label}</span>
        <span className={`text-xs font-black tabular-nums ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          ${asset.current_price.toLocaleString()}
        </span>
      </div>
      <div className="h-12 w-full flex items-center gap-4">
        <div className="flex-1 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className={`text-[10px] font-black w-14 text-right ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? '+' : ''}{asset.price_change_percentage_24h.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
