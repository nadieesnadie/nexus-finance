import { create } from 'zustand';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  image: string;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  ath: number;
  ath_date: string;
  atl: number;
  atl_date: string;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  fully_diluted_valuation: number;
  genesis_date: string;
  sparkline_in_7d?: { price: number[] };
}

interface HistoryPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  value: number; // For backward compatibility with simple charts
}

interface FinanceStore {
  assets: CryptoData[];
  loading: boolean;
  error: string | null;
  historyError: string | null;
  fetchAssets: () => Promise<void>;
  selectedAssetId: string | null;
  history: HistoryPoint[];
  currentRange: string;
  chartType: 'mountain' | 'line' | 'candle' | 'baseline' | 'bar';
  isHistoryLoading: boolean;
  setSelectedAsset: (id: string) => void;
  setRange: (range: string) => void;
  setChartType: (type: 'mountain' | 'line' | 'candle' | 'baseline' | 'bar') => void;
  fetchHistory: (id: string, days: string) => Promise<void>;
}

let abortController: AbortController | null = null;
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 300000; // 5 minutes

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  assets: [],
  loading: true,
  isHistoryLoading: false,
  error: null,
  historyError: null,
  selectedAssetId: null,
  history: [],
  currentRange: '1',
  chartType: 'mountain',
  
  fetchAssets: async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d'
      );
      if (!response.ok) throw new Error('API Rate Limit reached.');
      const data = await response.json();
      
      if (!Array.isArray(data)) throw new Error('Invalid API Response');

      set({ assets: data, loading: false, error: null });
      if (get().assets.length > 0 && !get().selectedAssetId) {
        get().setSelectedAsset(data[0].id);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchHistory: async (id: string, days: string) => {
    const cacheKey = `${id}-${days}`;
    const cached = cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      set({ history: cached.data, isHistoryLoading: false, currentRange: days, historyError: null });
      return;
    }

    if (abortController) abortController.abort();
    abortController = new AbortController();
    
    set({ isHistoryLoading: true, currentRange: days, history: [], historyError: null });
    
    let daysParam = days;
    if (days === 'ytd') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const diff = new Date().getTime() - startOfYear.getTime();
      daysParam = Math.ceil(diff / (1000 * 60 * 60 * 24)).toString();
    }
    
    const asset = get().assets.find(a => a.id === id);
    const symbol = asset ? asset.symbol.toUpperCase() : 'BTC';
    
    try {
      // 1. PRIMARY ENGINE: BINANCE OHLC (Real Candles)
      let interval = '5m';
      let limit = 288;
      
      if (days === '1') { interval = '5m'; limit = 288; }
      else if (days === '5') { interval = '30m'; limit = 240; }
      else if (days === '30') { interval = '4h'; limit = 180; }
      else if (days === '180') { interval = '1d'; limit = 180; }
      else if (days === '365' || days === 'ytd') { interval = '1d'; limit = 365; }
      else if (days === '1825') { interval = '1w'; limit = 265; }
      else if (days === 'max') { interval = '1w'; limit = 1000; }

      let binanceSymbol = `${symbol}USDT`;
      if (symbol === 'USDT') binanceSymbol = 'USDCUSDT'; 
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`,
        { signal: abortController!.signal }
      );

      if (!response.ok) throw new Error('Binance Pair Not Found');
      const data = await response.json();
      
      const formattedHistory = data.map((p: any) => ({
        time: p[0],
        open: parseFloat(p[1]),
        high: parseFloat(p[2]),
        low: parseFloat(p[3]),
        close: parseFloat(p[4]),
        value: parseFloat(p[4]) // Default close value
      }));

      cache.set(cacheKey, { data: formattedHistory, timestamp: Date.now() });
      set({ history: formattedHistory, isHistoryLoading: false, historyError: null });

    } catch (binanceErr: any) {
      if (binanceErr.name === 'AbortError') return;

      // 2. SECONDARY ENGINE: COINGECKO (Fallback - No real candles, but has history)
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${daysParam}`,
          { signal: abortController!.signal }
        );
        
        if (!response.ok) throw new Error('Feed Limit Reached');
        const data = await response.json();
        
        const formattedHistory = data.prices.map((p: [number, number]) => ({
          time: p[0],
          open: p[1],
          high: p[1],
          low: p[1],
          close: p[1],
          value: p[1]
        }));

        cache.set(cacheKey, { data: formattedHistory, timestamp: Date.now() });
        set({ history: formattedHistory, isHistoryLoading: false, historyError: null });

      } catch (cgErr: any) {
        if (cgErr.name === 'AbortError') return;
        set({ history: [], isHistoryLoading: false, historyError: 'Market Volume Not Available' });
      }
    }
  },

  setSelectedAsset: (id: string) => {
    set({ selectedAssetId: id, historyError: null });
    get().fetchHistory(id, get().currentRange);
  },

  setRange: (range: string) => {
    const id = get().selectedAssetId || 'bitcoin';
    get().fetchHistory(id, range);
  },

  setChartType: (type) => set({ chartType: type }),
}));
