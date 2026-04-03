import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import './MainSection.css'
import { TiArrowRight, TiArrowLeft } from "react-icons/ti";
import { FaPlay } from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";
import { addFavorite, getFavorites } from "../../../utils/helpers";
import { useDispatch } from 'react-redux';
import { addToWatchlist as addToWatchlistAction } from '../../../store/watchlistSlice';

export default function MainSection() {
  const bannerData = useSelector(state => state.movieData.bannerData)
  const imageURL = useSelector(state => state.movieData.imageURL)
  const dispatch = useDispatch();
  const [currentImage, setCurrentImage] = useState(0)
  const [progress, setProgress] = useState(0)
  const intervalRef = useRef(null)
  const progressIntervalRef = useRef(null)
  const [bannerAdded, setBannerAdded] = useState(false);

  // Memoized slide navigation functions
  const nextSlide = useCallback(() => {
    if (bannerData && bannerData.length > 0) {
      setCurrentImage(prev =>
        prev === bannerData.length - 1 ? 0 : prev + 1
      )
    }
  }, [bannerData])

  const prevSlide = useCallback(() => {
    if (bannerData && bannerData.length > 0) {
      setCurrentImage(prev =>
        prev === 0 ? bannerData.length - 1 : prev - 1
      )
    }
  }, [bannerData])

  const goToSlide = useCallback((index) => {
    if (bannerData && index >= 0 && index < bannerData.length) {
      setCurrentImage(index)
    }
  }, [bannerData])

  // Optimized progress bar with proper cleanup
  useEffect(() => {
    if (!bannerData || bannerData.length === 0) return;

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 1;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [bannerData, nextSlide]);

  // Reset progress when image changes
  useEffect(() => {
    setProgress(0);
  }, [currentImage])

  if (!bannerData || bannerData.length === 0) return null

  const data = bannerData[currentImage]

  // Validate data before rendering
  if (!data || !data.id) return null

  return (
    <section className='MainSection'>
      <div className="banner-box" key={data.id + "bannerHome" + currentImage}>
        <img
          src={data.backdrop_path ? (imageURL + data.backdrop_path) : 'https://via.placeholder.com/1920x1080/1a1a1a/666666?text=No+Image'}
          alt={data?.title || data?.name || 'Media'}
        />

        <div className="gradient-overlay"></div>

        <button className="nav-arrow prev" onClick={prevSlide}>
          <TiArrowLeft size={30} />
        </button>

        <button className="nav-arrow next" onClick={nextSlide}>
          <TiArrowRight size={30} />
        </button>

        <div className="content">
          <h2>{data?.title || data?.name}</h2>
          <p>{data.overview}</p>

          <div className="button-container">
            <Link to={`/${data?.media_type === 'tv' ? 'tv' : 'movie'}/${data.id}`}>
              <button className="btn-play">
                Play Now <FaPlay />
              </button>
            </Link>
            <button
              className="plus-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  const toAdd = {
                    id: data.id,
                    title: data.title || data.name || "",
                    poster_path: data.poster_path || null,
                    vote_average: data.vote_average != null ? data.vote_average : null,
                    release_date: data.release_date || data.first_air_date || null,
                    media_type: data.media_type === 'tv' ? 'tv' : 'movie',
                  };
                  addFavorite(toAdd);
                  setBannerAdded(true);
                  setTimeout(() => setBannerAdded(false), 1800);
                  try { dispatch(addToWatchlistAction(toAdd)); } catch (err) { console.debug('dispatch watchlist add error', err); }
                  // persist to localStorage so other components update and notify current tab
                  try { localStorage.setItem('myapp.favorites.v1', JSON.stringify(getFavorites())); } catch (err) { console.debug('localStorage set error', err); }
                  try { window.dispatchEvent(new Event('favorites:change')); } catch (err) { console.debug('dispatch error', err); }
                  try { window.dispatchEvent(new CustomEvent('app:toast', { detail: { message: `${toAdd.title || 'Item'} added to Watchlist`, type: 'success' } })); } catch (err) { console.debug('toast dispatch error', err); }
                } catch (err) {
                  console.error('Failed to add banner item to watchlist', err);
                }
              }}
            >
              {bannerAdded ? <span style={{ color: '#fff', fontWeight: 700 }}>✓</span> : <HiPlusSm />}
            </button>
          </div>
        </div>

        <div className="progress-bar">
          <div
            className="progress"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <div className="carousel-indicators">
          {bannerData.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentImage ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
