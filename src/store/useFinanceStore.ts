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

interface FinanceStore {
  assets: CryptoData[];
  loading: boolean;
  error: string | null;
  historyError: string | null;
  fetchAssets: () => Promise<void>;
  selectedAssetId: string | null;
  history: { time: number; value: number }[];
  currentRange: string;
  isHistoryLoading: boolean;
  setSelectedAsset: (id: string) => void;
  setRange: (range: string) => void;
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
  
  fetchAssets: async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d'
      );
      if (!response.ok) throw new Error('API Rate Limit. Running in Fallback Mode.');
      const data = await response.json();
      
      if (!Array.isArray(data) || (data.length > 0 && typeof data[0].current_price !== 'number')) {
        throw new Error('Invalid API Response from Provider');
      }

      const isInitialLoad = get().assets.length === 0;
      set({ assets: data, loading: false, error: null });
      
      if (isInitialLoad && data.length > 0) {
        get().setSelectedAsset(data[0].id);
      }
    } catch (err: any) {
      const isInitialLoad = get().assets.length === 0;
      
      if (isInitialLoad) {
        const fallbackData: CryptoData[] = [
          {
            id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 65430.20, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', price_change_percentage_24h: 1.2, market_cap: 1200000000000, total_volume: 30000000000, high_24h: 66000, low_24h: 64000, ath: 73000, ath_date: '2024-03-14', atl: 67, atl_date: '2013-07-06', circulating_supply: 19600000, total_supply: 21000000, max_supply: 21000000, fully_diluted_valuation: 1300000000000, genesis_date: '2009-01-03', sparkline_in_7d: { price: Array(168).fill(65000) }
          },
          {
            id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3450.50, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', price_change_percentage_24h: 2.1, market_cap: 400000000000, total_volume: 15000000000, high_24h: 3600, low_24h: 3400, ath: 4891, ath_date: '2021-11-16', atl: 0.42, atl_date: '2015-10-21', circulating_supply: 120000000, total_supply: 120000000, max_supply: 120000000, fully_diluted_valuation: 400000000000, genesis_date: '2015-07-30', sparkline_in_7d: { price: Array(168).fill(3500) }
          },
          {
            id: 'tether', symbol: 'usdt', name: 'Tether', current_price: 1.0002, image: 'https://assets.coingecko.com/coins/images/325/large/Tether.png', price_change_percentage_24h: 0.01, market_cap: 100000000000, total_volume: 40000000000, high_24h: 1.01, low_24h: 0.99, ath: 1.32, ath_date: '2018-07-24', atl: 0.57, atl_date: '2015-03-02', circulating_supply: 100000000000, total_supply: 100000000000, max_supply: 100000000000, fully_diluted_valuation: 100000000000, genesis_date: '2015-02-25', sparkline_in_7d: { price: Array(168).fill(1) }
          },
          {
            id: 'solana', symbol: 'sol', name: 'Solana', current_price: 145.20, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', price_change_percentage_24h: -1.5, market_cap: 60000000000, total_volume: 5000000000, high_24h: 150, low_24h: 140, ath: 260, ath_date: '2021-11-06', atl: 0.50, atl_date: '2020-05-11', circulating_supply: 400000000, total_supply: 500000000, max_supply: 500000000, fully_diluted_valuation: 75000000000, genesis_date: '2020-03-16', sparkline_in_7d: { price: Array(168).fill(145) }
          },
          {
            id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 0.51, image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', price_change_percentage_24h: 0.5, market_cap: 28000000000, total_volume: 1000000000, high_24h: 0.52, low_24h: 0.50, ath: 3.40, ath_date: '2018-01-07', atl: 0.002, atl_date: '2014-05-22', circulating_supply: 55000000000, total_supply: 100000000000, max_supply: 100000000000, fully_diluted_valuation: 51000000000, genesis_date: '2013-08-04', sparkline_in_7d: { price: Array(168).fill(0.51) }
          }
        ];
        set({ assets: fallbackData, loading: false, error: 'API Limit Reached. Running Offline Simulation.' });
        get().setSelectedAsset('bitcoin');
      } else {
        set({ error: err.message, loading: false });
      }
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
    
    // Función auxiliar para obtener de Binance
    const fetchFromBinance = async () => {
      let interval = '5m';
      let limit = 288;
      
      if (days === '1') { interval = '5m'; limit = 288; }
      else if (days === '5') { interval = '30m'; limit = 240; }
      else if (days === '30') { interval = '4h'; limit = 180; }
      else if (days === '180') { interval = '1d'; limit = 180; }
      else if (days === '365' || days === 'ytd') { interval = '1d'; limit = 365; }
      else if (days === '1825') { interval = '1w'; limit = 265; }
      else if (days === 'max') { interval = '1w'; limit = 1000; } // Maximum possible limit for Binance

      let binanceSymbol = `${symbol}USDT`;
      if (symbol === 'USDT') binanceSymbol = 'USDCUSDT'; 
      
      const binanceResponse = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`,
        { signal: abortController!.signal }
      );

      if (!binanceResponse.ok) throw new Error('Binance Pair Not Found');

      const binanceData = await binanceResponse.json();
      return binanceData.map((p: any) => ({
        time: p[0],
        value: parseFloat(p[4])
      }));
    };

    // Función auxiliar para obtener de CoinGecko
    const fetchFromCoinGecko = async () => {
      const cgResponse = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${daysParam}`,
        { signal: abortController!.signal }
      );
      
      if (!cgResponse.ok) throw new Error('CoinGecko API Rate Limit');
      
      const cgData = await cgResponse.json();
      if (!cgData || !Array.isArray(cgData.prices)) throw new Error('Format Error');

      let processedPrices = cgData.prices;
      
      const interpolate = (prices: [number, number][], targetIntervalMs: number) => {
        if (!prices || prices.length < 2) return prices;
        const result: [number, number][] = [];
        for (let i = 0; i < prices.length - 1; i++) {
          const p1 = prices[i];
          const p2 = prices[i + 1];
          result.push(p1);
          
          const timeDiff = p2[0] - p1[0];
          const steps = Math.floor(timeDiff / targetIntervalMs);
          
          if (steps > 1 && steps < 100) {
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

      if (days === '1') processedPrices = interpolate(cgData.prices, 60 * 1000);
      else if (days === '5') processedPrices = interpolate(cgData.prices, 10 * 60 * 1000);
      else if (days === '30') processedPrices = interpolate(cgData.prices, 60 * 60 * 1000);

      return processedPrices.map((p: [number, number]) => ({
        time: p[0],
        value: p[1]
      }));
    };

    try {
      let formattedHistory;

      // ENRUTAMIENTO INTELIGENTE: CoinGecko tiene la historia completa pre-2017. Binance es mejor para corto plazo.
      if (days === '1825' || days === 'max') {
        try {
          formattedHistory = await fetchFromCoinGecko();
        } catch (e) {
          formattedHistory = await fetchFromBinance();
        }
      } else {
        try {
          formattedHistory = await fetchFromBinance();
        } catch (e) {
          formattedHistory = await fetchFromCoinGecko();
        }
      }

      cache.set(cacheKey, { data: formattedHistory, timestamp: Date.now() });
      set({ history: formattedHistory, isHistoryLoading: false, historyError: null });

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      // TERTIARY ENGINE: MATHEMATICAL SIMULATION
      const basePrice = asset ? (asset.current_price || 1) : 1;
      const fakeHistory = [];
      const now = Date.now();
      const daysNum = days === 'max' ? 365 * 5 : (parseInt(daysParam) || 30);
      const points = 150;
      const step = (daysNum * 24 * 60 * 60 * 1000) / points;
      
      for(let i=0; i<points; i++) {
         fakeHistory.push({
           time: now - (points - i) * step,
           value: basePrice * (1 + (Math.sin(i / 5) * 0.05))
         });
      }
      
      set({ history: fakeHistory, isHistoryLoading: false, historyError: err.message });
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
}));