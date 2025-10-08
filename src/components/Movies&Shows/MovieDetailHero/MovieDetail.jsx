import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaStar, FaPlay, FaPlus, FaArrowLeft, FaTimes } from 'react-icons/fa';
import useMovie from '../../../hooks/useMovie';
import './MovieDetail.css';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, IMG } = useMovie(id);
  const [showTrailer, setShowTrailer] = useState(false);

  if (loading)
    return (
      <div className="movie-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );

  if (!data?.movie)
    return (
      <div className="movie-detail-error">
        <h2>Movie Not Found</h2>
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Go Back
        </button>
      </div>
    );

  const { movie, cast, similar, trailer } = data;

  const handlePlayMovie = () => {
    if (trailer) {
      setShowTrailer(true);
    } else {

      const searchQuery = encodeURIComponent(`${movie.title} official trailer`);
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
    }
  };

  const handleAddToWatchlist = () => {
    console.log('Added to watchlist:', movie.title);
  };

  const handleMovieNavigation = (newId) => {
    navigate(`/movie/${newId}`);
    window.scrollTo(0, 0);
  };

  const closeTrailer = () => {
    setShowTrailer(false);
  };

  return (
    <div className="movie-detail">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>


      {showTrailer && trailer && (
        <div className="trailer-modal">
          <div className="trailer-modal-content">
            <button className="close-trailer" onClick={closeTrailer}>
              <FaTimes />
            </button>
            <div className="trailer-container">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                title={trailer.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}


      <section className="movie-hero">
        <div className="hero-backdrop">
          <img 
            src={`${IMG}${movie.backdrop_path}`} 
            alt={movie.title}
            className="backdrop-image"
          />
          <div className="backdrop-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="poster-container">
            <img 
              src={`${IMG}${movie.poster_path}`} 
              alt={movie.title}
              className="movie-poster"
            />
          </div>
          
          <div className="movie-info">
            <h1 className="movie-title">{movie.title}</h1>
            
            <div className="movie-meta">
              <div className="rating">
                <FaStar className="star-icon" />
                <span className="rating-value">{movie.vote_average?.toFixed(1)}</span>
              </div>
              <span className="release-year">{new Date(movie.release_date).getFullYear()}</span>
              <span className="runtime">{movie.runtime} min</span>
            </div>
            
            <div className="genres">
              {movie.genres?.map(genre => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>
            
            <p className="movie-overview">{movie.overview}</p>
            
            <div className="action-buttons">
              <button className="play-button" onClick={handlePlayMovie}>
                <FaPlay className="play-icon" />
                {trailer ? 'Watch Trailer' : 'Watch Now'}
              </button>
              <button className="watchlist-button" onClick={handleAddToWatchlist}>
                <FaPlus className="plus-icon" />
                Add to Watchlist
              </button>
            </div>

            {!trailer && (
              <div className="watch-full-movie">
                <p>Want to watch the full movie?</p>
                <button 
                  className="full-movie-button"
                  onClick={() => {
                    const searchQuery = encodeURIComponent(`${movie.title} full movie`);
                    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
                  }}
                >
                  <FaPlay className="play-icon" />
                  Search Full Movie on YouTube
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="cast-section">
        <h2 className="section-title">Top Cast</h2>
        <div className="cast-scroll-container">
          <div className="cast-grid">
            {cast.map(actor => (
              <div key={actor.id} className="cast-card">
                <div className="actor-image-container">
                  <img 
                    src={actor.profile_path ? `${IMG}${actor.profile_path}` : 'https://via.placeholder.com/150x225/1a1a1a/666666?text=No+Image'} 
                    alt={actor.name}
                    className="actor-image"
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

      <section className="similar-section">
        <h2 className="section-title">Similar Movies</h2>
        <div className="similar-scroll-container">
          <div className="similar-grid">
            {similar.map(movie => (
              <div 
                key={movie.id} 
                className="similar-movie-card"
                onClick={() => handleMovieNavigation(movie.id)}
              >
                <div className="similar-poster-container">
                  <img 
                    src={movie.poster_path ? `${IMG}${movie.poster_path}` : 'https://via.placeholder.com/200x300/1a1a1a/666666?text=No+Image'} 
                    alt={movie.title}
                    className="similar-poster"
                  />
                  <div className="movie-rating">
                    <FaStar className="rating-star" />
                    <span>{movie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
                <div className="similar-movie-info">
                  <h3 className="similar-movie-title">{movie.title}</h3>
                  <p className="similar-movie-year">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default MovieDetail;