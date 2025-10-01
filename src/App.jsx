import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Shows from './pages/Shows'
import MoviesOpen from './pages/MoviesOpen'
import ShowsOpen from './pages/ShowsOpen'
import Support from './pages/Support'
import Subscription from './pages/Subscription'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import axios from 'axios'
import { setBannerData, setImageURL } from './store/movieSlice'

function App() {
  const dispatch = useDispatch()

  const fetchTrendingData = async () => {
    try {
      const response = await axios.get('/trending/all/week')
      dispatch(setBannerData(response.data.results))
    } catch (error) {
      console.log('error', error)
    }
  }

  const fetchConfiguration = async () => {
    try {
      const response = await axios.get('/configuration')
      dispatch(setImageURL(response.data.images.secure_base_url + 'original'))
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    fetchTrendingData()
    fetchConfiguration()
  }, [])

  return (
   
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/shows' element={<Shows />} />
        <Route path='/moviesOpen' element={<MoviesOpen />} />
        <Route path='/showsOpen' element={<ShowsOpen />} />
        <Route path='/support' element={<Support />} />
        <Route path='/subscription' element={<Subscription />} />
      </Routes>
 
  )
}

export default App
