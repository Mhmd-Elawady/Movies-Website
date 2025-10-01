import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './CategorySlider.css'
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

  const imageBaseUrl = "https://image.tmdb.org/t/p/w500";
  const API_KEY = import.meta.env.VITE_ACCESS_TOKEN;

  // عدد الكروت اللي هتظهر في الشاشة
  const visibleCards = 4;

  // Fetch Movies
  const fetchMovies = useCallback(async () => {
    try {
      setLoading(true);
      
      const promises = categories.map(async (cat) => {
        try {
          const response = await axios.get(
            `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${cat.id}`
          );
          return { [cat.id]: response.data.results.slice(0, 4) };
        } catch (error) {
          console.error(`Error fetching ${cat.name}`, error);
          return { [cat.id]: [] };
        }
      });

      const results = await Promise.all(promises);
      const moviesData = results.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setMoviesByCategory(moviesData);
    } catch (error) {
      console.error("Overall error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, [API_KEY]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleCategoryClick = (categoryName) => {
    navigate(`/category/${categoryName.toLowerCase()}`);
  };

  // Slider Controls
  const handleNext = () => {
    const maxIndex = categories.length - visibleCards;
    if (currentIndex < maxIndex) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // الكروت اللي هتظهر حالياً
  const visibleCategories = categories.slice(currentIndex, currentIndex + visibleCards);

  return (
    <section className="category-slider">
      <div className="slider-header">
        <h2>Explore our wide variety of categories</h2>
        <p>
          Whether you're looking for a comedy to make you laugh, a drama to make you think,
          or a documentary to learn something new
        </p>
      </div>

      {/* Slider Container مع الأزرار */}
      <div className="slider-wrapper">
        <button 
          className="slider-arrow slider-arrow-prev"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          ‹
        </button>

        {/* الكروت اللي ظاهرة فقط */}
        <div className="slider-container" ref={sliderRef}>
          {visibleCategories.map((cat) => (
            <div
              className="category-card"
              key={cat.id}
              onClick={() => handleCategoryClick(cat.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleCategoryClick(cat.name)}
            >
              <div className="images-grid">
                {loading
                  ? Array(4)
                      .fill(0)
                      .map((_, i) => <div key={i} className="loading-cell" />)
                  : moviesByCategory[cat.id]?.map((movie, i) => (
                      <img
                        key={movie.id || i}
                        src={
                          movie.poster_path
                            ? imageBaseUrl + movie.poster_path
                            : "/placeholder-movie.jpg"
                        }
                        alt={movie.title || "Movie poster"}
                        loading="lazy"
                      />
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

      {/* النقاط للإرشاد */}
      <div className="slider-dots">
        {Array.from({ length: Math.ceil(categories.length / visibleCards) }).map((_, index) => (
          <button
            key={index}
            className={`slider-dot ${Math.floor(currentIndex / visibleCards) === index ? 'active' : ''}`}
            onClick={() => goToSlide(index * visibleCards)}
          />
        ))}
      </div>
    </section>
  );
}