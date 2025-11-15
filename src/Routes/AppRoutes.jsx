import React from "react";
import Home from "../pages/Home";
import Movies_Shows from "../pages/Movies_Shows";
import MoviesOpen from "../pages/MoviesOpen";
import ShowsOpen from "../pages/ShowsOpen";
import Support from "../pages/Support";
import Subscription from "../pages/Subscription";
import MovieDetail from "../components/Movies&Shows/MovieDetailHero/MovieDetail";
import TVDetail from '../components/Movies&Shows/ShowsOpenHero/TVDetail';
import Watchlist from "../pages/Watchlist";
import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies_shows" element={<Movies_Shows />} />
        <Route path="/moviesOpen" element={<MoviesOpen />} />
        <Route path="/showsOpen" element={<ShowsOpen />} />
        <Route path="/support" element={<Support />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/tv/:id" element={<TVDetail />} />
        <Route path="/watchlist" element={<Watchlist />} />
      </Routes>
    </>
  );
}