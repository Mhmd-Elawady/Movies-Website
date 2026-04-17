import React from "react";
import { useNavigate } from "react-router-dom";
import { FaPlay, FaArrowRight, FaChevronDown, FaStar, FaFilm, FaTv } from "react-icons/fa";
import bgImage from "../../../assets/SubContainer.webp";
import "./StreamVibe.css";

export default function StreamVibe() {
  const navigate = useNavigate();

  return (
    <section className="hero" aria-label="StreamVibe Hero Section">
      {/* Background image */}
      <div className="hero-image">
        <img
          src={bgImage}
          alt="StreamVibe cinematic background"
          className="hero-bg"
          loading="eager"
          fetchpriority="high"
        />
        <div className="hero-gradient" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="hero-content-below">
        <h1>
          The Best <span>Streaming</span> Experience
        </h1>

        <p>
          StreamVibe delivers your favorite movies and shows on demand — anytime,
          anywhere. Enjoy blockbusters, classics, and exclusives with personalized
          watchlists built just for you.
        </p>

        

        <button
          className="cta-btn"
          aria-label="Start watching StreamVibe now"
          onClick={() => navigate("/movies_shows")}
        >
          <FaPlay aria-hidden="true" />
          Start Watching Now
          <FaArrowRight aria-hidden="true" />
        </button>
      </div>

    </section>
  );
}