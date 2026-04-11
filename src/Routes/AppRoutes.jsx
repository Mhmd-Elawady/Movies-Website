import React from "react";
import Home from "../pages/Home";
import Movies_Shows from "../pages/Movies_Shows";
import MoviesOpen from "../pages/MoviesOpen";
import ShowsOpen from "../pages/ShowsOpen";
import Support from "../pages/Support";
import Subscription from "../pages/Subscription";
import MovieDetail from "../components/Movies&Shows/MovieDetailHero/MovieDetail";
import TVDetail from '../components/Movies&Shows/ShowsOpenHero/TVDetail';
import Actor from "../components/Actor/Actor";
import Watchlist from "../components/Watchlist/Watchlist";
import Category from "../pages/Category";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Profile from "../components/Profile/Profile";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import { Route, Routes } from "react-router-dom";

export default function AppRoutes() {
  return (
    <>
      <Routes>
        {/* ── Public routes (no auth required) ── */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* ── Protected routes (redirect to /register if not logged in) ── */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/movies_shows" element={<ProtectedRoute><Movies_Shows /></ProtectedRoute>} />
        <Route path="/moviesOpen" element={<ProtectedRoute><MoviesOpen /></ProtectedRoute>} />
        <Route path="/showsOpen" element={<ProtectedRoute><ShowsOpen /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
        <Route path="/movie/:id" element={<ProtectedRoute><MovieDetail /></ProtectedRoute>} />
        <Route path="/tv/:id" element={<ProtectedRoute><TVDetail /></ProtectedRoute>} />
        <Route path="/category/:name" element={<ProtectedRoute><Category /></ProtectedRoute>} />
        <Route path="/actor/:id" element={<ProtectedRoute><Actor /></ProtectedRoute>} />
        <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      </Routes>
    </>
  );
}
