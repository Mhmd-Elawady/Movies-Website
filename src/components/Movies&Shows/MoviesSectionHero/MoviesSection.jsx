import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TiArrowRight, TiArrowLeft } from "react-icons/ti";
import { HiPlusSm } from "react-icons/hi";
import { FaStar, FaClock, FaTv } from "react-icons/fa";
import { fetchMoviesByCategory } from "../../../services/fetchMoviesByCategory";
import { fetchTVShowsByCategory } from "../../../services/fetchTVShowsByCategory";

import './MoviesSection.css';


const generateRandomDuration = () => {
  const hours = Math.floor(Math.random() * 3) + 1;
  const minutes = Math.floor(Math.random() * 60);
  return `${hours}h ${minutes}m`;
};


const generateRandomYear = () => {
  return Math.floor(Math.random() * 25) + 2000;
};


const generateRandomEpisodes = () => {
  const seasons = Math.floor(Math.random() * 5) + 1;
  let episodes;
  
  
  switch(seasons) {
    case 1:
      episodes = Math.floor(Math.random() * 10) + 6; 
      break;
    case 2:
      episodes = Math.floor(Math.random() * 10) + 10; 
      break;
    case 3:
      episodes = Math.floor(Math.random() * 15) + 20; 
      break;
    case 4:
      episodes = Math.floor(Math.random() * 20) + 30; 
      break;
    default:
      episodes = Math.floor(Math.random() * 25) + 40; 
  }
  
  return `${seasons} Season${seasons > 1 ? 's' : ''} • ${episodes} Episode${episodes > 1 ? 's' : ''}`;
};
function Row({ title, items, isLoading, showAllButton = false, isTVShow = false }) {
  const scrollContainerRef = React.useRef(null);
  const navigate = useNavigate();

  const handleScroll = useCallback((direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8;
      const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleAddToWatchlist = useCallback((item, event) => {
    event.stopPropagation();
    console.log('Adding to watchlist:', item.title);
  }, []);

 
  const handleCardClick = useCallback((item) => {
    if (isTVShow) {
      
      navigate(`/tv/${item.id}`);
    } else {
      
      navigate(`/movie/${item.id}`);
    }
  }, [navigate, isTVShow]); 

  
  const parseEpisodesInfo = (episodesText) => {
    if (!episodesText) return { seasons: '', episodes: '' };
    
    const parts = episodesText.split('•');
    return {
      seasons: parts[0]?.trim() || '',
    };
  };

  return (
    <div className="row-section">
      <div className="row-header">
        <h3>{title}</h3>
        <div className="row-buttons">
          <button 
            onClick={() => handleScroll('left')}
            aria-label={`Scroll ${title} left`}
          >
            <TiArrowLeft size={20} />
          </button>
          <button 
            onClick={() => handleScroll('right')}
            aria-label={`Scroll ${title} right`}
          >
            <TiArrowRight size={20} />
          </button>
          {showAllButton && (
            <button 
              aria-label={`Show all ${title}`}
            >
              <HiPlusSm size={20} />
            </button>
          )}
        </div>
      </div>
      
      <div className="row-cards" ref={scrollContainerRef}>
        {isLoading ? (
          Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="card loading">
              <div className="image-placeholder"></div>
              <div className="text-placeholder"></div>
              <div className="text-placeholder"></div>
            </div>
          ))
        ) : items.length > 0 ? (
          items.map(item => {
            const episodesInfo = parseEpisodesInfo(item.episodes);
            
            return (
              <div 
                key={item.id} 
                className="card"
                onClick={() => handleCardClick(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="card-image-container">
                  <img 
                    src={item.img} 
                    alt={item.title}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image';
                    }}
                  />
                  <div className="card-overlay"></div>
                  <div className="card-badge">
                    {isTVShow ? 'TV' : (item.rating ? `${item.rating}/10` : 'NEW')}
                  </div>
                  <button 
                    className="add-to-watchlist"
                    onClick={(e) => handleAddToWatchlist(item, e)}
                    aria-label={`Add ${item.title} to watchlist`}
                  >
                    <HiPlusSm size={16} />
                  </button>
                </div>
                
                <div className="card-content">
                  <h4 className="card-title" title={item.title}>
                    {item.title}
                  </h4>
                  
                  {isTVShow ? (
                   
                    <div className="card-meta compact">
                      <div className="compact-meta-row">
                        <div className="rating-compact">
                          <FaStar size={10} />
                          <span>{item.rating || (Math.random() * 3 + 7).toFixed(1)}</span>
                        </div>
                        {episodesInfo.seasons && (
                          <div className="episodes-info">
                            <span className="seasons">{episodesInfo.seasons}</span>
                            {episodesInfo.episodes && (
                              <>
                                <span className="separator">•</span>
                                <span className="episodes">{episodesInfo.episodes}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="compact-meta-row">
                        <span className="year">
                          {item.year || generateRandomYear()}
                        </span>
                        <span className="genre">
                          {item.genre || 'TV Show'}
                        </span>
                      </div>
                    </div>
                  ) : (
                 
                    <div className="card-meta">
                      <div className="meta-row">
                        <div className="rating">
                          <FaStar size={12} />
                          <span>{item.rating || (Math.random() * 3 + 7).toFixed(1)}</span>
                        </div>
                        <div className="duration">
                          <FaClock size={12} />
                          <span>{item.duration || generateRandomDuration()}</span>
                        </div>
                      </div>
                      <div className="meta-row">
                        <span className="year">
                          {item.year || generateRandomYear()}
                        </span>
                        <span className="genre">
                          {item.genre || 'Movie'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-movies">
            <p>No {isTVShow ? 'TV shows' : 'movies'} available in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MoviesSection() {
  const [contentType, setContentType] = useState('movies');
  const [moviesData, setMoviesData] = useState({
    genres: [],
    trending: [],
    newReleases: [],
    mustWatch: []
  });
  
  const [tvShowsData, setTvShowsData] = useState({
    genres: [],
    trending: [],
    newReleases: [],
    mustWatch: []
  });
  
  const [loading, setLoading] = useState({
    movies: {
      genres: true,
      trending: true,
      newReleases: true,
      mustWatch: true
    },
    tvshows: {
      genres: true,
      trending: true,
      newReleases: true,
      mustWatch: true
    }
  });

  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navRef = useRef(null);
  const indicatorRef = useRef(null);

  useEffect(() => {
    const updateActiveIndicator = () => {
      const activeElement = navRef.current?.querySelector('.nav-tab.active');
      const indicator = indicatorRef.current;
      
      if (activeElement && indicator) {
        const { offsetLeft, offsetWidth } = activeElement;
        indicator.style.width = `${offsetWidth}px`;
        indicator.style.left = `${offsetLeft}px`;
      }
    };

    updateActiveIndicator();
    
    window.addEventListener('resize', updateActiveIndicator);
    return () => window.removeEventListener('resize', updateActiveIndicator);
  }, [activeTab, contentType]);

  
  const moviesTabs = [
    { id: 'all', label: 'All Movies' },
    { id: 'trending', label: 'Trending' },
    { id: 'new', label: 'New Releases' },
    { id: 'genres', label: 'Genres' },
    { id: 'top', label: 'Top Rated' }
  ];


  const tvShowsTabs = [
    { id: 'all', label: 'All TV Shows' },
    { id: 'trending', label: 'Trending' },
    { id: 'new', label: 'New Releases' },
    { id: 'genres', label: 'Genres' },
    { id: 'top', label: 'Top Rated' }
  ];

  const currentTabs = contentType === 'movies' ? moviesTabs : tvShowsTabs;

  
  const filterMoviesByTab = useCallback((tabId, movies) => {
    switch (tabId) {
      case 'trending':
        return movies.trending;
      
      case 'new':
        return movies.newReleases;
      
      case 'genres':
        return movies.genres;
      
      case 'top':
        const allMovies = [
          ...movies.trending,
          ...movies.newReleases,
          ...movies.mustWatch
        ];
        return allMovies.filter(movie => parseFloat(movie.rating) >= 8.0);
      
      case 'all':
      default:
        const allUniqueMovies = [
          ...movies.trending,
          ...movies.newReleases,
          ...movies.mustWatch
        ].filter((movie, index, self) => 
          index === self.findIndex(m => m.id === movie.id)
        );
        return allUniqueMovies;
    }
  }, []);


  const filterTVShowsByTab = useCallback((tabId, tvShows) => {
    switch (tabId) {
      case 'trending':
        return tvShows.trending;
      
      case 'new':
        return tvShows.newReleases;
      
      case 'genres':
        return tvShows.genres;
      
      case 'top':
        const allTVShows = [
          ...tvShows.trending,
          ...tvShows.newReleases,
          ...tvShows.mustWatch
        ];
        return allTVShows.filter(show => parseFloat(show.rating) >= 8.0);
      
      case 'all':
      default:
        const allUniqueTVShows = [
          ...tvShows.trending,
          ...tvShows.newReleases,
          ...tvShows.mustWatch
        ].filter((show, index, self) => 
          index === self.findIndex(s => s.id === show.id)
        );
        return allUniqueTVShows;
    }
  }, []);


  const filteredMovies = useMemo(() => {
    if (loading.movies.trending || loading.movies.newReleases || loading.movies.mustWatch) {
      return { trending: [], newReleases: [], mustWatch: [], genres: [] };
    }
    
    const filtered = filterMoviesByTab(activeTab, moviesData);
    
    return {
      trending: activeTab === 'all' || activeTab === 'trending' ? filtered : [],
      newReleases: activeTab === 'all' || activeTab === 'new' ? filtered : [],
      mustWatch: activeTab === 'all' || activeTab === 'top' ? filtered : [],
      genres: activeTab === 'all' || activeTab === 'genres' ? moviesData.genres : []
    };
  }, [activeTab, moviesData, loading.movies, filterMoviesByTab]);

  const filteredTVShows = useMemo(() => {
    if (loading.tvshows.trending || loading.tvshows.newReleases || loading.tvshows.mustWatch) {
      return { trending: [], newReleases: [], mustWatch: [], genres: [] };
    }
    
    const filtered = filterTVShowsByTab(activeTab, tvShowsData);
    
    return {
      trending: activeTab === 'all' || activeTab === 'trending' ? filtered : [],
      newReleases: activeTab === 'all' || activeTab === 'new' ? filtered : [],
      mustWatch: activeTab === 'all' || activeTab === 'top' ? filtered : [],
      genres: activeTab === 'all' || activeTab === 'genres' ? tvShowsData.genres : []
    };
  }, [activeTab, tvShowsData, loading.tvshows, filterTVShowsByTab]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
  };

  const handleContentTypeToggle = (type) => {
    setContentType(type);
    setActiveTab('all');
  };

  
  const loadMoviesData = useCallback(async () => {
    try {
      setError('');
      
      const [genres, trending, newReleases, mustWatch] = await Promise.all([
        fetchMoviesByCategory('genres'),
        fetchMoviesByCategory('trending'),
        fetchMoviesByCategory('newReleases'),
        fetchMoviesByCategory('mustWatch')
      ]);

      const enhanceMovieData = (movies) => {
        return movies.map(movie => ({
          ...movie,
          rating: (Math.random() * 3 + 7).toFixed(1),
          duration: generateRandomDuration(),
          year: generateRandomYear(),
          genre: movie.genre || 'Movie',
          type: 'movie'
        }));
      };

      setMoviesData({
        genres: enhanceMovieData(genres.slice(0, 100)),
        trending: enhanceMovieData(trending.slice(0, 100)),
        newReleases: enhanceMovieData(newReleases.slice(0, 100)),
        mustWatch: enhanceMovieData(mustWatch.slice(0, 100))
      });

      setLoading(prev => ({
        ...prev,
        movies: {
          genres: false,
          trending: false,
          newReleases: false,
          mustWatch: false
        }
      }));
    } catch (error) {
      console.error('Error loading movies data:', error);
      setError('Failed to load movies data.');
      
      setLoading(prev => ({
        ...prev,
        movies: {
          genres: false,
          trending: false,
          newReleases: false,
          mustWatch: false
        }
      }));
    }
  }, []);


  const loadTVShowsData = useCallback(async () => {
    try {
      setError('');
      
      const [genres, trending, newReleases, mustWatch] = await Promise.all([
        fetchTVShowsByCategory('genres'),
        fetchTVShowsByCategory('trending'),
        fetchTVShowsByCategory('newReleases'),
        fetchTVShowsByCategory('mustWatch')
      ]);

      const enhanceTVShowData = (shows) => {
        return shows.map(show => ({
          ...show,
          rating: (Math.random() * 3 + 7).toFixed(1),
          episodes: generateRandomEpisodes(),
          year: generateRandomYear(),
          genre: show.genre || 'TV Show',
          type: 'tvshow'
        }));
      };

      setTvShowsData({
        genres: enhanceTVShowData(genres.slice(0, 100)),
        trending: enhanceTVShowData(trending.slice(0,100)),
        newReleases: enhanceTVShowData(newReleases.slice(0, 100)),
        mustWatch: enhanceTVShowData(mustWatch.slice(0, 100))
      });

      setLoading(prev => ({
        ...prev,
        tvshows: {
          genres: false,
          trending: false,
          newReleases: false,
          mustWatch: false
        }
      }));
    } catch (error) {
      console.error('Error loading TV shows data:', error);
      setError('Failed to load TV shows data.');
      
      setLoading(prev => ({
        ...prev,
        tvshows: {
          genres: false,
          trending: false,
          newReleases: false,
          mustWatch: false
        }
      }));
    }
  }, []);

  useEffect(() => {
    loadMoviesData();
    loadTVShowsData();
  }, [loadMoviesData, loadTVShowsData]);

  const handleRetry = () => {
    if (contentType === 'movies') {
      setLoading(prev => ({
        ...prev,
        movies: {
          genres: true,
          trending: true,
          newReleases: true,
          mustWatch: true
        }
      }));
      loadMoviesData();
    } else {
      setLoading(prev => ({
        ...prev,
        tvshows: {
          genres: true,
          trending: true,
          newReleases: true,
          mustWatch: true
        }
      }));
      loadTVShowsData();
    }
  };

  const shouldShowSection = (section) => {
    if (activeTab === 'all') return true;
    
    if (contentType === 'movies') {
      switch (section) {
        case 'genres': return activeTab === 'genres';
        case 'trending': return activeTab === 'trending';
        case 'newReleases': return activeTab === 'new';
        case 'mustWatch': return activeTab === 'top';
        default: return false;
      }
    } else {
      switch (section) {
        case 'genres': return activeTab === 'genres';
        case 'trending': return activeTab === 'trending';
        case 'newReleases': return activeTab === 'new';
        case 'mustWatch': return activeTab === 'top';
        default: return false;
      }
    }
  };

  return (
    <section className={`movies-section ${contentType === 'tvshows' ? 'tv-shows-section' : ''}`}>
      
      <div className="section-header">
        <span className="section-title">
          {contentType === 'movies' ? 'Movies' : 'TV Shows'}
        </span>
        
        <div className="content-toggle">
          <button
            className={`toggle-btn ${contentType === 'movies' ? 'active' : ''}`}
            onClick={() => handleContentTypeToggle('movies')}
          >
            Movies
          </button>
          <button
            className={`toggle-btn ${contentType === 'tvshows' ? 'active' : ''}`}
            onClick={() => handleContentTypeToggle('tvshows')}
          >
            TV Shows
          </button>
          <div className="toggle-indicator"></div>
        </div>
      </div>

      <nav className="movies-navigation" ref={navRef}>
        {currentTabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
        <div 
          ref={indicatorRef}
          className="active-indicator"
          aria-hidden="true"
        />
      </nav>

      {error && (
        <div className="error-message" role="alert">
          {error}
          <button 
            onClick={handleRetry}
            style={{ 
              marginLeft: '1rem', 
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        </div>
      )}

     
      <div className={`content-area ${contentType !== 'movies' ? 'hidden' : ''}`}>
        {shouldShowSection('genres') && (
          <Row 
            title="Our Genres" 
            items={filteredMovies.genres} 
            isLoading={loading.movies.genres}
            showAllButton={true}
          />
        )}

        {shouldShowSection('genres') && filteredMovies.genres.length > 0 && (
          <Row 
            title="Popular Top 10 in Genres" 
            items={filteredMovies.genres.slice(0, 100)} 
            isLoading={loading.movies.genres} 
          />
        )}

        {shouldShowSection('trending') && (
          <Row 
            title="Trending Now" 
            items={filteredMovies.trending} 
            isLoading={loading.movies.trending} 
          />
        )}

        {shouldShowSection('newReleases') && (
          <Row 
            title="New Releases" 
            items={filteredMovies.newReleases} 
            isLoading={loading.movies.newReleases} 
          />
        )}

        {shouldShowSection('mustWatch') && (
          <Row 
            title="Must-Watch Movies" 
            items={filteredMovies.mustWatch} 
            isLoading={loading.movies.mustWatch} 
          />
        )}
      </div>

      <div className={`content-area ${contentType !== 'tvshows' ? 'hidden' : ''}`}>
        {shouldShowSection('genres') && (
          <Row 
            title="TV Show Genres" 
            items={filteredTVShows.genres} 
            isLoading={loading.tvshows.genres}
            showAllButton={true}
            isTVShow={true}
          />
        )}

        {shouldShowSection('genres') && filteredTVShows.genres.length > 0 && (
          <Row 
            title="Popular Top 10 in Genres" 
            items={filteredTVShows.genres.slice(0, 100)} 
            isLoading={loading.tvshows.genres} 
            isTVShow={true}
          />
        )}

        {shouldShowSection('trending') && (
          <Row 
            title="Trending Now" 
            items={filteredTVShows.trending} 
            isLoading={loading.tvshows.trending} 
            isTVShow={true}
          />
        )}

        {shouldShowSection('newReleases') && (
          <Row 
            title="New Releases" 
            items={filteredTVShows.newReleases} 
            isLoading={loading.tvshows.newReleases} 
            isTVShow={true}
          />
        )}

        {shouldShowSection('mustWatch') && (
          <Row 
            title="Must-Watch TV Shows" 
            items={filteredTVShows.mustWatch} 
            isLoading={loading.tvshows.mustWatch} 
            isTVShow={true}
          />
        )}
      </div>

      {(contentType === 'movies' ? 
        filteredMovies.trending.length === 0 && 
        filteredMovies.newReleases.length === 0 && 
        filteredMovies.mustWatch.length === 0 && 
        filteredMovies.genres.length === 0 
        : 
        filteredTVShows.trending.length === 0 && 
        filteredTVShows.newReleases.length === 0 && 
        filteredTVShows.mustWatch.length === 0 && 
        filteredTVShows.genres.length === 0
      ) && 
      !loading.movies.trending && !loading.tvshows.trending && (
        <div className="no-movies" style={{ marginTop: '2rem' }}>
          <p>No {contentType === 'movies' ? 'movies' : 'TV shows'} found in this category. Try another filter.</p>
        </div>
      )}
    </section>
  );
}