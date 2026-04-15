import { create } from 'zustand';

interface CryptoData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  image: string;
  price_change_percentage_24h: number;
  market_cap: number;
  sparkline_in_7d: { price: number[] };
}

interface FinanceStore {
  assets: CryptoData[];
  loading: boolean;
  error: string | null;
  fetchAssets: () => Promise<void>;
  selectedAssetId: string | null;
  history: { time: number; value: number }[];
  currentRange: string;
  setSelectedAsset: (id: string) => void;
  setRange: (range: string) => void;
  fetchHistory: (id: string, days: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  assets: [],
  loading: false,
  error: null,
  selectedAssetId: 'bitcoin',
  history: [],
  currentRange: '7',
  
  fetchAssets: async () => {
    set({ loading: true });
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h'
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      set({ assets: data, loading: false });
      
      // Fetch initial history for selected asset
      get().fetchHistory('bitcoin', '7');
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchHistory: async (id: string, days: string) => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
      );
      const data = await response.json();
      const formattedHistory = data.prices.map((p: [number, number]) => ({
        time: p[0],
        value: p[1]
      }));
      set({ history: formattedHistory, currentRange: days });
    } catch (err) {
      console.error('History fetch error:', err);
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
