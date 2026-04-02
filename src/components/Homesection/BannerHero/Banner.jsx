import React from 'react';
import './Banner.css';

const Banner = () => {
  return (
    <div className="banner-container">
      <div className="banner-content">

        {/* Eyebrow label */}
        <span className="banner-eyebrow">Limited Offer</span>

        <h1 className="heding">Start your free trial today!</h1>

        <p className="par">
          This is a clear and concise call to action that encourages users to
          sign up for a free trial of StreamVibe.
        </p>

        <button className="start-trial-button">
          Start a Free Trial
        </button>

      </div>
    </div>
  );
};

export default Banner;