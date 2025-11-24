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
import { Link } from "react-router-dom";
import {
  buildImageUrl,
  getYearFromDate,
  formatRating,
  isFavorited,
  addFavorite,
} from "../../../utils/helpers";
import "./TVDetail.css";
import Footer from "../../Homesection/FooterHero/Footer";

const TVDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, IMG, getTrailerUrl, hasTrailer } = useTVShow(id);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isFavoritedState, setIsFavoritedState] = useState(false);
  const tvShow = useMemo(() => data?.tvShow || {}, [data?.tvShow]);
  const cast = useMemo(() => data?.cast || [], [data?.cast]);
  const similar = useMemo(() => data?.similar || [], [data?.similar]);

  // (no additional destructuring to avoid unused variable warnings)

  const posterSrc = useMemo(
    () => buildImageUrl(tvShow.poster_path, "w500", "https://via.placeholder.com/300x450/1a1a1a/666666?text=No+Image"),
    [tvShow.poster_path]
  );

  const backdropSrc = useMemo(
    () => buildImageUrl(tvShow.backdrop_path, "original", "https://via.placeholder.com/1200x675/0f0f0f/333333?text=No+Backdrop"),
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

  const hasTrailerValue = hasTrailer();
  const trailerUrl = getTrailerUrl();

  const handlePlayTVShow = useCallback(() => {
    if (hasTrailerValue) setShowTrailer(true);
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
    if (addFavorite(favItem)) {
      setIsFavoritedState(true);
      // show toast and notify other parts of app
      try {
        window.dispatchEvent(new CustomEvent("app:toast", { detail: { message: "Added to Favorites", type: "success" } }));
        window.dispatchEvent(new Event("favorites:change"));
      } catch (err) {
        console.debug(err);
      }
    }
  }, [tvShow]);

  useEffect(() => {
    if (tvShow?.id) setIsFavoritedState(isFavorited(tvShow.id, tvShow.media_type || "tv"));
  }, [tvShow]);

  const closeTrailer = useCallback(() => {
    setShowTrailer(false);
  }, []);

  const gotoShow = useCallback(
    (showId) => {
      // navigate to the selected TV show's detail page
      navigate(`/tv/${showId}`);
      // ensure trailer (if open) is closed when navigating
      setShowTrailer(false);
    },
    [navigate]
  );

  // Early returns for loading/error/cases remain after all hooks
  if (loading) return null;

  if (error) return null;

  if (!data?.tvShow) return null;

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
              <Link to={`/actor/${actor.id}`} key={actor.id} className="cast-card-link">
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

      {/* Similar Shows Section */}
      {similar.length > 0 && (
        <section className="similar-section">
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
                      src={buildImageUrl(s.poster_path, "w300", "https://via.placeholder.com/200x300/1a1a1a/666666?text=No+Image")}
                      alt={s.name || s.title || "Similar Show"}
                      className="similar-poster"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const fallback = "https://via.placeholder.com/200x300/1a1a1a/666666?text=No+Image";
                        if (!e.target.dataset.fallbackSet) {
                          e.target.src = fallback;
                          e.target.dataset.fallbackSet = "true";
                        }
                      }}
                    />
                    <div className="tv-rating">
                      <FaStar className="rating-star" />
                      <span>{formatRating(s.vote_average)}</span>
                    </div>
                  </div>
                  <div className="similar-tv-info">
                    <div className="similar-tv-title">{s.name || s.title}</div>
                    <div className="similar-tv-year">{getYearFromDate(s.first_air_date || s.release_date)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
};

export default TVDetail;
