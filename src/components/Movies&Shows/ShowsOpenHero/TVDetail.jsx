import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaStar, FaPlay, FaPlus, FaArrowLeft, FaCalendar } from 'react-icons/fa';
import useTVShow from '../../../hooks/useTVShow';
import './TVDetail.css';

const TVDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, IMG } = useTVShow(id);

  if (loading)
    return (
      <div className="tv-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading TV show details...</p>
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

  const { tvShow, cast, similar } = data;

  const handlePlayTVShow = () => {
    console.log('Playing TV show:', tvShow.name);
  };

  const handleAddToWatchlist = () => {
    console.log('Added to watchlist:', tvShow.name);
  };

  return (
    <div className="tv-detail">
      <button className="back-button" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

  
      <section className="tv-hero">
        <div className="hero-backdrop">
          <img 
            src={`${IMG}${tvShow.backdrop_path}`} 
            alt={tvShow.name}
            className="backdrop-image"
          />
          <div className="backdrop-overlay"></div>
        </div>
        
        <div className="hero-content">
          <div className="poster-container">
            <img 
              src={`${IMG}${tvShow.poster_path}`} 
              alt={tvShow.name}
              className="tv-poster"
            />
          </div>
          
          <div className="tv-info">
            <h1 className="tv-title">{tvShow.name}</h1>
            
            <div className="tv-meta">
              <div className="rating">
                <FaStar className="star-icon" />
                <span className="rating-value">{tvShow.vote_average?.toFixed(1)}</span>
              </div>
              <span className="first-air-date">
                <FaCalendar /> {new Date(tvShow.first_air_date).getFullYear()}
              </span>
              <span className="seasons">{tvShow.number_of_seasons} Seasons</span>
              <span className="episodes">{tvShow.number_of_episodes} Episodes</span>
            </div>
            
            <div className="genres">
              {tvShow.genres?.map(genre => (
                <span key={genre.id} className="genre-tag">
                  {genre.name}
                </span>
              ))}
            </div>
            
            <p className="tv-overview">{tvShow.overview}</p>
            
            <div className="action-buttons">
              <button className="play-button" onClick={handlePlayTVShow}>
                <FaPlay className="play-icon" />
                Watch Now
              </button>
              <button className="watchlist-button" onClick={handleAddToWatchlist}>
                <FaPlus className="plus-icon" />
                Add to Watchlist
              </button>
            </div>
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
    </div>
  );
};

export default TVDetail;