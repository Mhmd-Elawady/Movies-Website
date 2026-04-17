import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/Auth/ProtectedRoute";

// ── Route-level lazy loading ──────────────────────────────────────────────────
// Each page/component loads only when the user navigates to it,
// splitting the 680 KB monolith into ~15 smaller chunks.

const Home = lazy(() => import("../pages/Home"));
const Movies_Shows = lazy(() => import("../pages/Movies_Shows"));
const MoviesOpen = lazy(() => import("../pages/MoviesOpen"));
const ShowsOpen = lazy(() => import("../pages/ShowsOpen"));
const Support = lazy(() => import("../pages/Support"));
const Subscription = lazy(() => import("../pages/Subscription"));
const MovieDetail = lazy(() => import("../components/Movies&Shows/MovieDetailHero/MovieDetail"));
const TVDetail = lazy(() => import("../components/Movies&Shows/ShowsOpenHero/TVDetail"));
const Actor = lazy(() => import("../components/Actor/Actor"));
const Watchlist = lazy(() => import("../components/Watchlist/Watchlist"));
const Category = lazy(() => import("../pages/Category"));
const Register = lazy(() => import("../pages/Register"));
const Login = lazy(() => import("../pages/Login"));
const Profile = lazy(() => import("../components/Profile/Profile"));

// ── Themed loading spinner ────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#000",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#e50914",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}
