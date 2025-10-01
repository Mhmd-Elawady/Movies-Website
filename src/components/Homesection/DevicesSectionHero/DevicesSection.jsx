import React from "react";
import { FaMobileAlt, FaTabletAlt, FaTv, FaLaptop, FaGamepad, FaVrCardboard } from "react-icons/fa";
import "./DevicesSection.css";

const devices = [
  {
    icon: <FaMobileAlt />,
    title: "Smartphones",
    description: "StreamVibe is optimized for both Android and iOS smartphones. Download our app from the Google Play Store or the Apple App Store",
  },
  {
    icon: <FaTabletAlt />,
    title: "Tablet",
    description: "StreamVibe is optimized for both Android and iOS tablets. Download our app from the Google Play Store or the Apple App Store",
  },
  {
    icon: <FaTv />,
    title: "Smart TV",
    description: "StreamVibe is optimized for both Android and iOS smart TVs. Download our app from the Google Play Store or the Apple App Store",
  },
  {
    icon: <FaLaptop />,
    title: "Laptops",
    description: "StreamVibe is optimized for both Android and iOS laptops. Download our app from the Google Play Store or the Apple App Store",
  },
  {
    icon: <FaGamepad />,
    title: "Gaming Consoles",
    description: "StreamVibe is optimized for both Android and iOS gaming consoles. Download our app from the Google Play Store or the Apple App Store",
  },
  {
    icon: <FaVrCardboard />,
    title: "VR Headsets",
    description: "StreamVibe is optimized for both Android and iOS VR headsets. Download our app from the Google Play Store or the Apple App Store",
  },
];

const DevicesSection = () => {
  return (
    <section className="devices-section">
      <div className="devices-header">
        <h2>We Provide you streaming experience across various devices.</h2>
        <p>
          With StreamVibe, you can enjoy your favorite movies and TV shows anytime, anywhere. Our platform is designed to be compatible with a wide range of
          devices, ensuring that you never miss a moment of entertainment.
        </p>
      </div>
      <div className="devices-container">
        {devices.map((device, index) => (
          <div key={index} className="device-card">
            <div className="device-top">
              <div className="icon-wrapper">
                {device.icon}
              </div>
              <h3>{device.title}</h3>
            </div>
            <p className="device-description">{device.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DevicesSection;
