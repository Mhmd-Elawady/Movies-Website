import React from 'react';
import './Footer.css';
import { FaEnvelope, FaGlobe, FaTwitter, FaInstagram } from 'react-icons/fa';
const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Home</h4>
          <ul>
            <li>Categories</li>
            <li>Devices</li>
            <li>Pricing</li>
            <li>FAQ</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Movies</h4>
          <ul>
            <li>Genres</li>
            <li>Trending</li>
            <li>New Release</li>
            <li>Popular</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Shows</h4>
          <ul>
            <li>Genres</li>
            <li>Trending</li>
            <li>New Release</li>
            <li>Popular</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>Contact Us</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Subscription</h4>
          <ul>
            <li>Plans</li>
            <li>Features</li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Connect With Us</h4>
         <div className="social-icons">
            <FaEnvelope />
            <FaGlobe />
            <FaTwitter />
            <FaInstagram />
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 streamVibe. All Rights Reserved</p>
        <div className="footer-links">
          <a href="#">Terms of Use</a> | <a href="#">Privacy Policy</a> | <a href="#">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);