import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { FaStar, FaPlay, FaPlus, FaArrowLeft, FaCalendar, FaTimes, FaClock } from "react-icons/fa";
import useMovie from "../../../hooks/useMovie";
import { buildImageUrl, getYearFromDate, formatRating, isFavorited, addFavorite, removeFavorite } from "../../../utils/helpers";
import "./MovieDetail.css";
import Footer from "../../Homesection/FooterHero/Footer";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useMovie(id);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  // Data extraction
  const movie = useMemo(() => data?.movie || {}, [data?.movie]);
  const similar = data?.similar || [];
  const cast = data?.cast || [];
  const trailer = data?.trailer || null;

  // Image URLs
  const posterSrc = useMemo(
    () => buildImageUrl(movie.poster_path, "w500", "https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image"),
    [movie.poster_path]
  );

  const backdropSrc = useMemo(
    () => buildImageUrl(movie.backdrop_path, "original", "https://via.placeholder.com/1200x675/0f0f0f/333333?text=No+Backdrop"),
    [movie.backdrop_path]
  );

  // Formatted data
  const releaseYear = useMemo(() => getYearFromDate(movie.release_date), [movie.release_date]);
  const rating = useMemo(() => formatRating(movie.vote_average), [movie.vote_average]);

  // Trailer data
  const hasTrailerValue = useMemo(() => !!trailer?.key, [trailer]);
  const trailerUrl = useMemo(() => (trailer?.key ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null), [trailer]);

  // Event handlers
  const handlePlayTrailer = useCallback(() => {
    if (hasTrailerValue) setShowTrailer(true);
  }, [hasTrailerValue]);

  const toggleWatchlist = useCallback(() => {
    if (!movie.id) return;
    const alreadyInWatchlist = isFavorited(movie.id, movie.media_type || "movie");
    
    if (alreadyInWatchlist) {
      removeFavorite(movie.id, movie.media_type || "movie");
      setInWatchlist(false);
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Removed from Watchlist", type: "info" } }));
    } else {
      const favItem = { id: movie.id, title: movie.title || movie.name, poster_path: movie.poster_path, vote_average: movie.vote_average, release_date: movie.release_date || movie.first_air_date, media_type: movie.media_type || "movie" };
      addFavorite(favItem);
      setInWatchlist(true);
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Added to Watchlist", type: "success" } }));
    }
    try { window.dispatchEvent(new Event("favorites:change")); } catch (err) { console.debug(err); }
  }, [movie]);

  const closeTrailer = useCallback(() => setShowTrailer(false), []);

  const gotoMovie = useCallback((movieId) => {
    navigate(`/movie/${movieId}`);
    window.scrollTo(0, 0);
  }, [navigate]);

  useEffect(() => {
    if (movie && movie.id) {
      setInWatchlist(isFavorited(movie.id, movie.media_type || "movie"));
    }
  }, [movie]);

  if (loading) return null;

  if (error) return null;

  if (!data?.movie) return null;

  return (
    <div className="movie-detail">
      {/* Trailer Modal */}
      {showTrailer && (
        <div className="trailer-modal">
          <div className="trailer-modal-content">
            <button className="close-trailer" onClick={closeTrailer}>
              <FaTimes />
            </button>
            {trailerUrl && (
              <div className="trailer-video-container">
                <iframe
                  src={trailerUrl}
                  title={`${movie.title} Trailer`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </div>
          <div className="trailer-modal-overlay" onClick={closeTrailer}></div>
        </div>
      )}

      <button className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <section className="movie-hero">
        <div className="hero-backdrop">
          <img
            src={backdropSrc}
            alt={movie.title || "Movie"}
            className="backdrop-image"
            loading="eager"
            onError={(e) => {
              const fallback =
                "https://via.placeholder.com/1200x675/0f0f0f/333333?text=No+Backdrop";
              if (e.target.src !== fallback && !e.target.dataset.fallbackSet) {
                e.target.src = fallback;
                e.target.dataset.fallbackSet = "true";
              }
            }}
          />
          <div className="backdrop-overlay"></div>
        </div>

        <div className="hero-content">
          <div className="poster-container">
            <img
              src={posterSrc}
              alt={movie.title || "Movie"}
              className="movie-poster"
              loading="eager"
              onError={(e) => {
                const fallback =
                  "https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image";
                if (
                  e.target.src !== fallback &&
                  !e.target.dataset.fallbackSet
                ) {
                  e.target.src = fallback;
                  e.target.dataset.fallbackSet = "true";
                }
              }}
            />
          </div>

          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>

            <div className="movie-meta">
              <div className="rating" aria-label={`Rating ${rating}`}>
                <FaStar className="star-icon" />
                <span className="rating-value">{rating}</span>
              </div>
              
              {releaseYear && (
                <span className="release-year">
                  <FaCalendar /> {releaseYear}
                </span>
              )}
              
              {movie.runtime && (
                <span className="runtime">
                  <FaClock /> {movie.runtime} min
                </span>
              )}
            </div>

            <div className="genres">
              {movie.genres?.map((genre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="movie-overview">{movie.overview}</p>

            <div className="action-buttons">
              <button
                className="play-button"
                onClick={handlePlayTrailer}
                disabled={!hasTrailerValue}
                aria-disabled={!hasTrailerValue}
              >
                <FaPlay className="play-icon" />
                {hasTrailerValue ? "Watch Trailer" : "No Trailer"}
              </button>
              
              <button
                className={`watchlist-button ${inWatchlist ? 'in-watchlist' : ''}`}
                onClick={toggleWatchlist}
                title={
                  inWatchlist
                    ? "Remove from Watchlist"
                    : "Add to Watchlist"
                }
              >
                <FaPlus className="plus-icon" />
                {inWatchlist ? "In Watchlist" : "Add to Watchlist"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cast Section */}
      {cast.length > 0 && (
        <section className="cast-section">
          <h2 className="section-title">Top Cast</h2>
          <div className="cast-scroll-container">
            <div className="cast-grid">
              {cast.slice(0, 12).map((actor) => (
                <Link
                  to={`/actor/${actor.id}`}
                  key={actor.id}
                  className="cast-card-link"
                  state={{ from: location.pathname + location.search }}
                >
                  <div className="cast-card" role="link" aria-label={`View ${actor.name}`}>
                    <div className="actor-image-container">
                      <img
                        src={buildImageUrl(
                          actor.profile_path,
                          "w500",
                          "https://via.placeholder.com/150x225/1a1a1a/666666?text=No+Image"
                        )}
                        alt={actor.name || "Actor"}
                        className="actor-image"
                        loading="lazy"
                        onError={(e) => {
                          const fallback =
                            "https://via.placeholder.com/150x225/1a1a1a/666666?text=No+Image";
                          if (
                            e.target.src !== fallback &&
                            !e.target.dataset.fallbackSet
                          ) {
                            e.target.src = fallback;
                            e.target.dataset.fallbackSet = "true";
                          }
                        }}
                      />
                    </div>
                    <div className="actor-info">
                      <h3 className="actor-name">{actor.name}</h3>
                      <p className="actor-character">{actor.character}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Similar Movies Section */}
      {similar.length > 0 && (
        <section className="similar-section">
          <h2 className="section-title">Similar Movies</h2>
          <div className="similar-scroll-container">
            <div className="similar-grid">
              {similar.map((similarMovie) => (
                <div 
                  key={similarMovie.id} 
                  className="similar-movie-card"
                  onClick={() => gotoMovie(similarMovie.id)}
                >
                  <div className="similar-poster-container">
                    <img
                      src={buildImageUrl(
                        similarMovie.poster_path,
                        "w300",
                        "https://via.placeholder.com/200x300/1a1a1a/666666?text=No+Image"
                      )}
                      alt={similarMovie.title}
                      className="similar-poster"
                      loading="lazy"
                    />
                    <div className="movie-rating">
                      <FaStar className="rating-star" />
                      {formatRating(similarMovie.vote_average)}
                    </div>
                  </div>
                  <div className="similar-movie-info">
                    <h3 className="similar-movie-title">{similarMovie.title}</h3>
                    <p className="similar-movie-year">
                      {getYearFromDate(similarMovie.release_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
};

export default MovieDetail;