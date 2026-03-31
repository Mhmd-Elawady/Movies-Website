import React, { useEffect, useState } from "react";
import MyNavbar from "../Homesection/Navbar/MyNavbar.jsx";
import { getFavorites, removeFavorite, buildImageUrl } from "../../utils/helpers.js";
import { Link } from "react-router-dom";
import "./Watchlist.css";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWatchlist as removeFromWatchlistAction, setWatchlist } from "../../store/watchlistSlice.js";

export default function Watchlist() {
  const storeItems = useSelector((s) => s.watchlist?.items || []);
  const dispatch   = useDispatch();
  const [filter, setFilter] = useState("all");

  /* ── Sync store ↔ localStorage ── */
  useEffect(() => {
    const favs = getFavorites() || [];
    dispatch(setWatchlist(favs));

    const onStorage = (e) => {
      if (e.key === null || e.key === undefined || e.key === "myapp.favorites.v1") {
        dispatch(setWatchlist(getFavorites() || []));
      }
    };
    const onFavChange = () => dispatch(setWatchlist(getFavorites() || []));

    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites:change", onFavChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites:change", onFavChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Remove handler ── */
  const handleRemove = (id, media_type) => {
    const ok = removeFavorite(id, media_type || "movie");
    if (ok) {
      dispatch(removeFromWatchlistAction({ id, media_type }));
      try { window.dispatchEvent(new Event("favorites:change")); }
      catch (err) { console.debug("dispatch error", err); }
      try { window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Removed from Watchlist", type: "info" } })); }
      catch (err) { console.debug("toast dispatch error", err); }
    }
  };

  /* ── Filter ── */
  const filtered = storeItems.filter((it) => {
    if (filter === "movies") return (it.media_type || "movie") === "movie";
    if (filter === "tv")     return (it.media_type || "movie") === "tv";
    return true;
  });

  const counts = {
    all:    storeItems.length,
    movies: storeItems.filter(it => (it.media_type || "movie") === "movie").length,
    tv:     storeItems.filter(it => (it.media_type || "movie") === "tv").length,
  };

  return (
    <div>
      <MyNavbar />
      <main className="watchlist-main">

        {/* ── Header ── */}
        <div className="watchlist-header-block">
          <h2 className="watchlist-title">My Watchlist</h2>
          <p className="watchlist-subtitle">Your personal collection of movies & series</p>
        </div>

        {/* ── Filters ── */}
        <div className="watchlist-filters" role="group" aria-label="Filter watchlist">
          {[
            { key: "all",    label: "All"       },
            { key: "movies", label: "Movies"    },
            { key: "tv",     label: "TV Series" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`watchlist-filter-btn ${filter === key ? "active" : ""}`}
              aria-pressed={filter === key}
            >
              {label}
              {counts[key] > 0 && (
                <span style={{ marginLeft: "6px", opacity: 0.7 }}>
                  ({counts[key]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Count indicator ── */}
        {filtered.length > 0 && (
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div className="watchlist-count">
              Showing <span>{filtered.length}</span> title{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {filtered.length === 0 ? (
          <div className="watchlist-empty">
            <div className="watchlist-empty-icon">🎬</div>
            <p className="watchlist-empty-title">Nothing here yet</p>
            <p className="watchlist-empty-text">
              {filter === "all"
                ? "Start adding movies and TV shows to your watchlist."
                : `No ${filter === "movies" ? "movies" : "TV series"} in your watchlist yet.`}
            </p>
          </div>
        ) : (
          /* ── Grid ── */
          <div className="watchlist-grid">
            {filtered.map((it) => {
              const isTV       = (it.media_type || "movie") === "tv";
              const detailPath = isTV ? `/tv/${it.id}` : `/movie/${it.id}`;
              const poster     = it.poster_path
                ? buildImageUrl(it.poster_path, "w500", "https://via.placeholder.com/200x300?text=No+Image")
                : (it.posterUrl || "https://via.placeholder.com/200x300?text=No+Image");
              const rating     = it.vote_average != null ? Number(it.vote_average).toFixed(1) : null;
              const title      = it.title || it.name || "Untitled";
              const year       = it.release_date || it.first_air_date
                ? (it.release_date || it.first_air_date).slice(0, 4)
                : null;

              return (
                <div className="watchlist-card" key={`${it.media_type}-${it.id}`}>

                  {/* ── Image + Badges ── */}
                  <div className="watchlist-card-image-container">
                    <Link to={detailPath} tabIndex={-1} aria-hidden="true">
                      <img
                        src={poster}
                        alt={title}
                        loading="lazy"
                        className="watchlist-card-img"
                      />
                    </Link>

                    {/* Media type badge */}
                    <span className="watchlist-card-badge">
                      {isTV ? "Series" : "Movie"}
                    </span>

                    {/* Rating badge */}
                    {rating && (
                      <span className="watchlist-card-rating-badge">
                        ★ {rating}
                      </span>
                    )}
                  </div>

                  {/* ── Body ── */}
                  <div className="watchlist-card-body">
                    <Link to={detailPath} className="watchlist-card-title" title={title}>
                      {title}
                    </Link>

                    <div className="watchlist-card-meta">
                      {rating && (
                        <span className="watchlist-card-rating">★ {rating}</span>
                      )}
                      {year && (
                        <span className="watchlist-card-year">{year}</span>
                      )}
                    </div>

                    <button
                      className="watchlist-remove-btn"
                      onClick={() => handleRemove(it.id, it.media_type)}
                      aria-label={`Remove ${title} from watchlist`}
                    >
                      ✕ Remove
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}