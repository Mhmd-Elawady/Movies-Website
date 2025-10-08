import React from 'react'
import MyNavbar from '../components/Homesection/Navbar/MyNavbar.jsx'
import MainSection from '../components/Movies&Shows/MainSectionHero/MainSection.jsx'
import MoviesSection from '../components/Movies&Shows/MoviesSectionHero/MoviesSection.jsx'
import Banner from '../components/Homesection/BannerHero/Banner.jsx'
import Footer from '../components/Homesection/FooterHero/Footer.jsx'
import MovieDetail from '../components/Movies&Shows/MovieDetailHero/MovieDetail.jsx'
import TVDetail from '../components/Movies&Shows/ShowsOpenHero/TVDetail.jsx'
export default function Movies_Shows() {
  return (
    <>
         <MyNavbar/>
         <MainSection/>
         <MoviesSection/>
         <MovieDetail/>
         <TVDetail/>
        <Banner/>
      <Footer/>
    </>
  )
}
