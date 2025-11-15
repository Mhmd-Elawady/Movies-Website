import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IoIosSearch, IoIosClose } from "react-icons/io";
import {
  apiClient,
  normalizeMovie,
  normalizeTV,
  buildImageUrl,
} from "../../../services/tmdb";
import { parseNumericId } from "../../../utils/helpers";
import "./SearchDropdown.css";

export default function SearchDropdown() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // إغلاق عند النقر خارج المكون
  useEffect(() => {
    function handleDocClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // بحث عند تغيير الاستعلام
  useEffect(() => {
    if (!query || query.trim().length === 0) {
      setResults([]);
      setShowResults(false);
      setLoading(false);
      setError(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) {
        if (typeof abortRef.current.abort === "function")
          abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get("/search/multi", {
          params: { query: query.trim(), page: 1 },
          signal: controller.signal,
        });

        const items = Array.isArray(data.results) ? data.results : [];

        const normalized = items.map((raw) => {
          const media =
            raw.media_type || (raw.title ? "movie" : raw.name ? "tv" : "movie");
          if (media === "movie") {
            const m = normalizeMovie(raw || {});
            return { ...m, media_type: media };
          }
          const t = normalizeTV(raw || {});
          return { ...t, media_type: media };
        });

        setResults(normalized.slice(0, 8));
        setShowResults(true);
        setActiveIndex(-1);
      } catch (err) {
        if (
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED" ||
          err?.name === "AbortError"
        ) {
          // ignore
        } else {
          console.error("Search error", err);
          setError("Search failed");
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback(
    (item) => {
      if (!item) return;
      const id = parseNumericId(item.id);
      if (!id) return;
      const route = item.media_type === "tv" ? `/tv/${id}` : `/movie/${id}`;
      setShowResults(false);
      setQuery("");
      setResults([]);
      navigate(route);
    },
    [navigate]
  );

  // التنقل باستخدام لوحة المفاتيح
  const handleKeyDown = useCallback(
    (e) => {
      if (!showResults) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && results[activeIndex]) {
          e.preventDefault();
          handleSelect(results[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setShowResults(false);
      }
    },
    [showResults, results, activeIndex, handleSelect]
  );

  const clearSearch = () => {
    setQuery("");
    setShowResults(false);
    setResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className="search-container">
      <div className="search-bar">
        <IoIosSearch className="search-icon" size={18} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search movies & TV..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
          className="search-input"
        />
        {query && (
          <button className="clear-btn" onClick={clearSearch}>
            <IoIosClose size={20} />
          </button>
        )}
      </div>

      {/* نتائج البحث */}
      {showResults && (
        <div className="search-results">
          {loading && (
            <div className="search-loading">Searching...</div>
          )}
          
          {!loading && error && (
            <div className="search-error">{error}</div>
          )}
          
          {!loading && !error && results.length === 0 && (
            <div className="no-results">
              No results for "{query}"
            </div>
          )}

          {!loading &&
            !error &&
            results.map((item, idx) => (
              <div
                key={`${item.media_type}-${item.id}`}
                className={`result-item ${activeIndex === idx ? "active" : ""}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(idx)}
              >
                <img
                  src={item.posterUrl || buildImageUrl(item.poster_path, "w92")}
                  alt={item.title || item.name || "Poster"}
                  className="poster"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/40x60/1a1a1a/666666?text=No+Image";
                  }}
                />
                <div className="item-info">
                  <div className="title">
                    {item.title || item.name || "Untitled"}
                  </div>
                  <div className="meta">
                    <span className="year">
                      {item.release_date || item.first_air_date
                        ? (item.release_date || item.first_air_date).slice(0, 4)
                        : "Unknown"}
                    </span>
                    <span className="type">
                      {item.media_type === "tv" ? "TV" : "Movie"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}