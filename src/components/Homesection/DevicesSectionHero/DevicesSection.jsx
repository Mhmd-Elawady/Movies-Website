import React from "react";
import {
  FaMobileAlt,
  FaTabletAlt,
  FaTv,
  FaLaptop,
  FaGamepad,
  FaVrCardboard,
  FaArrowRight,
} from "react-icons/fa";
import "./DevicesSection.css";

const devices = [
  {
    icon: <FaMobileAlt />,
    title: "Smartphones",
    description:
      "Enjoy StreamVibe on Android and iOS. Download our app from the Google Play Store or the Apple App Store and stream on the go.",
  },
  {
    icon: <FaTabletAlt />,
    title: "Tablet",
    description:
      "A bigger screen, even better experience. StreamVibe is fully optimized for Android and iOS tablets — portrait or landscape.",
  },
  {
    icon: <FaTv />,
    title: "Smart TV",
    description:
      "Turn your living room into a cinema. StreamVibe supports all major smart TV platforms with a remote-friendly interface.",
  },
  {
    icon: <FaLaptop />,
    title: "Laptops",
    description:
      "Stream directly in your browser or download the desktop app for Windows and macOS for an uninterrupted experience.",
  },
  {
    icon: <FaGamepad />,
    title: "Gaming Consoles",
    description:
      "Available on PlayStation and Xbox. Switch from gaming to streaming without leaving the couch.",
  },
  {
    icon: <FaVrCardboard />,
    title: "VR Headsets",
    description:
      "Step inside your favorite content. StreamVibe delivers an immersive VR viewing experience on leading headset platforms.",
  },
];

const DevicesSection = () => {
  return (
    <section className="devices-section">
      <div className="devices-header">
     
        <h2>We Provide you Streaming Experience Across Various Devices.</h2>
        <p>
          With StreamVibe, enjoy your favorite movies and TV shows anytime, anywhere.
          Our platform is designed to be compatible with a wide range of devices,
          ensuring you never miss a moment of entertainment.
        </p>
      </div>

      <div className="devices-container">
        {devices.map((device, index) => (
          <div key={index} className="device-card">
            <span className="device-number">
              {String(index + 1).padStart(2, "0")}
            </span>

            <div className="device-top">
              <div className="icon-wrapper">{device.icon}</div>
              <h3>{device.title}</h3>
            </div>

            <div className="device-divider" />

            <p className="device-description">{device.description}</p>

            <a href="#" className="device-link">
              Learn more <FaArrowRight />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DevicesSection;