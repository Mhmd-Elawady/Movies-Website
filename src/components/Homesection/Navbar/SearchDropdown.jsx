import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
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

// ── Constants ──────────────────────────────────────────────────────────────────
const DEBOUNCE_MS     = 300;
const MAX_RESULTS     = 8;
const MIN_QUERY_LEN   = 1;
const PLACEHOLDER_IMG = "https://via.placeholder.com/40x60/1a1a1a/555?text=N%2FA";

// ── Helpers ────────────────────────────────────────────────────────────────────
function normalizeItem(raw) {
  const media = raw.media_type || (raw.title ? "movie" : "tv");
  const base  = media === "movie" ? normalizeMovie(raw) : normalizeTV(raw);
  return { ...base, media_type: media };
}

function getPosterSrc(item) {
  return item.posterUrl || buildImageUrl(item.poster_path, "w92") || PLACEHOLDER_IMG;
}

function getYear(item) {
  const date = item.release_date || item.first_air_date || "";
  return date.slice(0, 4) || null;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function ResultItem({ item, isActive, onSelect, onHover }) {
  const year    = getYear(item);
  const isTV    = item.media_type === "tv";
  const title   = item.title || item.name || "Untitled";

  return (
    <div
      className={`result-item ${isActive ? "active" : ""}`}
      onClick={() => onSelect(item)}
      onMouseEnter={onHover}
      role="option"
      aria-selected={isActive}
      tabIndex={-1}
    >
      <img
        src={getPosterSrc(item)}
        alt=""
        aria-hidden="true"
        className="poster"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMG; }}
      />
      <div className="item-info">
        <div className="item-title" title={title}>{title}</div>
        <div className="item-meta">
          {year && <span className="year">{year}</span>}
          <span className={`badge-type ${isTV ? "badge-tv" : "badge-movie"}`}>
            {isTV ? "TV" : "Movie"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SearchDropdown() {
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const navigate      = useNavigate();
  const containerRef  = useRef(null);
  const inputRef      = useRef(null);
  const abortRef      = useRef(null);
  const debounceRef   = useRef(null);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    function onDocClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Search Effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LEN) {
      setResults([]);
      setShowResults(false);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      // Abort previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const { data } = await apiClient.get("/search/multi", {
          params: { query: trimmed, page: 1, include_adult: false },
          signal: controller.signal,
        });

        const items = Array.isArray(data?.results) ? data.results : [];
        // Filter out person results
        const normalized = items
          .filter((r) => r.media_type !== "person")
          .map(normalizeItem)
          .slice(0, MAX_RESULTS);

        setResults(normalized);
        setShowResults(normalized.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        // Ignore abort errors
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("[SearchDropdown] Search error:", err);
        setError("Search failed. Please try again.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // ── Navigate to item ───────────────────────────────────────────────────────
  const handleSelect = useCallback((item) => {
    if (!item) return;
    const id = parseNumericId(item.id);
    if (!id) return;
    const route = item.media_type === "tv" ? `/tv/${id}` : `/movie/${id}`;
    setShowResults(false);
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    navigate(route);
  }, [navigate]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!showResults) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (activeIndex >= 0) {
          e.preventDefault();
          handleSelect(results[activeIndex]);
        }
        break;
      case "Escape":
        setShowResults(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  }, [showResults, results, activeIndex, handleSelect]);

  // ── Clear ──────────────────────────────────────────────────────────────────
  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setShowResults(false);
    setActiveIndex(-1);
    setError(null);
    inputRef.current?.focus();
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────────
  const dropdownId  = "search-listbox";
  const hasContent  = showResults && (loading || error || results.length > 0 || query.trim().length >= MIN_QUERY_LEN);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`search-container ${showResults ? "open" : ""}`}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={showResults}
      aria-owns={dropdownId}
    >
      {/* Search Bar */}
      <div className={`search-bar ${loading ? "is-loading" : ""}`}>
        <IoIosSearch className="search-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          autoComplete="off"
          spellCheck="false"
          placeholder="Search movies & TV…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="search-input"
          aria-label="Search movies and TV shows"
          aria-autocomplete="list"
          aria-controls={dropdownId}
          aria-activedescendant={activeIndex >= 0 ? `result-${activeIndex}` : undefined}
        />
        {query && (
          <button
            className="clear-btn"
            onClick={clearSearch}
            aria-label="Clear search"
            type="button"
          >
            <IoIosClose aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showResults && (
        <div
          id={dropdownId}
          className="search-results"
          role="listbox"
          aria-label="Search results"
        >
          {loading && (
            <div className="state-message" role="status" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              Searching…
            </div>
          )}

          {!loading && error && (
            <div className="state-message state-error" role="alert">
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && query.trim().length >= MIN_QUERY_LEN && (
            <div className="state-message state-empty" role="status">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && !error && results.map((item, idx) => (
            <ResultItem
              key={`${item.media_type}-${item.id}`}
              item={item}
              isActive={activeIndex === idx}
              onSelect={handleSelect}
              onHover={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}