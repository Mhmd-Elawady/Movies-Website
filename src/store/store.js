/**
 * store.js
 * Redux store — combines all slice reducers.
 */

import { configureStore } from "@reduxjs/toolkit";
import movieReducer     from "./movieSlice";
import watchlistReducer from "./watchlistSlice";

export const store = configureStore({
  reducer: {
    movieData: movieReducer,
    watchlist: watchlistReducer,
  },
});