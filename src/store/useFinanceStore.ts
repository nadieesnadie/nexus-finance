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

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  assets: [],
  loading: true,
  isHistoryLoading: false,
  error: null,
  selectedAssetId: null,
  history: [],
  currentRange: '7',
  
  fetchAssets: async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d'
      );
      if (!response.ok) throw new Error('Nexus Terminal: API Rate Limit. Please wait.');
      const data = await response.json();
      
      const isInitialLoad = get().assets.length === 0;
      set({ assets: data, loading: false });
      
      if (isInitialLoad && data.length > 0) {
        get().setSelectedAsset(data[0].id);
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchHistory: async (id: string, days: string) => {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    
    set({ isHistoryLoading: true, currentRange: days, history: [] });
    
    let daysParam = days;
    if (days === 'ytd') {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const diff = new Date().getTime() - startOfYear.getTime();
      daysParam = Math.floor(diff / (1000 * 60 * 60 * 24)).toString();
    }
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${daysParam}`,
        { signal: abortController.signal }
      );
      
      if (!response.ok) throw new Error('History Data: Locked or Unavailable');
      const data = await response.json();
      const formattedHistory = data.prices.map((p: [number, number]) => ({
        time: p[0],
        value: p[1]
      }));
      
      set({ history: formattedHistory, isHistoryLoading: false, error: null });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      set({ isHistoryLoading: false });
    }
  },

  setSelectedAsset: (id: string) => {
    set({ selectedAssetId: id });
    get().fetchHistory(id, get().currentRange);
  },

  setRange: (range: string) => {
    const id = get().selectedAssetId || 'bitcoin';
    get().fetchHistory(id, range);
  },
}));
