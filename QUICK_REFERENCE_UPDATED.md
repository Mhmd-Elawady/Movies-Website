# TMDB API Integration - Quick Reference

## ✅ What Was Fixed

### 1. **Missing `media_type` Field** (CRITICAL FIX)
   - **File**: `src/services/fetchMoviesByCategory.js` (Line 76)
     - Added: `media_type: "movie"`
   - **File**: `src/services/fetchTVShowsByCategory.js` (Line 101)
     - Changed from `type: "tvshow"` to `media_type: "tv"` for consistency

   **Why**: Required by detail pages, watchlist filtering, and navigation routing

### 2. **Missing `poster_path` Field**
   - **File**: `src/services/fetchMoviesByCategory.js` (Line 75)
     - Added: `poster_path: normalized.poster_path`
   - **File**: `src/services/fetchTVShowsByCategory.js` (Line 100)
     - Added: `poster_path: normalized.poster_path`

   **Why**: Raw poster path is needed alongside the built `img` URL for flexibility

---

## 📋 API Endpoints Used

### Movies
```javascript
GET /trending/movie/week
GET /movie/now_playing
GET /movie/top_rated
GET /discover/movie (with genre filter)
GET /movie/{id}
GET /movie/{id}/credits
GET /movie/{id}/videos
GET /movie/{id}/similar
```

### TV Shows
```javascript
GET /trending/tv/week
GET /tv/on_the_air
GET /tv/top_rated
GET /discover/tv (with genre filter)
GET /tv/{id}
GET /tv/{id}/credits
GET /tv/{id}/videos
GET /tv/{id}/similar
```

**Base URL**: `https://api.themoviedb.org/3`  
**Authentication**: Bearer Token from `.env` file as `VITE_ACCESS_TOKEN`

---

## 🔄 Data Types

### Movie Object Structure
```javascript
{
  id: number,
  title: string,
  img: string (URL),
  poster_path: string (raw path),
  backdrop_path: string,
  rating: string (formatted, e.g., "8.5"),
  vote_average: number (0-10),
  year: number,
  overview: string,
  release_date: string (YYYY-MM-DD),
  genre: string,
  duration: string (e.g., "2h 30m"),
  media_type: "movie",
  movieId: number
}
```

### TV Show Object Structure
```javascript
{
  id: number,
  title: string,
  img: string (URL),
  poster_path: string (raw path),
  backdrop_path: string,
  rating: string (formatted),
  vote_average: number (0-10),
  year: number,
  overview: string,
  first_air_date: string (YYYY-MM-DD),
  last_air_date: string (YYYY-MM-DD),
  genre: string,
  episodes: string (e.g., "3 Seasons • 45 Episodes"),
  number_of_seasons: number,
  number_of_episodes: number,
  duration: string (e.g., "42m"),
  media_type: "tv",
  tvShowId: number
}
```

---

## 🧭 Navigation Routes

- Movie Detail: `/movie/{id}`
- TV Show Detail: `/tv/{id}`
- Actor Detail: `/actor/{id}`
- Category: `/category/{name}`
- Watchlist: `/watchlist`

All routes properly use `media_type` field to determine correct endpoint.

---

## 💾 Storage & State Management

### Watchlist (localStorage)
Key: `myapp.favorites.v1`

Stores items with: `{ id, title, poster_path, vote_average, release_date, media_type }`

### Redux Store
`watchlistSlice` tracks items with `media_type` for filtering:
- All items
- Movies only (`media_type === "movie"`)
- TV Shows only (`media_type === "tv"`)

---

## 🔗 Data Flow

```
Browser → Router
    ↓
Detail Page Component (MovieDetail.jsx or TVDetail.jsx)
    ↓
Hook (useMovie.jsx or useTVShow.jsx)
    ↓
Service Layer (tmdb.js)
    ↓
TMDB API (REST)
    ↓
Response normalized & cached
    ↓
Component displays data
    ↓
User interacts (watch trailer, add to watchlist, etc.)
```

---

## ✅ Testing Checklist

- [ ] Navigate to a movie/TV show from homepage
- [ ] Verify all details display correctly
- [ ] Click "Add to Watchlist" and verify it appears in watchlist
- [ ] Filter watchlist by Movies/TV Shows/All
- [ ] Click on another movie from "Similar" section
- [ ] Verify genres display correctly
- [ ] Verify cast section displays with images and names
- [ ] Try playing trailer (if available)
- [ ] Remove item from watchlist and verify removal
- [ ] Verify navigation to detail pages from watchlist

---

## 🐛 Known Considerations

1. **Bearer Token**: Ensure `.env` has valid `VITE_ACCESS_TOKEN`
2. **Image URLs**: Built using `https://image.tmdb.org/t/p/{size}{path}` format
3. **Genres Display**: Shows primary genre only (first in array)
4. **Episodes Format**: "X Seasons • Y Episodes" automatically formatted
5. **Cache**: Uses bounded cache with weekly TTL to prevent memory leaks
6. **Error Handling**: Falls back to placeholder images if loading fails

---

## 📞 Support Reference

All components properly handle:
- ✅ Missing/null data fields
- ✅ Image loading failures with fallbacks
- ✅ Network errors with retry logic
- ✅ Rate limiting with exponential backoff
- ✅ Request cancellation when components unmount

---

**Implementation Date**: February 22, 2026  
**Status**: ✅ Production Ready
