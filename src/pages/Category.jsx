import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import MyNavbar from '../components/Homesection/Navbar/MyNavbar';
import Footer from '../components/Homesection/FooterHero/Footer';
import { apiClient } from '../services/tmdb';
import { buildImageUrl, formatRating, getYearFromDate } from '../utils/helpers';
import './Category.css';

const CATEGORIES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 10402, name: 'Music' },
];

export default function Category() {
  const { name } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categoryName = String(name || '').toLowerCase();
  const category = CATEGORIES.find((c) => c.name.toLowerCase() === categoryName);

  const fetchCategory = useCallback(async (catId, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [moviesRes, tvRes] = await Promise.allSettled([
        apiClient.get(`/discover/movie`, { 
          params: { 
            with_genres: catId, 
            sort_by: 'popularity.desc', 
            page: page,
            'vote_count.gte': 10 
          } 
        }),
        apiClient.get(`/discover/tv`, { 
          params: { 
            with_genres: catId, 
            sort_by: 'popularity.desc', 
            page: page 
          } 
        }),
      ]);

      let movies = [];
      let tv = [];

      if (moviesRes.status === 'fulfilled' && Array.isArray(moviesRes.value.data?.results)) {
        movies = moviesRes.value.data.results;
        setTotalPages(Math.min(moviesRes.value.data.total_pages, 10));
      }

      if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value.data?.results)) {
        tv = tvRes.value.data.results;
      }

      const merged = [];
      
      movies.forEach((m) => {
        if (m.poster_path) {
          merged.push({
            id: m.id,
            title: m.title || m.name,
            poster_path: m.poster_path,
            vote_average: m.vote_average,
            rating: formatRating(m.vote_average),
            year: getYearFromDate(m.release_date),
            media_type: 'movie',
            popularity: m.popularity || 0
          });
        }
      });
      
      tv.forEach((t) => {
        if (t.poster_path) {
          merged.push({
            id: t.id,
            title: t.name || t.title,
            poster_path: t.poster_path,
            vote_average: t.vote_average,
            rating: formatRating(t.vote_average),
            year: getYearFromDate(t.first_air_date),
            number_of_seasons: t.number_of_seasons,
            media_type: 'tv',
            popularity: t.popularity || 0
          });
        }
      });

      // Sort by popularity and remove duplicates
      const uniqueItems = merged
        .filter((item, index, self) => 
          index === self.findIndex((t) => t.id === item.id && t.media_type === item.media_type)
        )
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 40);

      if (page === 1) {
        setItems(uniqueItems);
      } else {
        setItems(prev => [...prev, ...uniqueItems]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!category) {
      setError('Category not found');
      setLoading(false);
      return;
    }
    setCurrentPage(1);
    setItems([]);
    fetchCategory(category.id, 1);
  }, [category, fetchCategory]);

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchCategory(category.id, nextPage);
    }
  };

  if (!category) {
    return (
      <div>
        <MyNavbar />
        <div className="error-container">
          <h1>Category Not Found</h1>
          <p>The category "{name}" doesn't exist.</p>
          <Link to="/" className="back-home">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="category-page-wrapper">
      <MyNavbar />
      <main className="category-page">
        <div className="category-hero">
          <div className="category-header">
            <h1 className="category-title">{category.name}</h1>
            <p className="category-description">
              Discover the best {category.name.toLowerCase()} movies and TV shows
            </p>
            <div className="category-stats">
              <span className="stat">{items.length} Items</span>
              <span className="stat">Popular Content</span>
            </div>
          </div>
        </div>

        {loading && items.length === 0 && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading amazing {category.name.toLowerCase()} content...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => fetchCategory(category.id)} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="category-grid">
              {items.map((it) => (
                <Link 
                  key={`${it.media_type}-${it.id}`} 
                  to={it.media_type === 'tv' ? `/tv/${it.id}` : `/movie/${it.id}`} 
                  className="category-card-item"
                >
                  <div className="card-badge">
                    {it.media_type === 'tv' ? 'TV' : 'Movie'}
                  </div>
                  <div className="thumb">
                    <img
                      src={buildImageUrl(it.poster_path, 'w500')}
                      alt={it.title}
                      loading="lazy"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/300x450/1a1a1a/ffffff?text=No+Image'; 
                      }}
                    />
                    <div className="card-overlay">
                      <div className="overlay-content">
                        <span className="view-details">View Details</span>
                        <div className="rating-bubble">
                          ⭐ {it.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="meta">
                    <h3 className="title">{it.title}</h3>
                    <div className="meta-row">
                      <span className="rating">{it.rating || 'N/A'}</span>
                      <span className="year">{it.year || 'TBA'}</span>
                      {it.media_type === 'tv' && it.number_of_seasons != null && (
                        <span className="seasons">{it.number_of_seasons}S</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {currentPage < totalPages && (
              <div className="load-more-container">
                <button 
                  onClick={loadMore} 
                  className="load-more-btn"
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {!loading && items.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>No content found</h3>
            <p>We couldn't find any {category.name.toLowerCase()} content at the moment.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}