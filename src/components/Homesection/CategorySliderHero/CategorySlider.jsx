import React, { useEffect, useState, useCallback, useRef } from "react";
import { apiClient } from "../../../services/tmdb";
import { buildImageUrl } from "../../../utils/helpers";
import { useNavigate } from "react-router-dom";
import "./CategorySlider.css";

const categories = [
  { id: 28,    name: "Action" },
  { id: 12,    name: "Adventure" },
  { id: 35,    name: "Comedy" },
  { id: 18,    name: "Drama" },
  { id: 27,    name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878,   name: "Sci-Fi" },
  { id: 53,    name: "Thriller" },
  { id: 16,    name: "Animation" },
  { id: 80,    name: "Crime" },
  { id: 99,    name: "Documentary" },
  { id: 10751, name: "Family" },
  { id: 14,    name: "Fantasy" },
  { id: 36,    name: "History" },
  { id: 10402, name: "Music" },
];

function getVisibleCards() {
  const w = window.innerWidth;
  if (w < 480)  return 1;
  if (w < 768)  return 2;
  if (w < 1024) return 3;
  return 4;
}

export default function CategorySlider() {
  const [moviesByCategory, setMoviesByCategory] = useState({});
  const [loading, setLoading]                   = useState(true);
  const [currentIndex, setCurrentIndex]         = useState(0);
  const [visibleCards, setVisibleCards]         = useState(getVisibleCards);

  const navigate        = useNavigate();
  const categoriesCache = useRef(new Map());

  /* ── Responsive resize ── */
  useEffect(() => {
    const onResize = () => {
      const next = getVisibleCards();
      setVisibleCards(next);
      setCurrentIndex((prev) => {
        const max = Math.max(0, categories.length - next);
        return Math.min(prev, max);
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── Fetch ── */
  const fetchMovies = useCallback(async (signal) => {
    try {
      setLoading(true);

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
        if (categoriesCache.current.has(cat.id)) {
          return { [cat.id]: categoriesCache.current.get(cat.id) };
        }
        try {
          const { data } = await apiClient.get(`/discover/movie`, {
            params: { with_genres: cat.id, sort_by: "popularity.desc", page: 1 },
            signal,
          });
          const slice = (data.results || []).slice(0, 4);
          categoriesCache.current.set(cat.id, slice);
          return { [cat.id]: slice };
        } catch (error) {
          const isCanceled =
            error?.name === "CanceledError" ||
            error?.name === "AbortError" ||
            error?.code === "ERR_CANCELED" ||
            error?.message === "canceled";
          if (isCanceled) return { [cat.id]: [] };
          console.error(`Error fetching ${cat.name}`, error);
          categoriesCache.current.set(cat.id, []);
          return { [cat.id]: [] };
        }
      });

      const results    = await Promise.all(promises);
      const moviesData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
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
      if (!isCanceled) console.error("Category fetch error:", err);
    });
    return () => controller.abort();
  }, [fetchMovies]);

  /* ── Navigation ── */
  const maxIndex = Math.max(0, categories.length - visibleCards);
  const totalDots = Math.ceil(categories.length / visibleCards);
  const activeDot = Math.round(currentIndex / visibleCards);

  const handleNext = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  const handlePrev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));
  const goToSlide  = (index) =>
    setCurrentIndex(Math.min(index * visibleCards, maxIndex));

  const handleCategoryClick = (categoryName) =>
    navigate(`/category/${categoryName.toLowerCase()}`);

  const visibleCategories = categories.slice(
    currentIndex,
    currentIndex + visibleCards
  );

  return (
    <section className="category-slider" aria-label="Browse by category">
      {/* Header */}
      <div className="slider-header">
        <h2>
          Explore our wide variety of{" "}
          <em>categories</em>
        </h2>
        <p>
          Whether you're looking for a comedy to make you laugh, a drama to make
          you think, or a documentary to learn something new
        </p>
      </div>

      {/* Slider */}
      <div className="slider-wrapper">
        <button
          className="slider-arrow slider-arrow-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous categories"
        >
          ‹
        </button>

        <div
          className="slider-container"
          style={{ "--visible": visibleCards }}
          aria-live="polite"
          aria-atomic="true"
        >
          {visibleCategories.map((cat) => (
            <div
              className="category-card"
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              role="button"
              tabIndex={0}
              aria-label={`Browse ${cat.name} movies`}
              onKeyDown={(e) => e.key === "Enter" && handleCategoryClick(cat.name)}
            >
              {/* 2×2 poster grid */}
              <div className="images-grid" aria-hidden="true">
                {loading
                  ? Array(4).fill(0).map((_, i) => (
                      <div key={i} className="loading-cell" />
                    ))
                  : moviesByCategory[cat.id]?.map((movie, i) => (
                      <button
                        key={movie.id || i}
                        type="button"
                        className="category-thumb"
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            const id = movie.id || movie.movie_id;
                            const mediaType =
                              movie.media_type ||
                              (movie.title ? "movie" : "tv");
                            if (id)
                              navigate(
                                mediaType === "tv"
                                  ? `/tv/${id}`
                                  : `/movie/${id}`
                              );
                          } catch (err) {
                            console.debug("Navigation error", err);
                          }
                        }}
                        aria-label={movie.title || movie.name || "Open details"}
                        title={movie.title || movie.name || ""}
                        tabIndex={-1}
                      >
                        <img
                          src={
                            movie?.poster_path
                              ? buildImageUrl(movie.poster_path, "w300")
                              : "https://via.placeholder.com/300x450/111214/333?text=+"
                          }
                          alt={movie.title || movie.name || "Movie poster"}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const fb =
                              "https://via.placeholder.com/300x450/111214/333?text=+";
                            if (e.target.src !== fb) e.target.src = fb;
                          }}
                        />
                      </button>
                    ))}
              </div>

              {/* Footer label */}
              <div className="category-footer">
                <span>{cat.name}</span>
                <span className="arrow" aria-hidden="true">→</span>
              </div>
            </div>
          ))}
        </div>

        <button
          className="slider-arrow slider-arrow-next"
          onClick={handleNext}
          disabled={currentIndex >= maxIndex}
          aria-label="Next categories"
        >
          ›
        </button>
      </div>

      {/* Dots */}
      <div className="slider-dots" role="tablist" aria-label="Category pages">
        {Array.from({ length: totalDots }).map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${activeDot === index ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            role="tab"
            aria-selected={activeDot === index}
            aria-label={`Page ${index + 1} of ${totalDots}`}
          />
        ))}
      </div>
    </section>
  );
}