import React from 'react'
import MyNavbar from '../components/Homesection/Navbar/MyNavbar'
import StreamVibe from '../components/Homesection/StreamVibeHero/StreamVibe'
import CategorySlider from '../components/Homesection/CategorySliderHero/CategorySlider'
import DevicesSection from '../components/Homesection/DevicesSectionHero/DevicesSection'
import FaqSection from '../components/Homesection/FaqSectionHero/FaqSection'
import PricingSection from '../components/Homesection/PricingSectionHero/PricingSection'
import Banner from '../components/Homesection/BannerHero/Banner'
import Footer from '../components/Homesection/FooterHero/Footer'
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
