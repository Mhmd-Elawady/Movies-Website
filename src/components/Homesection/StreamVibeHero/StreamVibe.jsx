import React from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../../assets/SubContainer.png';
import './StreamVibe.css';

export default function StreamVibe() {
  const navigate = useNavigate();
  return (
    <section className="hero" aria-label="StreamVibe Hero Section">
      <div className="hero-image">
        <img
          src={bgImage}
          alt="StreamVibe background showcasing a cinematic scene"
          className="hero-bg"
          loading="lazy"
        />
        <div className="hero-gradient"></div>
      </div>
      <div className="hero-content-below">
        <h1>The Best Streaming Experience</h1>
        <p>
          StreamVibe offers the ultimate streaming experience, delivering your favorite movies and shows on demand, anytime, anywhere. Enjoy blockbusters, classics, and exclusive series, with personalized watchlists to keep your content at your fingertips.
        </p>
        <button
          className="cta-btn"
          aria-label="Start watching StreamVibe now"
          onClick={() => navigate('/movies_shows')}
        >
          Start Watching Now
        </button>
      </div>
    </section>
  );
}