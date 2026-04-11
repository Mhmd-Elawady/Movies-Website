import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import Footer from "../../Homesection/FooterHero/Footer";
import MovieReviews from "../../Moviereviews/Moviereviews";

const TVDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, getTrailerUrl, hasTrailer } = useTVShow(id);
  const [showTrailer,      setShowTrailer]      = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);

  const tvShow  = useMemo(() => data?.tvShow  || {}, [data?.tvShow]);
  const cast    = useMemo(() => data?.cast    || [], [data?.cast]);
  const similar = useMemo(() => data?.similar || [], [data?.similar]);

  const posterSrc = useMemo(
    () => buildImageUrl(tvShow.poster_path, "w500", "https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image"),
    [tvShow.poster_path]
  );

  const backdropSrc = useMemo(
    () => buildImageUrl(tvShow.backdrop_path, "original", "https://via.placeholder.com/1200x675/0f0f0f/333333?text=No+Backdrop"),
    [tvShow.backdrop_path]
  );

  const releaseYear     = useMemo(() => getYearFromDate(tvShow.first_air_date), [tvShow.first_air_date]);
  const rating          = useMemo(() => formatRating(tvShow.vote_average),      [tvShow.vote_average]);
  const hasTrailerValue = hasTrailer();
  const trailerUrl      = getTrailerUrl();

  /* ── Handlers ─────────────────────────────────────────────── */
  const handlePlayTVShow = useCallback(() => {
    if (hasTrailerValue) setShowTrailer(true);
  }, [hasTrailerValue]);

  const handleAddToWatchlist = useCallback(() => {
    if (!tvShow?.id) return;
    const favItem = {
      id:           tvShow.id,
      title:        tvShow.title || tvShow.name,
      poster_path:  tvShow.poster_path,
      vote_average: tvShow.vote_average,
      release_date: tvShow.release_date || tvShow.first_air_date,
      media_type:   tvShow.media_type || "tv",
    };
    if (addFavorite(favItem)) {
      setIsFavoritedState(true);
      try {
        window.dispatchEvent(new CustomEvent("app:toast", {
          detail: { message: "Added to Favorites", type: "success" },
        }));
        window.dispatchEvent(new Event("favorites:change"));
      } catch (err) { console.debug(err); }
    }
  }, [tvShow]);

  const closeTrailer = useCallback(() => setShowTrailer(false), []);

  const gotoShow = useCallback((showId) => {
    navigate(`/tv/${showId}`);
    window.scrollTo(0, 0);
    setShowTrailer(false);
  }, [navigate]);

  /* ── Close trailer on ESC ─────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeTrailer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeTrailer]);

  /* ── Sync favorites state ─────────────────────────────────── */
  useEffect(() => {
    if (tvShow?.id) {
      setIsFavoritedState(isFavorited(tvShow.id, tvShow.media_type || "tv"));
    }
  }, [tvShow]);

  if (loading || error || !data?.tvShow) return null;

  return (
    <div className="tv-detail">

      {/* ── Trailer Modal ── */}
      {showTrailer && (
        <div className="trailer-modal" role="dialog" aria-modal="true" aria-label="TV show trailer">
          <div className="trailer-modal-content">
            <button className="close-trailer" onClick={closeTrailer} aria-label="Close trailer">
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
                />
              </div>
            )}
          </div>
          <div className="trailer-modal-overlay" onClick={closeTrailer} aria-hidden="true" />
        </div>
      )}

      {/* ── Back button ── */}
      <button className="back-button" onClick={() => navigate(-1)} aria-label="Go back">
        <FaArrowLeft aria-hidden="true" /> Back
      </button>

      {/* ── Hero ── */}
      <section className="tv-hero" aria-label={`${tvShow.name} details`}>
        <div className="hero-backdrop" aria-hidden="true">
          <img
            src={backdropSrc}
            alt=""
            className="backdrop-image"
            loading="eager"
            onError={(e) => {
              if (!e.target.dataset.fallbackSet) {
                e.target.src = "https://via.placeholder.com/1200x675/0f0f0f/333333?text=No+Backdrop";
                e.target.dataset.fallbackSet = "true";
              }
            }}
          />
          <div className="backdrop-overlay" />
        </div>

        <div className="hero-content">
          <div className="poster-container">
            <img
              src={posterSrc}
              alt={tvShow.name || "TV Show poster"}
              className="tv-poster"
              loading="eager"
              onError={(e) => {
                if (!e.target.dataset.fallbackSet) {
                  e.target.src = "https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image";
                  e.target.dataset.fallbackSet = "true";
                }
              }}
            />
          </div>

          <div className="tv-info">
            <h1 className="tv-title">{tvShow.name}</h1>

            <div className="tv-meta">
              <div className="rating" aria-label={`Rating: ${rating} out of 10`}>
                <FaStar className="star-icon" aria-hidden="true" />
                <span className="rating-value">{rating}</span>
              </div>

              {releaseYear && (
                <span className="first-air-date">
                  <FaCalendar aria-hidden="true" /> {releaseYear}
                </span>
              )}

              {tvShow.number_of_seasons != null && (
                <span className="seasons">
                  {tvShow.number_of_seasons} Season{tvShow.number_of_seasons !== 1 ? "s" : ""}
                </span>
              )}

              {tvShow.number_of_episodes != null && (
                <span className="episodes">
                  {tvShow.number_of_episodes} Episode{tvShow.number_of_episodes !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="genres" aria-label="Genres">
              {tvShow.genres?.map((genre) => (
                <span key={genre.id} className="genre-tag">{genre.name}</span>
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
                <FaPlay className="play-icon" aria-hidden="true" />
                {hasTrailerValue ? "Watch Trailer" : "No Trailer"}
              </button>

              <button
                className={`watchlist-button ${isFavoritedState ? "in-watchlist" : ""}`}
                onClick={handleAddToWatchlist}
                disabled={isFavoritedState}
                aria-pressed={isFavoritedState}
                aria-label={isFavoritedState ? "Already added to favorites" : "Add to favorites"}
              >
                <FaPlus className="plus-icon" aria-hidden="true" />
                {isFavoritedState ? "Added to Favorites" : "Add to Favorites"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cast ── */}
      {cast.length > 0 && (
        <section className="cast-section" aria-label="Top cast">
          <h2 className="section-title">Top Cast</h2>
          <div className="cast-scroll-container">
            <div className="cast-grid">
              {cast.slice(0, 12).map((actor) => (
                <Link
                  to={`/actor/${actor.id}`}
                  key={actor.id}
                  className="cast-card-link"
                  aria-label={`View ${actor.name}'s profile`}
                >
                  <div className="cast-card">
                    <div className="actor-image-container">
                      <img
                        src={buildImageUrl(
                          actor.profile_path, "w500",
                          "https://via.placeholder.com/150x225/1a1a1a/666666?text=No+Image"
                        )}
                        alt={actor.name || "Actor"}
                        className="actor-image"
                        loading="lazy"
                        onError={(e) => {
                          if (!e.target.dataset.fallbackSet) {
                            e.target.src = "https://via.placeholder.com/150x225/1a1a1a/666666?text=No+Image";
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

      {/* ── Similar Shows ── */}
      {similar.length > 0 && (
        <section className="similar-section" aria-label="Similar shows">
          <h2 className="section-title">Similar Shows</h2>
          <div className="similar-scroll-container">
            <div className="similar-grid">
              {similar.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="similar-tv-card"
                  onClick={() => gotoShow(s.id)}
                  aria-label={`Open ${s.name || s.title}`}
                >
                  <div className="similar-poster-container">
                    <img
                      src={buildImageUrl(
                        s.poster_path, "w300",
                        "https://via.placeholder.com/200x300/1a1a1a/666666?text=No+Image"
                      )}
                      alt={s.name || s.title || "Similar show"}
                      className="similar-poster"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        if (!e.target.dataset.fallbackSet) {
                          e.target.src = "https://via.placeholder.com/200x300/1a1a1a/666666?text=No+Image";
                          e.target.dataset.fallbackSet = "true";
                        }
                      }}
                    />
                    <div className="tv-rating" aria-label={`Rating: ${formatRating(s.vote_average)}`}>
                      <FaStar className="rating-star" aria-hidden="true" />
                      <span>{formatRating(s.vote_average)}</span>
                    </div>
                  </div>
                  <div className="similar-tv-info">
                    <div className="similar-tv-title">{s.name || s.title}</div>
                    <div className="similar-tv-year">
                      {getYearFromDate(s.first_air_date || s.release_date)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews ── */}
      <MovieReviews movieId={id} />

      <Footer />
    </div>
  );
};

export default TVDetail;