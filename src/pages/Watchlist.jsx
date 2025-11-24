import React, { useEffect, useState } from "react";
import MyNavbar from "../components/Homesection/Navbar/MyNavbar.jsx";
import { getFavorites, removeFavorite, buildImageUrl } from "../utils/helpers";
import { Link } from "react-router-dom";
import "./Watchlist.css";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWatchlist as removeFromWatchlistAction, setWatchlist } from "../store/watchlistSlice";

export default function Watchlist() {
  const storeItems = useSelector((s) => s.watchlist?.items || []);
  const dispatch = useDispatch();
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // ensure store is in sync with localStorage at mount
    const favs = getFavorites() || [];
    dispatch(setWatchlist(favs));

    const onStorage = (e) => {
      if (e.key === null || e.key === undefined || e.key === "myapp.favorites.v1") {
        dispatch(setWatchlist(getFavorites() || []));
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites:change", () => dispatch(setWatchlist(getFavorites() || [])));
    return () => {
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = (id, media_type) => {
    const ok = removeFavorite(id, media_type || "movie");
    if (ok) {
      dispatch(removeFromWatchlistAction({ id, media_type }));
      try { window.dispatchEvent(new Event('favorites:change')); } catch (err) { console.debug('dispatch error', err); }
      try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `Removed from Watchlist`, type: 'info' } })); } catch (err) { console.debug('toast dispatch error', err); }
    }
  };

  const filtered = storeItems.filter((it) => {
    if (filter === "movies") return (it.media_type || "movie") === "movie";
    if (filter === "tv") return (it.media_type || "movie") === "tv";
    return true;
  });

  return (
    <div>
      <MyNavbar />
      <main className="watchlist-main">
        <h2 className="watchlist-title">Watchlist</h2>

        <div className="watchlist-filters">
          <button
            onClick={() => setFilter("all")}
            className={`watchlist-filter-btn ${filter === "all" ? "active" : ""}`}
            aria-pressed={filter === "all"}
          >
            All
          </button>
          <button
            onClick={() => setFilter("movies")}
            className={`watchlist-filter-btn ${filter === "movies" ? "active" : ""}`}
            aria-pressed={filter === "movies"}
          >
            Movies
          </button>
          <button
            onClick={() => setFilter("tv")}
            className={`watchlist-filter-btn ${filter === "tv" ? "active" : ""}`}
            aria-pressed={filter === "tv"}
          >
            TV Series
          </button>
        </div>

        {filtered.length === 0 ? (
          <p className="watchlist-empty">No items in your watchlist.</p>
        ) : (
          <div className="watchlist-grid">
            {filtered.map((it) => (
              <div 
                className="watchlist-card" 
                key={`${it.media_type}-${it.id}`}
                data-type={it.media_type === "tv" ? "TV Series" : "Movie"}
              >
                <Link to={it.media_type === "tv" ? `/tv/${it.id}` : `/movie/${it.id}`}>
                  <img
                    src={
                      it.poster_path
                        ? buildImageUrl(it.poster_path, "w500", "https://via.placeholder.com/200x300?text=No+Image")
                        : (it.posterUrl || "https://via.placeholder.com/200x300?text=No+Image")
                    }
                    alt={it.title || it.name || "No title"}
                    loading="lazy"
                    className="watchlist-card-img"
                  />
                </Link>
                <div className="watchlist-card-body">
                  <Link to={it.media_type === "tv" ? `/tv/${it.id}` : `/movie/${it.id}`} className="watchlist-card-title">
                    {it.title}
                  </Link>
                  <div className="watchlist-card-info">
                    <strong>Rating:</strong> {it.vote_average != null ? it.vote_average : "N/A"}
                  </div>
                  <div className="watchlist-card-info">
                    <button 
                      className="watchlist-remove-btn" 
                      onClick={() => handleRemove(it.id, it.media_type)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}