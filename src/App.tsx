import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Game from './pages/Game'
import SpotifyCallback from './pages/SpotifyCallback'
import PageNotFound from './lib/PageNotFound'

function App() {
  const params = new URLSearchParams(window.location.search)
  const isSpotifyCallback = params.has('code') || params.has('error')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isSpotifyCallback ? <SpotifyCallback /> : <Home />} />
        <Route path="/play" element={<Game />} />
        <Route path="/callback" element={<SpotifyCallback />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
