import React, { useEffect, useState, useCallback, useRef } from "react";
import { apiClient } from "../../../services/tmdb";
import { buildImageUrl } from "../../../utils/helpers";
import { useNavigate } from "react-router-dom";
import "./CategorySlider.css";
const categories = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 35, name: "Comedy" },
  { id: 18, name: "Drama" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
  { id: 16, name: "Animation" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 10402, name: "Music" },
];

export default function CategorySlider() {
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // imageBaseUrl replaced by buildImageUrl usage

  // small in-memory cache to avoid re-fetching category grids during a session
  // keyed by category id -> array of movies
  const categoriesCache = useRef(new Map());

  const visibleCards = 4;

  const fetchMovies = useCallback(async (signal) => {
    try {
      setLoading(true);

      // Check if we have cached results for all categories
      const allCached = categories.every((cat) =>
        categoriesCache.current.has(cat.id)
      );
      if (allCached) {
        const cached = Object.fromEntries(
          categories.map((cat) => [cat.id, categoriesCache.current.get(cat.id)])
        );
        setMoviesByCategory(cached);
        setLoading(false);
        return;
      }

      const promises = categories.map(async (cat) => {
        // Skip if already cached
        if (categoriesCache.current.has(cat.id)) {
          return { [cat.id]: categoriesCache.current.get(cat.id) };
        }

        try {
          const { data } = await apiClient.get(`/discover/movie`, {
            params: {
              with_genres: cat.id,
              sort_by: "popularity.desc",
              page: 1,
            },
            signal,
          });
          const slice = (data.results || []).slice(0, 4);
          categoriesCache.current.set(cat.id, slice);
          return { [cat.id]: slice };
        } catch (error) {
          // Treat intentional cancellations/aborts as non-errors to avoid noisy logs
          const isCanceled =
            error?.name === "CanceledError" ||
            error?.name === "AbortError" ||
            error?.code === "ERR_CANCELED" ||
            error?.message === "canceled";
          if (isCanceled) {
            if (import.meta?.env?.DEV) {
              console.debug(`Fetch for category ${cat.name} was canceled`);
            }
            categoriesCache.current.set(cat.id, []);
            return { [cat.id]: [] };
          }

          console.error(`Error fetching ${cat.name}`, error);
          categoriesCache.current.set(cat.id, []);
          return { [cat.id]: [] };
        }
      });

      const results = await Promise.all(promises);
      const moviesData = results.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      );
      setMoviesByCategory(moviesData);
    } catch (error) {
      console.error("Overall error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchMovies(controller.signal).catch((err) => {
      const isCanceled =
        err?.name === "CanceledError" ||
        err?.name === "AbortError" ||
        err?.code === "ERR_CANCELED" ||
        err?.message === "canceled";
      if (isCanceled) {
        // request was canceled - ignore in production, debug in dev
        if (import.meta?.env?.DEV) console.debug("Category fetch canceled");
        return;
      }
      // log other errors
      console.error("Category fetch error:", err);
    });

    return () => {
      controller.abort();
    };
  }, [fetchMovies]);

  const handleCategoryClick = (categoryName) => {
    navigate(`/category/${categoryName.toLowerCase()}`);
  };

  const handleNext = () => {
    const maxIndex = categories.length - visibleCards;
    if (currentIndex < maxIndex) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const visibleCategories = categories.slice(
    currentIndex,
    currentIndex + visibleCards
  );

  return (
    <section className="category-slider">
      <div className="slider-header">
        <h2>Explore our wide variety of categories</h2>
        <p>
          Whether you're looking for a comedy to make you laugh, a drama to make
          you think, or a documentary to learn something new
        </p>
      </div>

      <div className="slider-wrapper">
        <button
          className="slider-arrow slider-arrow-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ‹
        </button>

        <div className="slider-container" ref={sliderRef}>
          {visibleCategories.map((cat) => (
            <div
              className="category-card"
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && handleCategoryClick(cat.name)
              }
            >
              <div className="images-grid">
                {loading
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => <div key={i} className="loading-cell" />)
                  : moviesByCategory[cat.id]?.map((movie, i) => (
                        <button
                          key={movie.id || i}
                          type="button"
                          className="category-thumb"
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              const id = movie.id || movie.movie_id;
                              const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
                              if (id) {
                                navigate(mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`);
                              }
                            } catch (err) {
                              console.debug('Navigation error', err);
                            }
                          }}
                          aria-label={movie.title || movie.name || 'Open details'}
                          title={movie.title || movie.name || ''}
                        >
                          <img
                            src={
                              movie?.poster_path
                                ? buildImageUrl(movie.poster_path, "w300")
                                : "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image"
                            }
                            alt={movie.title || movie.name || "Poster"}
                            loading="lazy"
                            onError={(e) => {
                              const fallback = "https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image";
                              if (e.target.src !== fallback) e.target.src = fallback;
                            }}
                          />
                        </button>
                      ))}
              </div>
              <div className="category-footer">
                <span>{cat.name}</span>
                <span className="arrow">→</span>
              </div>
            </div>
          ))}
        </div>

        <button
          className="slider-arrow slider-arrow-next"
          onClick={handleNext}
          disabled={currentIndex >= categories.length - visibleCards}
        >
          ›
        </button>
      </div>

      <div className="slider-dots">
        {Array.from({
          length: Math.ceil(categories.length / visibleCards),
        }).map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${
              Math.floor(currentIndex / visibleCards) === index ? "active" : ""
            }`}
            onClick={() => goToSlide(index * visibleCards)}
          />
        ))}
      </div>
    </section>
  );
}
