import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import MyNavbar from '../components/Homesection/Navbar/MyNavbar';
import Footer from '../components/Homesection/FooterHero/Footer';
import { apiClient } from '../services/tmdb';
import { buildImageUrl, formatRating, getYearFromDate } from '../utils/helpers';
import './Category.css';

const CATEGORIES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 35,    name: 'Comedy' },
  { id: 18,    name: 'Drama' },
  { id: 27,    name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 53,    name: 'Thriller' },
  { id: 16,    name: 'Animation' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 36,    name: 'History' },
  { id: 10402, name: 'Music' },
];

const PLACEHOLDER = 'https://via.placeholder.com/300x450/111318/333?text=+';

export default function Category() {
  const { name } = useParams();

  const [items, setItems]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const categoryName = String(name || '').toLowerCase();
  const category     = CATEGORIES.find((c) => c.name.toLowerCase() === categoryName);

  /* ── Fetch ── */
  const fetchCategory = useCallback(async (catId, page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const [moviesRes, tvRes] = await Promise.allSettled([
        apiClient.get('/discover/movie', {
          params: { with_genres: catId, sort_by: 'popularity.desc', page, 'vote_count.gte': 10 },
        }),
        apiClient.get('/discover/tv', {
          params: { with_genres: catId, sort_by: 'popularity.desc', page },
        }),
      ]);

      let movies = [];
      let tv     = [];

      if (moviesRes.status === 'fulfilled' && Array.isArray(moviesRes.value.data?.results)) {
        movies = moviesRes.value.data.results;
        setTotalPages(Math.min(moviesRes.value.data.total_pages || 1, 10));
      }

      if (tvRes.status === 'fulfilled' && Array.isArray(tvRes.value.data?.results)) {
        tv = tvRes.value.data.results;
      }

      const merged = [
        ...movies
          .filter((m) => m.poster_path)
          .map((m) => ({
            id:               m.id,
            title:            m.title || m.name,
            poster_path:      m.poster_path,
            vote_average:     m.vote_average,
            rating:           formatRating(m.vote_average),
            year:             getYearFromDate(m.release_date),
            media_type:       'movie',
            popularity:       m.popularity || 0,
          })),
        ...tv
          .filter((t) => t.poster_path)
          .map((t) => ({
            id:                t.id,
            title:             t.name || t.title,
            poster_path:       t.poster_path,
            vote_average:      t.vote_average,
            rating:            formatRating(t.vote_average),
            year:              getYearFromDate(t.first_air_date),
            number_of_seasons: t.number_of_seasons,
            media_type:        'tv',
            popularity:        t.popularity || 0,
          })),
      ];

      const unique = merged
        .filter((item, i, self) =>
          i === self.findIndex((x) => x.id === item.id && x.media_type === item.media_type)
        )
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 40);

      setItems((prev) => (page === 1 ? unique : [...prev, ...unique]));
    } catch (err) {
      setError(err?.message || 'Failed to load category');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!category) { setError('Category not found'); setLoading(false); return; }
    setCurrentPage(1);
    setItems([]);
    fetchCategory(category.id, 1);
  }, [category, fetchCategory]);

  const loadMore = () => {
    if (currentPage < totalPages && !loading) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchCategory(category.id, next);
    }
  };

  /* ── Category not found ── */
  if (!category) {
    return (
      <div className="category-page-wrapper">
        <MyNavbar />
        <div className="category-page">
          <div className="error-container" style={{ marginTop: '8rem' }}>
            <div className="error-icon">🎬</div>
            <h3>Category Not Found</h3>
            <p>The category "{name}" doesn't exist.</p>
            <Link to="/" className="back-home">Back to Home</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="category-page-wrapper">
      <MyNavbar />

      <main className="category-page">

        {/* ── Hero ── */}
        <div className="category-hero">
          <div className="category-header">
            {/* Eyebrow label — now an explicit element, NOT a CSS ::after pseudo */}
          

            <h1 className="category-title">{category.name}</h1>

            <p className="category-description">
              Discover the best {category.name.toLowerCase()} movies and TV shows
            </p>
            

            <div className="category-stats">
              {items.length > 0 && (
                <span className="stat">{items.length} titles</span>
              )}
              <span className="stat">Movies &amp; TV</span>
              <span className="stat">Sorted by popularity</span>
            </div>
          </div>
        </div>
  
        {/* ── Loading (initial) ── */}
        {loading && items.length === 0 && (
          <div className="loading-container" aria-live="polite" aria-busy="true">
            <div className="loading-spinner" role="status" aria-label="Loading" />
            <p>Loading {category.name.toLowerCase()} content…</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="error-container" role="alert">
            <div className="error-icon" aria-hidden="true">⚠️</div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => fetchCategory(category.id)}>
              Try Again
            </button>
          </div>
        )}

        {/* ── Grid ── */}
        {items.length > 0 && (
          <>
            <div className="category-grid" role="list" aria-label={`${category.name} titles`}>
              {items.map((it) => (
                <Link
                  key={`${it.media_type}-${it.id}`}
                  to={it.media_type === 'tv' ? `/tv/${it.id}` : `/movie/${it.id}`}
                  className="category-card-item"
                  role="listitem"
                  aria-label={`${it.title}${it.year ? `, ${it.year}` : ''}`}
                >
                  {/* Badge */}
                  <span className={`card-badge ${it.media_type === 'tv' ? 'card-badge-tv' : 'card-badge-movie'}`}>
                    {it.media_type === 'tv' ? 'TV' : 'Film'}
                  </span>

                  {/* Poster */}
                  <div className="thumb">
                    <img
                      src={buildImageUrl(it.poster_path, 'w500')}
                      alt={`${it.title} poster`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (e.target.src !== PLACEHOLDER) e.target.src = PLACEHOLDER;
                      }}
                    />
                    <div className="card-overlay" aria-hidden="true">
                      <div className="overlay-content">
                        <span className="view-details">View Details</span>
                        <span className="rating-bubble">★ {it.rating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="meta">
                    <h3 className="title">{it.title}</h3>
                    <div className="meta-row">
                      <span className="rating" aria-label={`Rating ${it.rating}`}>★ {it.rating || 'N/A'}</span>
                      {it.year && <span className="year">{it.year}</span>}
                      {it.media_type === 'tv' && it.number_of_seasons != null && (
                        <span className="seasons">{it.number_of_seasons}S</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Load more */}
            {currentPage < totalPages && (
              <div className="load-more-container">
                <button
                  className="load-more-btn"
                  onClick={loadMore}
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Empty ── */}
        {!loading && !error && items.length === 0 && (
          <div className="empty-state" role="status">
            <div className="empty-icon" aria-hidden="true">🎬</div>
            <h3>No content found</h3>
            <p>We couldn't find any {category.name.toLowerCase()} content right now.</p>
            <Link to="/" className="back-home">Back to Home</Link>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}