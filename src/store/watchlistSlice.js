/**
 * watchlistSlice.js
 * Redux slice for the user's watchlist, pre-loaded from localStorage.
 */

import { createSlice } from "@reduxjs/toolkit";
import { getFavorites } from "../utils/helpers";

const loadInitial = () => {
  try {
    const items = getFavorites();
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

/** Normalizes media_type to "movie" when absent. */
const mediaType = (item) => item?.media_type ?? "movie";

/** True if two watchlist entries refer to the same piece of media. */
const isSame = (a, b) =>
  Number(a.id) === Number(b.id) && mediaType(a) === mediaType(b);

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState: { items: loadInitial() },
  reducers: {
    setWatchlist: (state, action) => {
      state.items = action.payload ?? [];
    },

    addToWatchlist: (state, action) => {
      const item = action.payload;
      if (!item?.id) return;
      if (!state.items.some((i) => isSame(i, item))) {
        state.items.push(item);
      }
    },

    removeFromWatchlist: (state, action) => {
      const target = action.payload;
      if (!target) return;
      state.items = state.items.filter((i) => !isSame(i, target));
    },
  },
});

export const { setWatchlist, addToWatchlist, removeFromWatchlist } =
  watchlistSlice.actions;
export default watchlistSlice.reducer;