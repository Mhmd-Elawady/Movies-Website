import React from "react";
import MyNavbar from "../components/Homesection/Navbar/MyNavbar.jsx";
import PricingSection from "../components/Homesection/PricingSectionHero/PricingSection.jsx";
import ComparePlans from "../components/Subscriptions/ComparePlansHero/ComparePlans.jsx";
import Banner from "../components/Homesection/BannerHero/Banner.jsx";
import Footer from "../components/Homesection/FooterHero/Footer.jsx";
export default function Subscription() {
  return (
    <>
      <MyNavbar />
      <div style={{ marginTop: "120px", marginBottom: "10px" }}>
        <PricingSection />
      </div>
      <ComparePlans />
      <Banner />
      <Footer />
    </>
  );
}
