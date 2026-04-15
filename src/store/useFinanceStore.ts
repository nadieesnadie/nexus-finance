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
  atl: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  fully_diluted_valuation: number;
  genesis_date: string;
}

interface FinanceStore {
  assets: CryptoData[];
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  selectedAssetId: string | null;
  selectedAssetDetails: any | null;
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
  loading: false,
  isHistoryLoading: false,
  error: null,
  selectedAssetId: 'bitcoin',
  selectedAssetDetails: null,
  history: [],
  currentRange: '7',
  
  fetchAssets: async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h,7d'
      );
      if (!response.ok) throw new Error('Market data unavailable');
      const data = await response.json();
      
      if (get().assets.length === 0) {
        set({ assets: data, loading: false });
        get().setSelectedAsset(data[0].id);
      } else {
        set({ assets: data });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchHistory: async (id: string, days: string) => {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    
    set({ isHistoryLoading: true, currentRange: days, history: [] });
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
        { signal: abortController.signal }
      );
      
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      const formattedHistory = data.prices.map((p: [number, number]) => ({
        time: p[0],
        value: p[1]
      }));
      
      set({ history: formattedHistory, isHistoryLoading: false });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      set({ isHistoryLoading: false });
    }
  },

  setSelectedAsset: async (id: string) => {
    set({ selectedAssetId: id });
    const assets = get().assets;
    const details = assets.find(a => a.id === id);
    set({ selectedAssetDetails: details });
    get().fetchHistory(id, get().currentRange);
  },

  setRange: (range: string) => {
    const id = get().selectedAssetId || 'bitcoin';
    get().fetchHistory(id, range);
  },
}));
