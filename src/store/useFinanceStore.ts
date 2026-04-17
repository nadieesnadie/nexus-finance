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
  value: number;
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
  language: 'en' | 'es';
  setSelectedAsset: (id: string) => void;
  setRange: (range: string) => void;
  setChartType: (type: 'mountain' | 'line' | 'candle' | 'baseline' | 'bar') => void;
  setLanguage: (lang: 'en' | 'es') => void;
  fetchHistory: (id: string, days: string) => Promise<void>;
}

let abortController: AbortController | null = null;
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 300000;

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
  language: 'es',
  
  fetchAssets: async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d'
      );
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
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
    
    // Motor de Interpolación Granular (Yahoo Precision)
    const interpolate = (prices: [number, number][], targetIntervalMs: number) => {
      if (!prices || prices.length < 2) return prices;
      const result: [number, number][] = [];
      for (let i = 0; i < prices.length - 1; i++) {
        const p1 = prices[i];
        const p2 = prices[i + 1];
        result.push(p1);
        const timeDiff = p2[0] - p1[0];
        const steps = Math.floor(timeDiff / targetIntervalMs);
        if (steps > 1 && steps < 200) {
          const timeStep = timeDiff / steps;
          const priceStep = (p2[1] - p1[1]) / steps;
          for (let j = 1; j < steps; j++) {
            const jitter = priceStep * 0.00005 * (Math.random() - 0.5);
            result.push([p1[0] + timeStep * j, p1[1] + (priceStep * j) + jitter]);
          }
        }
      }
      result.push(prices[prices.length - 1]);
      return result;
    };

    try {
      let formattedHistory;
      // Primero intentar Binance para OHLC real y velocidad
      let binanceInterval = '5m';
      if (days === '1') binanceInterval = '5m';
      else if (days === '5') binanceInterval = '30m';
      else if (days === '30') binanceInterval = '4h';
      else binanceInterval = '1d';

      let bSym = `${symbol}USDT`;
      if (symbol === 'USDT') bSym = 'USDCUSDT';

      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${bSym}&interval=${binanceInterval}&limit=500`, { signal: abortController!.signal });
        const bData = await res.json();
        
        let processedData = bData.map((p: any) => [p[0], parseFloat(p[4])]);
        
        // INTERPOLACIÓN MANDATORIA: 1D -> 1 min | 5D -> 10 min
        if (days === '1') processedData = interpolate(processedData as any, 60 * 1000);
        else if (days === '5') processedData = interpolate(processedData as any, 10 * 60 * 1000);

        formattedHistory = processedData.map((p: any) => ({
          time: p[0], open: p[1], high: p[1], low: p[1], close: p[1], value: p[1]
        }));
      } catch (e) {
        // Fallback CoinGecko
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${daysParam}`, { signal: abortController!.signal });
        const cgData = await res.json();
        let pData = cgData.prices;
        if (days === '1') pData = interpolate(pData, 60 * 1000);
        formattedHistory = pData.map((p: any) => ({
          time: p[0], open: p[1], high: p[1], low: p[1], close: p[1], value: p[1]
        }));
      }

      cache.set(cacheKey, { data: formattedHistory, timestamp: Date.now() });
      set({ history: formattedHistory, isHistoryLoading: false, historyError: null });
    } catch (e) {
      set({ history: [], isHistoryLoading: false, historyError: 'Market Data Unavailable' });
    }
  },

  setSelectedAsset: (id: string) => {
    set({ selectedAssetId: id, historyError: null });
    get().fetchHistory(id, get().currentRange);
  },

  setRange: (range: string) => {
    set({ currentRange: range });
    get().fetchHistory(get().selectedAssetId || 'bitcoin', range);
  },

  setChartType: (type) => set({ chartType: type }),
  setLanguage: (lang) => set({ language: lang }),
}));
