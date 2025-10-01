import React from 'react'
import MyNavbar from '../components/Homesection/Navbar/MyNavbar.jsx'
import StreamVibe from '../components/Homesection/StreamVibeHero/StreamVibe.jsx'
import CategorySlider from '../components/Homesection/CategorySliderHero/CategorySlider.jsx'
import DevicesSection from '../components/Homesection/DevicesSectionHero/DevicesSection.jsx'
import FaqSection from '../components/Homesection/FaqSectionHero/FaqSection.jsx'
import PricingSection from '../components/Homesection/PricingSectionHero/PricingSection.jsx'
import Banner from '../components/Homesection/BannerHero/Banner.jsx'
import Footer from '../components/Homesection/FooterHero/Footer.jsx'
export default function Home() {
  return (
    <>
      <MyNavbar/>
      <StreamVibe/>
      <CategorySlider/>
      <DevicesSection/>
      <FaqSection/>
      <PricingSection/>
      <Banner/>
      <Footer/>
    </>
  )
}
