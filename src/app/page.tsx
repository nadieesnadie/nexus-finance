'use client';

import { useEffect, useMemo } from 'react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';

import { ArrowUpRight, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function Dashboard() {
  const { assets, fetchAssets, loading, selectedAssetId, setSelectedAsset } = useFinanceStore();

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const selectedAsset = useMemo(() => 
    assets.find(a => a.id === selectedAssetId) || assets[0],
  [assets, selectedAssetId]);

  const chartData = useMemo(() => {
    if (!selectedAsset?.sparkline_in_7d?.price) return [];
    return selectedAsset.sparkline_in_7d.price.map((price, i) => ({
      time: i,
      value: price
    }));
  }, [selectedAsset]);

  if (loading && assets.length === 0) return (
    <div className="flex items-center justify-center h-full text-white/50">Loading market data...</div>
  );

  return (
    <div className="p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-gray-500">Welcome back, David. Track your assets in real-time.</p>
        </div>
        <div className="flex gap-4">
          <button className="glass px-6 py-2 rounded-full font-medium">Export CSV</button>
          <button className="bg-apple-blue px-6 py-2 rounded-full font-medium text-white shadow-lg shadow-apple-blue/20">Connect Wallet</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <section className="lg:col-span-2 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl p-8 h-[450px]"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold overflow-hidden">
                  <img src={selectedAsset?.image} alt="" className="w-full h-full object-cover p-2" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedAsset?.name} Price</h2>
                  <p className={selectedAsset?.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}>
                    {selectedAsset?.price_change_percentage_24h.toFixed(2)}% (24h)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${selectedAsset?.current_price.toLocaleString()}</div>
                <p className="text-gray-500 text-sm">Last updated: Just now</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#007AFF" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard icon={<DollarSign size={18} />} label="Total Balance" value="$42,390.00" trend="+12.5%" />
            <MetricCard icon={<TrendingUp size={18} />} label="Market Cap" value={`$${(selectedAsset?.market_cap / 1e9).toFixed(1)}B`} trend="Global" />
            <MetricCard icon={<Activity size={18} />} label="Active Trades" value="24" trend="Live" />
          </div>
        </section>

        {/* Assets List Section */}
        <aside className="flex flex-col gap-6">
          <h3 className="text-xl font-bold">Top Assets</h3>
          <div className="flex flex-col gap-2">
            {assets.map((asset) => (
              <div 
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center ${selectedAssetId === asset.id ? 'bg-apple-blue/20 border border-apple-blue/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    <img src={asset.image} alt="" className="w-full h-full object-cover p-1" />
                  </div>
                  <div>
                    <div className="font-bold">{asset.name}</div>
                    <div className="text-xs text-gray-500">{asset.symbol.toUpperCase()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${asset.current_price.toLocaleString()}</div>
                  <div className={`text-xs ${asset.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.price_change_percentage_24h.toFixed(2)}%
                  </div>
                </div>
              </div>
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
