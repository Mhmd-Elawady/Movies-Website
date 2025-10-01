import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom';

export default function MainSection() {
  const bannerData = useSelector(state => state.movieData.bannerData)
  const imageURL = useSelector(state => state.movieData.imageURL)
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentImage < bannerData.length - 1) {
        setCurrentImage(prev => prev + 1)
      } else {
        setCurrentImage(0)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [bannerData, currentImage])

  if (!bannerData || bannerData.length === 0) return null

  const data = bannerData[currentImage] 

  return (
    <section className=" w-100 min-vh-100 position-relative">
      <div className="d-flex min-vh-100 overflow-hidden position-relative">
        <div
          key={data.id + "bannerHome" + currentImage}
          className="w-100 position-relative transition-all"
          style={{
            minHeight: "450px",
            maxHeight: "95vh"
          }}
        >
          <div className="w-100 h-100">
            <img
              src={imageURL + data.backdrop_path}
              className="img-fluid w-100 h-100 object-fit-cover"
              alt={data?.title || data?.name}
            />
          </div>

          {/* Gradient Overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
            }}
          ></div>

          {/* Text content */}
          <div className="container position-absolute bottom-0 start-0 text-white pb-4">
            <div className="col-md-6">
              <h2 className="fw-bold fs-2 fs-lg-1">
                {data?.title || data?.name}
              </h2>
              <p className="text-truncate my-2">{data.overview}</p>
              <div className="d-flex align-items-center gap-3">
                <p>Rating : {Number(data.vote_average).toFixed(1)}+</p>
                <span>|</span>
                <p>View : {Number(data.popularity).toFixed(0)}</p>
              </div>
              <Link to={`/${data?.media_type}/${data.id}`}>
                <button className="btn btn-light fw-bold mt-3 shadow-sm">
                  Play Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
