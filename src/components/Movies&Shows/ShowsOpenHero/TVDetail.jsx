import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaStar,
  FaPlay,
  FaPlus,
  FaArrowLeft,
  FaCalendar,
  FaTimes,
} from "react-icons/fa";
import useTVShow from "../../../hooks/useTVShow";
import {
  buildImageUrl,
  getYearFromDate,
  formatRating,
  isFavorited,
  addFavorite,
} from "../../../utils/helpers";
import "./TVDetail.css";

const TVDetail = () => {
  // Hooks must always be called in the same order — place all hooks at top
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, IMG, getTrailerUrl, hasTrailer } =
    useTVShow(id);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  // Derive stable references even when data is not yet available
  const tvShow = useMemo(() => data?.tvShow || {}, [data?.tvShow]);
  const cast = data?.cast || [];

  // Memoized values (always declared at top-level)
  const posterSrc = useMemo(
    () =>
      buildImageUrl(
        tvShow.poster_path,
        "w500",
        "https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image"
      ),
    [tvShow.poster_path]
  );

  const backdropSrc = useMemo(
    () =>
      buildImageUrl(
        tvShow.backdrop_path,
        "original",
        "https://via.placeholder.com/1200x675/0f0f0f/333333?text=No+Backdrop"
      ),
    [tvShow.backdrop_path]
  );

  const releaseYear = useMemo(
    () => getYearFromDate(tvShow.first_air_date),
    [tvShow.first_air_date]
  );

  const rating = useMemo(
    () => formatRating(tvShow.vote_average),
    [tvShow.vote_average]
  );

  // Call non-hook helpers (safe to call at top)
  const hasTrailerValue = hasTrailer();
  const trailerUrl = getTrailerUrl();

  const handlePlayTVShow = useCallback(() => {
    if (hasTrailerValue) {
      setShowTrailer(true);
    }
  }, [hasTrailerValue]);

  const handleAddToWatchlist = useCallback(() => {
    if (!tvShow) return;
    const favItem = {
      id: tvShow.id,
      title: tvShow.title || tvShow.name,
      poster_path: tvShow.poster_path,
      vote_average: tvShow.vote_average,
      release_date: tvShow.release_date || tvShow.first_air_date,
      media_type: tvShow.media_type || "tv",
    };
    const ok = addFavorite(favItem);
    if (ok) setIsFavoritedState(true);
  }, [tvShow]);

  // Initialize favorited state when tvShow loads
  useEffect(() => {
    if (tvShow && tvShow.id) {
      setIsFavoritedState(isFavorited(tvShow.id, tvShow.media_type || "tv"));
    }
  }, [tvShow]);

  const closeTrailer = useCallback(() => {
    setShowTrailer(false);
  }, []);

  // Early returns for loading/error/cases remain after all hooks
  if (loading)
    return (
      <div className="tv-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading TV show details...</p>
      </div>
    );

  if (error)
    return (
      <div className="tv-detail-error">
        <h2>Failed to load</h2>
        <p>{error}</p>
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );

  if (!data?.tvShow)
    return (
      <div className="tv-detail-error">
        <h2>TV Show Not Found</h2>
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );

  return (
    <div className="tv-detail">
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
                  title={`${tvShow.name} Trailer`}
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

      <section className="tv-hero">
        <div className="hero-backdrop">
          <img
            src={backdropSrc}
            alt={tvShow.name || "TV Show"}
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
              alt={tvShow.name || "TV Show"}
              className="tv-poster"
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

          <div className="tv-info">
            <h1 className="tv-title">{tvShow.name}</h1>

            <div className="tv-meta">
              <div className="rating" aria-label={`Rating ${rating}`}>
                <FaStar className="star-icon" />
                <span className="rating-value">{rating}</span>
              </div>
              {releaseYear && (
                <span className="first-air-date">
                  <FaCalendar /> {releaseYear}
                </span>
              )}
              {tvShow.number_of_seasons != null && (
                <span className="seasons">
                  {tvShow.number_of_seasons} Season
                  {tvShow.number_of_seasons !== 1 ? "s" : ""}
                </span>
              )}
              {tvShow.number_of_episodes != null && (
                <span className="episodes">
                  {tvShow.number_of_episodes} Episode
                  {tvShow.number_of_episodes !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="genres">
              {tvShow.genres?.map((genre) => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>

            <p className="tv-overview">{tvShow.overview}</p>

            <div className="action-buttons">
              <button
                className="play-button"
                onClick={handlePlayTVShow}
                disabled={!hasTrailerValue}
                aria-disabled={!hasTrailerValue}
              >
                <FaPlay className="play-icon" />
                {hasTrailerValue ? "Watch Trailer" : "No Trailer"}
              </button>
              <button
                className="watchlist-button"
                onClick={handleAddToWatchlist}
                disabled={isFavoritedState}
                aria-pressed={isFavoritedState}
                title={
                  isFavoritedState
                    ? "Already added to favorites"
                    : "Add to favorites"
                }
              >
                <FaPlus className="plus-icon" />
                {isFavoritedState ? "Added to Favorites" : "Add to Favorites"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="cast-section">
        <h2 className="section-title">Top Cast</h2>
        <div className="cast-scroll-container">
          <div className="cast-grid">
            {cast.map((actor) => (
              <div key={actor.id} className="cast-card">
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
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TVDetail;
