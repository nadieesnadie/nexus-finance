'use client';

import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line 
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, ExternalLink, Info, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
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
      <p className="text-white text-2xl font-light tracking-widest uppercase">Nexus Terminal Connecting...</p>
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
    <div className="min-h-screen bg-black text-white font-sans antialiased p-4 lg:p-10">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Top Navigation Bar */}
        <nav className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white text-black px-3 py-1 font-bold text-xl rounded">NEXUS</div>
            <h2 className="text-white text-sm tracking-widest uppercase font-medium">Financial Intelligence</h2>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => exportToCSV(assets, 'nexus-data')} className="text-white hover:underline text-sm font-medium">Export CSV</button>
            <ConnectButton />
          </div>
        </nav>

        {/* Main Layout: 2 Columns */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          
          {/* LEFT: Chart and Main Stats */}
          <div className="xl:col-span-8 flex flex-col gap-12">
            
            {/* Asset Identity */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="flex items-center gap-6">
                <img src={selectedAsset?.image} alt="" className="w-16 h-16 object-contain" />
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-5xl font-normal text-white tracking-tight">{selectedAsset?.name}</h1>
                    <span className="text-2xl text-white/60 font-light uppercase">{selectedAsset?.symbol}</span>
                    <a href={`https://finance.yahoo.com/quote/${selectedAsset?.symbol?.toUpperCase()}-USD`} target="_blank" className="text-white/40 hover:text-white transition-colors">
                      <ExternalLink size={20} />
                    </a>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-4xl font-normal text-white tabular-nums">
                      ${selectedAsset?.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                    </span>
                    <span className={`text-xl font-medium ${selectedAsset?.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedAsset?.price_change_percentage_24h >= 0 ? '+' : ''}{selectedAsset?.price_change_percentage_24h?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Range Selectors - Simple & Clean */}
              <div className="flex border border-white/20 rounded overflow-hidden">
                {ranges.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setRange(r.value)}
                    className={`px-4 py-2 text-xs font-medium border-r border-white/20 last:border-0 transition-colors ${currentRange === r.value ? 'bg-white text-black' : 'text-white hover:bg-white/10'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Chart Section */}
            <div className="h-[500px] w-full relative">
              {isHistoryLoading && (
                <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white text-xs tracking-widest font-medium animate-pulse uppercase">Updating Market Feed...</p>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(time) => format(new Date(time), currentRange === '1' ? 'HH:mm' : 'MMM dd')}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#FFFFFF', fontSize: 11 }}
                    minTickGap={60}
                  />
                  <YAxis 
                    domain={yDomain} 
                    orientation="right" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#FFFFFF', fontSize: 11 }}
                    tickFormatter={(val) => val.toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: val < 1 ? 6 : 2 
                    })}
                    width={100}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-black border border-white/20 p-4 shadow-2xl">
                            <p className="text-white/60 text-[10px] font-medium uppercase mb-1">
                              {format(new Date(payload[0].payload.time), 'MMM dd, yyyy • HH:mm:ss')}
                            </p>
                            <p className="text-white text-2xl font-light tabular-nums">
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
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Technical Stats: Clean Table Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-2">
              <StatItem label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(3)}B`} />
              <StatItem label="Circulating Supply" value={`${(selectedAsset?.circulating_supply / 1e6).toFixed(2)}M ${selectedAsset?.symbol?.toUpperCase()}`} />
              <StatItem label="Volume (24h)" value={`$${(selectedAsset?.total_volume / 1e9).toFixed(3)}B`} />
              <StatItem label="Total Supply" value={selectedAsset?.total_supply ? `${(selectedAsset.total_supply / 1e6).toFixed(2)}M` : '--'} />
              <StatItem label="Day's Range" value={`$${selectedAsset?.low_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})} - $${selectedAsset?.high_24h?.toLocaleString(undefined, {maximumFractionDigits: 4})}`} />
              <StatItem label="Max Supply" value={selectedAsset?.max_supply ? `${(selectedAsset.max_supply / 1e6).toFixed(2)}M` : '∞'} />
              <StatItem label="All-time High" value={`$${selectedAsset?.ath?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} />
              <StatItem label="Genesis Date" value={selectedAsset?.genesis_date || '2009-01-03'} />
              <StatItem label="All-time Low" value={`$${selectedAsset?.atl?.toLocaleString(undefined, {maximumFractionDigits: 6})}`} />
              <StatItem label="Fully Diluted Val." value={`$${(selectedAsset?.fully_diluted_valuation / 1e9 || 0).toFixed(3)}B`} />
            </div>

            {/* AI Summary: Simple Box */}
            <div className="border border-white/10 p-8 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-4 text-white font-medium text-xs tracking-widest">
                <Sparkles size={16} />
                <span>NEXUS AI ANALYSIS</span>
              </div>
              <p className="text-white text-xl font-light leading-relaxed">
                {selectedAsset?.name} is trading at ${selectedAsset?.current_price?.toLocaleString(undefined, {maximumFractionDigits: 6})}, 
                reflecting a {selectedAsset?.price_change_percentage_24h >= 0 ? 'growth' : 'decrease'} of {Math.abs(selectedAsset?.price_change_percentage_24h || 0).toFixed(2)}% today. 
                With a market cap of ${(selectedAsset?.market_cap / 1e9).toFixed(2)}B, the asset is maintaining liquidity within 
                standard volatility parameters for the {currentRange}D period.
              </p>
            </div>
          </div>

          {/* RIGHT: Global Proxies and List */}
          <div className="xl:col-span-4 flex flex-col gap-12">
            
            {/* Real Indices Mini Charts */}
            <div>
              <h3 className="text-white text-xs font-medium tracking-[0.2em] uppercase mb-8 flex items-center gap-2">
                <Activity size={16} /> Global Market Proxies
              </h3>
              <div className="flex flex-col gap-10">
                <ProxyItem label="Digital Gold (BTC)" asset={assets.find(a => a.id === 'bitcoin')} />
                <ProxyItem label="Smart Contract (ETH)" asset={assets.find(a => a.id === 'ethereum')} />
                <ProxyItem label="Stable Index (USDT)" asset={assets.find(a => a.id === 'tether')} />
                <ProxyItem label="Altcoin Proxy (SOL)" asset={assets.find(a => a.id === 'solana')} />
              </div>
            </div>

            {/* Full Asset List (Scrollable) */}
            <div className="flex flex-col gap-4">
              <h3 className="text-white text-xs font-medium tracking-[0.2em] uppercase mb-4 px-2">Market Cap Ranking</h3>
              <div className="flex flex-col max-h-[800px] overflow-y-auto custom-scrollbar border border-white/10 rounded-lg">
                {assets.map((asset) => (
                  <div 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                    className={`p-4 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors ${selectedAssetId === asset.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-4">
                      <img src={asset.image} alt="" className="w-6 h-6 object-contain" />
                      <div>
                        <div className="font-medium text-sm">{asset.name}</div>
                        <div className={`text-[10px] uppercase font-light ${selectedAssetId === asset.id ? 'text-black/60' : 'text-white/40'}`}>{asset.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-sm tabular-nums">${asset.current_price < 1 ? asset.current_price.toFixed(4) : asset.current_price.toLocaleString()}</div>
                      <div className={`text-[10px] font-medium ${asset.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'} ${selectedAssetId === asset.id ? 'text-black font-bold' : ''}`}>
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
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/10">
      <span className="text-white text-sm font-medium">{label}</span>
      <span className="text-white text-sm font-light tabular-nums">{value}</span>
    </div>
  );
}

function ProxyItem({ label, asset }: { label: string; asset?: any }) {
  if (!asset) return null;
  const isUp = asset.price_change_percentage_24h >= 0;
  const sparkData = asset.sparkline_in_7d?.price.map((p: number) => ({ v: p })) || [];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-xs font-medium">
        <span className="text-white/60">{label}</span>
        <span className={isUp ? 'text-green-500' : 'text-red-500'}>${asset.current_price.toLocaleString()}</span>
      </div>
      <div className="h-10 w-full flex items-center gap-4">
        <div className="flex-1 h-full opacity-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <span className={`text-[10px] font-medium w-12 text-right ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? '+' : ''}{asset.price_change_percentage_24h.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
