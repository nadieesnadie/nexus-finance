'use client';

import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { exportToCSV } from '@/lib/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { 
    assets, fetchAssets, loading, selectedAssetId, setSelectedAsset, 
    history, setRange, currentRange, isHistoryLoading, error: storeError
  } = useFinanceStore();

  // Polling para tiempo real
  useEffect(() => {
    fetchAssets();
    const interval = setInterval(() => {
      fetchAssets();
    }, 60000); // Refrescar cada minuto
    return () => clearInterval(interval);
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId) || assets[0],
  [assets, selectedAssetId]);

  const chartData = useMemo(() => history, [history]);

  // Cálculo de dominio para evitar "montañas" en stablecoins
  const yDomain = useMemo(() => {
    if (history.length === 0) return ['auto', 'auto'];
    const values = history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    // Si la variación es menor al 0.5%, forzamos un margen para que se vea plano
    if (range / min < 0.005) {
      return [min * 0.999, max * 1.001];
    }
    return ['auto', 'auto'];
  }, [history]);

  const handleExport = () => {
    const dataToExport = assets.map(({ id, name, symbol, current_price, market_cap }) => ({
      id, name, symbol, current_price, market_cap
    }));
    exportToCSV(dataToExport, 'nexus-market-data');
  };

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-full text-white/50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
        <p>Connecting to Market Data...</p>
      </div>
    </div>
  );

  const ranges = [
    { label: '1D', value: '1' },
    { label: '7D', value: '7' },
    { label: '1M', value: '30' },
    { label: '1Y', value: '365' },
    { label: 'Lifetime', value: 'max' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-gray-500">Live analytics for top digital assets.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            className="glass px-6 py-2.5 rounded-full font-medium hover:bg-white/10 transition-colors"
          >
            Export CSV
          </button>
          <ConnectButton />
        </div>
      </header>

      {storeError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl mb-8 flex justify-between items-center">
          <span>{storeError}</span>
          <button onClick={() => fetchAssets()} className="underline text-sm font-bold">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 min-h-[500px] flex flex-col relative overflow-hidden"
          >
            {isHistoryLoading && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-apple-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                  <img src={selectedAsset?.image} alt="" className="w-full h-full object-cover p-2" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedAsset?.name}</h2>
                  <p className={selectedAsset?.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}>
                    {selectedAsset?.price_change_percentage_24h > 0 ? '+' : ''}{selectedAsset?.price_change_percentage_24h?.toFixed(2)}% (24h)
                  </p>
                </div>
              </div>

              <div className="flex bg-white/5 p-1 rounded-xl">
                {ranges.map((r) => (
                  <button
                    key={r.label}
                    disabled={isHistoryLoading}
                    onClick={() => setRange(r.value)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${currentRange === r.value ? 'bg-apple-blue text-white shadow-lg' : 'text-gray-500 hover:text-white'} ${isHistoryLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={yDomain} hide />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#111] border border-white/10 p-3 rounded-xl shadow-2xl">
                            <p className="text-gray-400 text-xs mb-1">
                              {format(new Date(payload[0].payload.time), 'MMM dd, yyyy HH:mm')}
                            </p>
                            <p className="text-white font-bold">
                              ${payload[0].value?.toLocaleString(undefined, { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6 
                              })}
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
                    stroke="#007AFF" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={1000}
                    isAnimationActive={!isHistoryLoading}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard icon={<DollarSign size={18} />} label="Asset Price" value={`$${selectedAsset?.current_price?.toLocaleString()}`} trend="Live Refresh" />
            <MetricCard icon={<TrendingUp size={18} />} label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(1)}B`} trend="Global Rank" />
            <MetricCard icon={<Activity size={18} />} label="Volume (24h)" value="$1.2B" trend="High" />
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Top Assets</h3>
            <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400">Live</span>
          </div>
          <div className="flex flex-col gap-2">
            {assets.map((asset) => (
              <motion.div 
                whileHover={{ x: 4 }}
                key={asset.id}
                onClick={() => !isHistoryLoading && setSelectedAsset(asset.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${selectedAssetId === asset.id ? 'bg-apple-blue/20 border border-apple-blue/30' : 'hover:bg-white/5 border border-transparent'} ${isHistoryLoading ? 'opacity-80' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src={asset.image} alt="" className="w-full h-full object-cover p-1" />
                  </div>
                  <div>
                    <div className="font-bold">{asset.name}</div>
                    <div className="text-xs text-gray-500 uppercase">{asset.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${asset.current_price?.toLocaleString()}</div>
                  <div className={`text-xs ${asset.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.price_change_percentage_24h > 0 ? '+' : ''}{asset.price_change_percentage_24h?.toFixed(2)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-3xl">
      <div className="flex justify-between items-center mb-4">
        <div className="text-gray-500 text-sm">{label}</div>
        <div className="text-apple-blue">{icon}</div>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-apple-blue font-medium">{trend}</div>
    </div>
  );
}
