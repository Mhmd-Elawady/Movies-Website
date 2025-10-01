import './App.css'

import { useDispatch } from 'react-redux'
import { useEffect } from 'react'
import axios from 'axios'
import { setBannerData, setImageURL } from './store/movieSlice'

import AppRoutes from './Routes/AppRoutes';
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
     <>

      <AppRoutes />

     </>
 
  )
}

export default App
