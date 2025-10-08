import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';
import './MainSection.css'
import { TiArrowRight, TiArrowLeft } from "react-icons/ti";
import { FaPlay } from "react-icons/fa";
import { HiPlusSm } from "react-icons/hi";

export default function MainSection() {
  const bannerData = useSelector(state => state.movieData.bannerData)
  const imageURL = useSelector(state => state.movieData.imageURL)
  const [currentImage, setCurrentImage] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let interval
    if (bannerData && bannerData.length > 0) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextSlide()
            return 0
          }
          return prev + 1
        })
      }, 50)
    }

    return () => clearInterval(interval)
  }, [bannerData])

  useEffect(() => {
    setProgress(0)
  }, [currentImage])

  const nextSlide = () => {
    if (bannerData && bannerData.length > 0) {
      setCurrentImage(prev =>
        prev === bannerData.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevSlide = () => {
    if (bannerData && bannerData.length > 0) {
      setCurrentImage(prev =>
        prev === 0 ? bannerData.length - 1 : prev - 1
      )
    }
  }

  const goToSlide = (index) => {
    setCurrentImage(index)
  }

  if (!bannerData || bannerData.length === 0) return null

  const data = bannerData[currentImage]

  return (
    <section className='MainSection'>
      <div className="banner-box" key={data.id + "bannerHome" + currentImage}>
        <img
          src={imageURL + data.backdrop_path}
          alt={data?.title || data?.name}
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
            <Link to={`/${data?.media_type}/${data.id}`}>
              <button className="btn-play">
                Play Now <FaPlay />
              </button>
            </Link>
            <button className="plus-btn">
              <HiPlusSm />
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
