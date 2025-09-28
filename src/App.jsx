import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Shows from './pages/Shows'
import MoviesOpen from './pages/MoviesOpen'
import ShowsOpen from './pages/ShowsOpen'
import Support from './pages/Support'
import Subscription from './pages/Subscription'


function App() {
  return (
    <>
 <Routes>
  <Route path='/' element={<Home/>}/>
  <Route path='/shows' element={<Shows/>}/>
  <Route path='/movies/:id' element={<MoviesOpen/>}/>
  <Route path='/shows/:id' element={<ShowsOpen/>}/>
  <Route path='/support' element={<Support/>}/>
  <Route path='/subscription' element={<Subscription/>}/>
</Routes>
</>
  )
}
export default App
