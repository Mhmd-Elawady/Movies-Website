/**
 * Profile.jsx
 * User profile page — displays user info, favorites, and logout.
 */

import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import MyNavbar from "../Homesection/Navbar/MyNavbar";
import { getFavorites, removeFavorite, buildImageUrl } from "../../utils/helpers";
import "./Profile.css";

const PLACEHOLDER = "https://via.placeholder.com/200x300?text=No+Image";

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate           = useNavigate();
  const [favorites,   setFavorites]   = useState([]);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const [logoutError, setLogoutError] = useState("");

  /* ── Load & sync favorites ───────────────────────────────── */
  const syncFavorites = useCallback(() => {
    setFavorites(getFavorites() || []);
  }, []);

  useEffect(() => {
    syncFavorites();
    const onStorage = (e) => { if (!e.key || e.key === "myapp.favorites.v1") syncFavorites(); };
    window.addEventListener("favorites:change", syncFavorites);
    window.addEventListener("storage",          onStorage);
    return () => {
      window.removeEventListener("favorites:change", syncFavorites);
      window.removeEventListener("storage",          onStorage);
    };
  }, [syncFavorites]);

  /* ── Derived user info ───────────────────────────────────── */
  const fullName = user?.user_metadata?.full_name
    || user?.email?.split("@")[0]
    || "User";

  const email = user?.email || "";

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      })
    : "";

  const movieCount = favorites.filter((f) => (f.media_type || "movie") === "movie").length;
  const tvCount    = favorites.filter((f) => (f.media_type || "movie") === "tv").length;

  /* ── Logout ──────────────────────────────────────────────── */
  const handleLogout = async () => {
    setLoggingOut(true);
    setLogoutError("");
    const { error } = await signOut();
    if (error) {
      setLoggingOut(false);
      setLogoutError("Sign out failed. Please try again.");
      console.error("Logout failed:", error);
    } else {
      navigate("/login", { replace: true });
    }
  };

  /* ── Remove favorite ─────────────────────────────────────── */
  const handleRemoveFav = useCallback((id, media_type) => {
    removeFavorite(id, media_type || "movie");
    syncFavorites();
    try { window.dispatchEvent(new Event("favorites:change")); } catch {}
  }, [syncFavorites]);

  return (
    <div className="profile-page-wrapper">
      <MyNavbar />

      <main className="profile-main">

        {/* ── User card ─────────────────────────────────────── */}
        <section className="profile-card" aria-label="User profile">
          <div className="profile-card-bg" aria-hidden="true" />
          <div className="profile-card-content">

            {/* Avatar */}
            <div className="profile-avatar" aria-hidden="true">
              <span className="profile-avatar-initials">{initials}</span>
            </div>

            {/* Info */}
            <h1 className="profile-name">{fullName}</h1>
            <p className="profile-email">{email}</p>

            {joinDate && (
              <p className="profile-joined">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                     strokeLinejoin="round" aria-hidden="true">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8"  x2="8"  y1="2" y2="6" />
                  <line x1="3"  x2="21" y1="10" y2="10" />
                </svg>
                Member since {joinDate}
              </p>
            )}

            {/* Stats */}
            <dl className="profile-stats">
              <div className="profile-stat">
                <dt className="profile-stat-label">Favorites</dt>
                <dd className="profile-stat-value">{favorites.length}</dd>
              </div>
              <div className="profile-stat-divider" aria-hidden="true" />
              <div className="profile-stat">
                <dt className="profile-stat-label">Movies</dt>
                <dd className="profile-stat-value">{movieCount}</dd>
              </div>
              <div className="profile-stat-divider" aria-hidden="true" />
              <div className="profile-stat">
                <dt className="profile-stat-label">TV Shows</dt>
                <dd className="profile-stat-value">{tvCount}</dd>
              </div>
            </dl>

            {/* Logout error */}
            {logoutError && (
              <p className="profile-error" role="alert">{logoutError}</p>
            )}

            {/* Logout button */}
            <button
              className="profile-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-busy={loggingOut}
            >
              <span className="profile-logout-content">
                {loggingOut ? (
                  <>
                    <span className="profile-spinner" aria-hidden="true" />
                    Signing Out…
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                         strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    Sign Out
                  </>
                )}
              </span>
            </button>

          </div>
        </section>

        {/* ── Favorites section ─────────────────────────────── */}
        <section className="profile-favorites" aria-label="My favorites">
          <div className="profile-section-header">
            <h2 className="profile-section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                   strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              My Favorites
            </h2>
            <span className="profile-section-count" aria-live="polite">
              {favorites.length} {favorites.length === 1 ? "title" : "titles"}
            </span>
          </div>

          {favorites.length === 0 ? (
            <div className="profile-empty" role="status">
              <div className="profile-empty-icon" aria-hidden="true">🎬</div>
              <p className="profile-empty-title">No favorites yet</p>
              <p className="profile-empty-text">
                Browse movies and TV shows and add them to your favorites!
              </p>
              <Link to="/movies_shows" className="profile-browse-btn">
                Browse Content
              </Link>
            </div>
          ) : (
            <ul className="profile-fav-grid" role="list">
              {favorites.map((item) => {
                const isTV       = (item.media_type || "movie") === "tv";
                const detailPath = isTV ? `/tv/${item.id}` : `/movie/${item.id}`;
                const poster     = item.poster_path
                  ? buildImageUrl(item.poster_path, "w500", PLACEHOLDER)
                  : PLACEHOLDER;
                const title  = item.title || item.name || "Untitled";
                const rating = item.vote_average != null
                  ? Number(item.vote_average).toFixed(1) : null;
                const rawDate = item.release_date || item.first_air_date;
                const year    = rawDate ? String(rawDate).slice(0, 4) : null;

                return (
                  <li
                    className="profile-fav-card"
                    key={`${item.media_type ?? "movie"}-${item.id}`}
                  >
                    <Link to={detailPath} className="profile-fav-poster-link" aria-label={title}>
                      <img
                        src={poster}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="profile-fav-poster"
                        onError={(e) => { e.currentTarget.src = PLACEHOLDER; }}
                      />
                      <div className="profile-fav-overlay" aria-hidden="true">
                        <span className="profile-fav-badge">{isTV ? "TV" : "Movie"}</span>
                        {rating && <span className="profile-fav-rating">★ {rating}</span>}
                      </div>
                    </Link>

                    <div className="profile-fav-info">
                      <Link to={detailPath} className="profile-fav-title" title={title}>
                        {title}
                      </Link>
                      {year && <span className="profile-fav-year">{year}</span>}
                    </div>

                    <button
                      className="profile-fav-remove"
                      onClick={() => handleRemoveFav(item.id, item.media_type)}
                      aria-label={`Remove ${title} from favorites`}
                      title="Remove from favorites"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

      </main>
    </div>
  );
}