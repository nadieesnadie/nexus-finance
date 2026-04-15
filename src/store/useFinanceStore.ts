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
  setSelectedAsset: (id: string) => void;
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  assets: [],
  loading: false,
  error: null,
  selectedAssetId: 'bitcoin',
  
  fetchAssets: async () => {
    set({ loading: true });
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h'
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      set({ assets: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setSelectedAsset: (id: string) => set({ selectedAssetId: id }),
}));
