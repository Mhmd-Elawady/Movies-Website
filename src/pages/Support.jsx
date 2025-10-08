import React from "react";
import MyNavbar from "../components/Homesection/Navbar/MyNavbar.jsx";
import SupportPage from "../components/Support/SupportPage.jsx";
import FaqSection from "../components/Homesection/FaqSectionHero/FaqSection.jsx";
import Banner from "../components/Homesection/BannerHero/Banner.jsx";
import Footer from "../components/Homesection/FooterHero/Footer.jsx";
export default function Support() {
  return (
    <>
      <MyNavbar />
      <SupportPage />
      <FaqSection />
      <Banner />
      <Footer />
    </>
  );
}
