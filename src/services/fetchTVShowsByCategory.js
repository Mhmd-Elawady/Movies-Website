import axios from "axios";

const API_KEY = "4f5be434fbfbc3e5d1718cbf7b949777"; 
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";


const generateRandomDuration = () => {
  const hours = Math.floor(Math.random() * 3) + 1;
  const minutes = Math.floor(Math.random() * 60);
  return `${hours}h ${minutes}m`;
};


const generateRandomYear = () => {
  return Math.floor(Math.random() * 25) + 2000;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  params: {
    api_key: API_KEY,
    language: "en-US",
    include_adult: false 
  }
});

export async function fetchTVShowsByCategory(category) {
  const endpoints = {
    genres: "/genre/tv/list",
    trending: "/trending/tv/week",
    newReleases: "/tv/on_the_air",
    mustWatch: "/tv/top_rated"
  };

  const endpoint = endpoints[category];
  
  if (!endpoint) {
    console.warn(`Unknown category: ${category}`);
    return [];
  }

  try {
    const { data } = await apiClient.get(endpoint);

  
    if (category === "genres") {
      const genresWithImages = await Promise.all(
        data.genres.map(async (genre) => {
          try {
            const { data: shows } = await apiClient.get(`/discover/tv`, {
              params: { 
                with_genres: genre.id, 
                sort_by: "popularity.desc", 
                page: 1,
                include_adult: false 
              }
            });

          
            const safeShow = shows.results.find(s => !s.adult);

            return {
              id: genre.id,
              title: genre.name,
              img: safeShow?.poster_path 
                ? `${IMAGE_BASE_URL}${safeShow.poster_path}`
                : `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(genre.name)}`,
              rating: (Math.random() * 3 + 7).toFixed(1),
              duration: generateRandomDuration(),
              year: generateRandomYear(),
              genre: genre.name,
              type: "tvshow"
            };
          } catch {
            return {
              id: genre.id,
              title: genre.name,
              img: `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(genre.name)}`,
              rating: (Math.random() * 3 + 7).toFixed(1),
              duration: generateRandomDuration(),
              year: generateRandomYear(),
              genre: genre.name,
              type: "tvshow"
            };
          }
        })
      );
      return genresWithImages;
    }

 
    return data.results
      .filter(show => !show.adult) 
      .map((show) => ({
        id: show.id,
        title: show.name,
        img: show.poster_path
          ? `${IMAGE_BASE_URL}${show.poster_path}`
          : `https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image`,
        rating: show.vote_average 
          ? show.vote_average.toFixed(1) 
          : (Math.random() * 3 + 7).toFixed(1),
        duration: generateRandomDuration(),
        year: show.first_air_date 
          ? new Date(show.first_air_date).getFullYear() 
          : generateRandomYear(),
        genre: "TV Show",
        type: "tvshow"
      }));

  } catch (err) {
    console.error(`Error fetching TV shows ${category}:`, err.message);
    return [];
  }
}
