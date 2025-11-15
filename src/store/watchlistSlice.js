import { createSlice } from '@reduxjs/toolkit';
import { getFavorites as getFavoritesHelper } from '../utils/helpers';

const loadInitial = () => {
  try {
    const items = getFavoritesHelper();
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

const initialState = {
  items: loadInitial(),
};

export const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    setWatchlist: (state, action) => {
      state.items = action.payload || [];
    },
    addToWatchlist: (state, action) => {
      const item = action.payload;
      if (!item || !item.id) return;
      const exists = state.items.some((i) => Number(i.id) === Number(item.id) && (i.media_type||'movie') === (item.media_type||'movie'));
      if (!exists) state.items.push(item);
    },
    removeFromWatchlist: (state, action) => {
      const { id, media_type } = action.payload || {};
      state.items = state.items.filter((i) => !(Number(i.id) === Number(id) && (i.media_type||'movie') === (media_type||'movie')));
    },
  },
});

export const { setWatchlist, addToWatchlist, removeFromWatchlist } = watchlistSlice.actions;

export default watchlistSlice.reducer;
