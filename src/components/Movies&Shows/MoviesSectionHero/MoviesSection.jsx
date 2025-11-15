import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  memo,
} from "react";
import { useNavigate } from "react-router-dom";
import { TiArrowRight, TiArrowLeft } from "react-icons/ti";
import { HiPlusSm } from "react-icons/hi";
import { FaStar, FaClock } from "react-icons/fa";
import { fetchMoviesByCategory } from "../../../services/fetchMoviesByCategory";
import { parseNumericId, addFavorite, getFavorites } from "../../../utils/helpers";
import { useDispatch } from "react-redux";
import { addToWatchlist as addToWatchlistAction } from "../../../store/watchlistSlice";
import { fetchTVShowsByCategory } from "../../../services/fetchTVShowsByCategory";

import "./MoviesSection.css";

// Memoized Row component
const Row = memo(function Row({
  title,
  items,
  isLoading,
  showAllButton = false,
  isTVShow = false,
}) {
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [favoritedIds, setFavoritedIds] = useState(() => {
    try {
      return new Set((getFavorites() || []).map((f) => Number(f.id)));
    } catch (err) {
      console.debug('getFavorites parse error', err);
      return new Set();
    }
  });

  // Smooth scroll handler
  const handleScroll = useCallback((direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = container.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount);

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  }, []);

  // Add to watchlist handler
  const handleAddToWatchlist = useCallback((item, event) => {
    event.stopPropagation();
    event.preventDefault();
    
    try {
      const rawId = item.id || item.movieId || item.tvShowId;
      const itemId = parseNumericId(rawId);
      if (!itemId) return;

      const media_type = isTVShow ? "tv" : "movie";
      const toAdd = {
        id: itemId,
        title: item.title || item.name || "",
        poster_path: item.img || item.poster_path || null,
        vote_average: item.rating != null ? Number(item.rating) : null,
        release_date: item.release_date || item.year || null,
        media_type,
      };

      const ok = addFavorite(toAdd);
      if (ok) {
        setFavoritedIds((prev) => new Set([...prev, itemId]));
        dispatch(addToWatchlistAction(toAdd));
        
        // Update storage and notify
        try {
          localStorage.setItem("myapp.favorites.v1", JSON.stringify(getFavorites()));
          window.dispatchEvent(new Event("favorites:change"));
          window.dispatchEvent(new CustomEvent('app:toast', { 
            detail: { 
              message: `${toAdd.title || 'Item'} added to Watchlist`, 
              type: 'success' 
            } 
          }));
        } catch (err) {
          console.debug('Storage or dispatch error', err);
        }
      }
    } catch (err) {
      console.error("Failed to add to watchlist", err);
    }
  }, [isTVShow, dispatch]);

  // Card click handler
  const handleCardClick = useCallback((item) => {
    if (!item) return;
    
    const rawId = item.id || item.movieId || item.tvShowId;
    const itemId = parseNumericId(rawId);
    if (!itemId) return;

    const route = isTVShow ? `/tv/${itemId}` : `/movie/${itemId}`;
    navigate(route);
  }, [navigate, isTVShow]);

  // Parse episodes info
  const parseEpisodesInfo = useCallback((episodesText) => {
    if (!episodesText) return { seasons: "", episodes: "" };
    const parts = episodesText.split("•");
    return {
      seasons: parts[0]?.trim() || "",
      episodes: parts[1]?.trim() || "",
    };
  }, []);

  // Memoize processed items
  const memoizedItems = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return [];
    
    const seen = new Set();
    return items.filter((item) => {
      const itemId = item?.id || item?.movieId || item?.tvShowId;
      return item && itemId && !seen.has(itemId) && seen.add(itemId);
    });
  }, [items]);

  // Image error handler
  const handleImageError = useCallback((e) => {
    const fallback = "https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image";
    if (e.target.src !== fallback && !e.target.dataset.fallbackSet) {
      e.target.src = fallback;
      e.target.dataset.fallbackSet = "true";
    }
  }, []);

  // Image load handler
  const handleImageLoad = useCallback((e) => {
    if (e.target.dataset.fallbackSet) {
      delete e.target.dataset.fallbackSet;
    }
  }, []);

  return (
    <div className="row-section">
      <div className="row-header">
        <h3>{title}</h3>
        <div className="row-buttons">
          <button
            onClick={() => handleScroll("left")}
            aria-label={`Scroll ${title} left`}
          >
            <TiArrowLeft size={20} />
          </button>
          <button
            onClick={() => handleScroll("right")}
            aria-label={`Scroll ${title} right`}
          >
            <TiArrowRight size={20} />
          </button>
          {showAllButton && (
            <button aria-label={`Show all ${title}`}>
              <HiPlusSm size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="row-cards" ref={scrollContainerRef}>
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <div key={`loading-${index}`} className="card loading">
              <div className="image-placeholder"></div>
              <div className="text-placeholder"></div>
              <div className="text-placeholder"></div>
            </div>
          ))
        ) : memoizedItems.length > 0 ? (
          memoizedItems.map((item) => {
            const itemId = item?.id || item?.movieId || item?.tvShowId;
            if (!item || !itemId) return null;

            const episodesInfo = item.episodes ? parseEpisodesInfo(item.episodes) : { seasons: "", episodes: "" };
            const isAdded = favoritedIds.has(Number(itemId));

            return (
              <div
                key={itemId}
                className="card"
                onClick={() => handleCardClick(item)}
                style={{ cursor: "pointer" }}
              >
                <div className="card-image-container">
                  <img
                    src={item.img || "https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image"}
                    alt={item.title || "Media"}
                    loading="lazy"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                  />
                  <div className="card-overlay"></div>
                  <div className="card-badge">
                    {isTVShow
                      ? "TV"
                      : item.rating && item.rating !== "N/A"
                      ? `${item.rating}/10`
                      : "NEW"}
                  </div>
                  <button
                    className={`add-to-watchlist ${isAdded ? "added" : ""}`}
                    onClick={(e) => handleAddToWatchlist(item, e)}
                    aria-label={`Add ${item.title} to watchlist`}
                    title={isAdded ? "Added" : "Add to watchlist"}
                  >
                    {isAdded ? (
                      <span style={{ fontSize: 12 }}>✓</span>
                    ) : (
                      <HiPlusSm size={16} />
                    )}
                  </button>
                </div>

                <div className="card-content">
                  <h4 className="card-title" title={item.title}>
                    {item.title}
                  </h4>

                  {isTVShow ? (
                    <div className="card-meta compact">
                      <div className="compact-meta-row">
                        <div className="rating-compact">
                          <FaStar size={10} />
                          <span>{item.rating || "N/A"}</span>
                        </div>
                        {episodesInfo.seasons && (
                          <div className="episodes-info">
                            <span className="seasons">{episodesInfo.seasons}</span>
                            {episodesInfo.episodes && (
                              <>
                                <span className="separator">•</span>
                                <span className="episodes">{episodesInfo.episodes}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="compact-meta-row">
                        <span className="year">{item.year || "Unknown"}</span>
                        <span className="genre">{item.genre || "TV Show"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="card-meta">
                      <div className="meta-row">
                        <div className="rating">
                          <FaStar size={12} />
                          <span>{item.rating || "N/A"}</span>
                        </div>
                        <div className="duration">
                          <FaClock size={12} />
                          <span>{item.duration || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="meta-row">
                        <span className="year">{item.year || "Unknown"}</span>
                        <span className="genre">{item.genre || "Movie"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-movies">
            <p>No {isTVShow ? "TV shows" : "movies"} available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
});

// Main component
export default function MoviesSection() {
  const [contentType, setContentType] = useState("movies");
  const [activeTab, setActiveTab] = useState("all");
  const [moviesData, setMoviesData] = useState({
    genres: [],
    trending: [],
    newReleases: [],
    mustWatch: [],
  });
  const [tvShowsData, setTvShowsData] = useState({
    genres: [],
    trending: [],
    newReleases: [],
    mustWatch: [],
  });
  const [loading, setLoading] = useState({
    movies: {
      genres: true,
      trending: true,
      newReleases: true,
      mustWatch: true,
    },
    tvshows: {
      genres: true,
      trending: true,
      newReleases: true,
      mustWatch: true,
    },
  });
  const [error, setError] = useState("");

  const navRef = useRef(null);
  const indicatorRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  // Tabs configuration
  const tabsConfig = {
    movies: [
      { id: "all", label: "All Movies" },
      { id: "trending", label: "Trending" },
      { id: "new", label: "New Releases" },
      { id: "genres", label: "Genres" },
      { id: "top", label: "Top Rated" },
    ],
    tvshows: [
      { id: "all", label: "All TV Shows" },
      { id: "trending", label: "Trending" },
      { id: "new", label: "New Releases" },
      { id: "genres", label: "Genres" },
      { id: "top", label: "Top Rated" },
    ],
  };

  // Update active indicator
  useEffect(() => {
    const updateActiveIndicator = () => {
      const activeElement = navRef.current?.querySelector(".nav-tab.active");
      const indicator = indicatorRef.current;

      if (activeElement && indicator) {
        const { offsetLeft, offsetWidth } = activeElement;
        indicator.style.width = `${offsetWidth}px`;
        indicator.style.left = `${offsetLeft}px`;
      }
    };

    updateActiveIndicator();

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = setTimeout(updateActiveIndicator, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [activeTab, contentType]);

  // Data processing functions
  const processMediaData = useCallback((data, isTVShow = false) => {
    if (!Array.isArray(data) || data.length === 0) return [];

    const seen = new Set();
    return data
      .filter((item) => {
        const itemId = item.id || (isTVShow ? item.tvShowId : item.movieId);
        return item && itemId && !seen.has(itemId) && seen.add(itemId);
      })
      .slice(0, 100)
      .map((item) => ({
        ...item,
        id: item.id || (isTVShow ? item.tvShowId : item.movieId),
        rating: item.rating || "N/A",
        duration: item.duration || "Unknown",
        episodes: item.episodes || "Unknown",
        year: item.year || "Unknown",
        genre: item.genre || (isTVShow ? "TV Show" : "Movie"),
        type: isTVShow ? "tvshow" : "movie",
      }));
  }, []);

  // Data loading functions
  const loadMoviesData = useCallback(async (signal) => {
    try {
      setError("");

      const [genres, trending, newReleases, mustWatch] = await Promise.allSettled([
        fetchMoviesByCategory("genres", signal),
        fetchMoviesByCategory("trending", signal),
        fetchMoviesByCategory("newReleases", signal),
        fetchMoviesByCategory("mustWatch", signal),
      ]).then((results) =>
        results.map((result) => (result.status === "fulfilled" ? result.value : []))
      );

      setMoviesData({
        genres: processMediaData(genres),
        trending: processMediaData(trending),
        newReleases: processMediaData(newReleases),
        mustWatch: processMediaData(mustWatch),
      });

      setLoading(prev => ({
        ...prev,
        movies: { genres: false, trending: false, newReleases: false, mustWatch: false }
      }));
    } catch (error) {
      console.error("Error loading movies data:", error);
      setError("Failed to load movies data.");
      setLoading(prev => ({
        ...prev,
        movies: { genres: false, trending: false, newReleases: false, mustWatch: false }
      }));
    }
  }, [processMediaData]);

  const loadTVShowsData = useCallback(async (signal) => {
    try {
      setError("");

      const [genres, trending, newReleases, mustWatch] = await Promise.allSettled([
        fetchTVShowsByCategory("genres", signal),
        fetchTVShowsByCategory("trending", signal),
        fetchTVShowsByCategory("newReleases", signal),
        fetchTVShowsByCategory("mustWatch", signal),
      ]).then((results) =>
        results.map((result) => (result.status === "fulfilled" ? result.value : []))
      );

      setTvShowsData({
        genres: processMediaData(genres, true),
        trending: processMediaData(trending, true),
        newReleases: processMediaData(newReleases, true),
        mustWatch: processMediaData(mustWatch, true),
      });

      setLoading(prev => ({
        ...prev,
        tvshows: { genres: false, trending: false, newReleases: false, mustWatch: false }
      }));
    } catch (error) {
      console.error("Error loading TV shows data:", error);
      setError("Failed to load TV shows data.");
      setLoading(prev => ({
        ...prev,
        tvshows: { genres: false, trending: false, newReleases: false, mustWatch: false }
      }));
    }
  }, [processMediaData]);

  // Initial data load
  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      try {
        await Promise.all([
          loadMoviesData(controller.signal),
          loadTVShowsData(controller.signal),
        ]);
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.error("Error loading data:", err);
      }
    };

    loadData();

    return () => controller.abort();
  }, [loadMoviesData, loadTVShowsData]);

  // Filter functions
  const filterMediaByTab = useCallback((tabId, data) => {
    const { genres, trending, newReleases, mustWatch } = data;
    
    switch (tabId) {
      case "trending":
        return trending || [];
      case "new":
        return newReleases || [];
      case "genres":
        return genres || [];
      case "top": {
        const seen = new Set();
        const allMedia = [...(trending || []), ...(newReleases || []), ...(mustWatch || [])];
        return allMedia.filter((item) => {
          if (!item?.id) return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          const rating = parseFloat(item.rating);
          return !isNaN(rating) && rating >= 8.0;
        });
      }
      case "all":
      default: {
        const seen = new Set();
        const allMedia = [...(trending || []), ...(newReleases || []), ...(mustWatch || [])];
        return allMedia.filter((item) => item?.id && !seen.has(item.id) && seen.add(item.id));
      }
    }
  }, []);

  // Memoized filtered data
  const filteredMovies = useMemo(() => {
    if (Object.values(loading.movies).some(Boolean)) {
      return { trending: [], newReleases: [], mustWatch: [], genres: [] };
    }

    const filtered = filterMediaByTab(activeTab, moviesData);
    const shouldShow = (section) => activeTab === "all" || activeTab === section;

    return {
      trending: shouldShow("trending") ? filtered : [],
      newReleases: shouldShow("new") ? filtered : [],
      mustWatch: shouldShow("top") ? filtered : [],
      genres: shouldShow("genres") ? moviesData.genres : [],
    };
  }, [activeTab, moviesData, loading.movies, filterMediaByTab]);

  const filteredTVShows = useMemo(() => {
    if (Object.values(loading.tvshows).some(Boolean)) {
      return { trending: [], newReleases: [], mustWatch: [], genres: [] };
    }

    const filtered = filterMediaByTab(activeTab, tvShowsData);
    const shouldShow = (section) => activeTab === "all" || activeTab === section;

    return {
      trending: shouldShow("trending") ? filtered : [],
      newReleases: shouldShow("new") ? filtered : [],
      mustWatch: shouldShow("top") ? filtered : [],
      genres: shouldShow("genres") ? tvShowsData.genres : [],
    };
  }, [activeTab, tvShowsData, loading.tvshows, filterMediaByTab]);

  // Event handlers
  const handleTabClick = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleContentTypeToggle = useCallback((type) => {
    setContentType(type);
    setActiveTab("all");
  }, []);

  const handleRetry = useCallback(() => {
    const controller = new AbortController();
    
    if (contentType === "movies") {
      setLoading(prev => ({ ...prev, movies: { genres: true, trending: true, newReleases: true, mustWatch: true } }));
      loadMoviesData(controller.signal);
    } else {
      setLoading(prev => ({ ...prev, tvshows: { genres: true, trending: true, newReleases: true, mustWatch: true } }));
      loadTVShowsData(controller.signal);
    }

    return () => controller.abort();
  }, [contentType, loadMoviesData, loadTVShowsData]);

  // Section visibility
  const shouldShowSection = useCallback((section) => {
    const sectionMap = {
      genres: "genres",
      trending: "trending",
      newReleases: "new",
      mustWatch: "top",
    };
    return activeTab === "all" || activeTab === sectionMap[section];
  }, [activeTab]);

  const currentTabs = tabsConfig[contentType];
  const isMovies = contentType === "movies";
  const currentData = isMovies ? filteredMovies : filteredTVShows;
  const currentLoading = isMovies ? loading.movies : loading.tvshows;

  const hasNoData = Object.values(currentData).every(arr => arr.length === 0);
  const isLoading = Object.values(currentLoading).some(Boolean);

  return (
    <section className={`movies-section ${!isMovies ? "tv-shows-section" : ""}`}>
      <div className="section-header">
        <span className="section-title">
          {isMovies ? "Movies" : "TV Shows"}
        </span>

        <div className="content-toggle">
          <button
            className={`toggle-btn ${isMovies ? "active" : ""}`}
            onClick={() => handleContentTypeToggle("movies")}
          >
            Movies
          </button>
          <button
            className={`toggle-btn ${!isMovies ? "active" : ""}`}
            onClick={() => handleContentTypeToggle("tvshows")}
          >
            TV Shows
          </button>
          <div className="toggle-indicator"></div>
        </div>
      </div>

      <nav className="movies-navigation" ref={navRef}>
        {currentTabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabClick(tab.id)}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
        <div ref={indicatorRef} className="active-indicator" aria-hidden="true" />
      </nav>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button onClick={handleRetry} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      <div className={`content-area ${!isMovies ? "hidden" : ""}`}>
        {isMovies && (
          <>
            {shouldShowSection("genres") && (
              <Row
                title="Our Genres"
                items={filteredMovies.genres}
                isLoading={loading.movies.genres}
                showAllButton={true}
              />
            )}

            {shouldShowSection("genres") && filteredMovies.genres.length > 0 && (
              <Row
                title="Popular Top 10 in Genres"
                items={filteredMovies.genres.slice(0, 10)}
                isLoading={loading.movies.genres}
              />
            )}

            {shouldShowSection("trending") && (
              <Row
                title="Trending Now"
                items={filteredMovies.trending}
                isLoading={loading.movies.trending}
              />
            )}

            {shouldShowSection("newReleases") && (
              <Row
                title="New Releases"
                items={filteredMovies.newReleases}
                isLoading={loading.movies.newReleases}
              />
            )}

            {shouldShowSection("mustWatch") && (
              <Row
                title="Must-Watch Movies"
                items={filteredMovies.mustWatch}
                isLoading={loading.movies.mustWatch}
              />
            )}
          </>
        )}
      </div>

      <div className={`content-area ${isMovies ? "hidden" : ""}`}>
        {!isMovies && (
          <>
            {shouldShowSection("genres") && (
              <Row
                title="TV Show Genres"
                items={filteredTVShows.genres}
                isLoading={loading.tvshows.genres}
                showAllButton={true}
                isTVShow={true}
              />
            )}

            {shouldShowSection("genres") && filteredTVShows.genres.length > 0 && (
              <Row
                title="Popular Top 10 in Genres"
                items={filteredTVShows.genres.slice(0, 10)}
                isLoading={loading.tvshows.genres}
                isTVShow={true}
              />
            )}

            {shouldShowSection("trending") && (
              <Row
                title="Trending Now"
                items={filteredTVShows.trending}
                isLoading={loading.tvshows.trending}
                isTVShow={true}
              />
            )}

            {shouldShowSection("newReleases") && (
              <Row
                title="New Releases"
                items={filteredTVShows.newReleases}
                isLoading={loading.tvshows.newReleases}
                isTVShow={true}
              />
            )}

            {shouldShowSection("mustWatch") && (
              <Row
                title="Must-Watch TV Shows"
                items={filteredTVShows.mustWatch}
                isLoading={loading.tvshows.mustWatch}
                isTVShow={true}
              />
            )}
          </>
        )}
      </div>

      {hasNoData && !isLoading && (
        <div className="no-movies">
          <p>No {isMovies ? "movies" : "TV shows"} found in this category. Try another filter.</p>
        </div>
      )}
    </section>
  );
}