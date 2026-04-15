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
  history: [],
  currentRange: '7',
  
  fetchAssets: async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h'
      );
      if (!response.ok) throw new Error('Market data unavailable');
      const data = await response.json();
      
      const currentAssets = get().assets;
      // Solo disparar carga inicial si no hay activos
      if (currentAssets.length === 0) {
        set({ assets: data, loading: false });
        get().fetchHistory(data[0].id, get().currentRange);
      } else {
        set({ assets: data });
      }
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  fetchHistory: async (id: string, days: string) => {
    // Cancel previous request if any
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    
    set({ isHistoryLoading: true, currentRange: days, history: [] }); // Reset history here
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`,
        { signal: abortController.signal }
      );
      
      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limit exceeded. Please wait.');
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      const formattedHistory = data.prices.map((p: [number, number]) => ({
        time: p[0],
        value: p[1]
      }));
      
      set({ history: formattedHistory, isHistoryLoading: false, error: null });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('History fetch error:', err);
      set({ isHistoryLoading: false, error: err.message });
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
