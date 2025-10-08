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
    include_adult: false,
  },
});

export async function fetchMoviesByCategory(category) {
  const endpoints = {
    genres: "/genre/movie/list",
    trending: "/trending/movie/week",
    newReleases: "/movie/now_playing",
    mustWatch: "/movie/top_rated",
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
            const { data: movies } = await apiClient.get(`/discover/movie`, {
              params: {
                with_genres: genre.id,
                sort_by: "popularity.desc",
                page: 1,
                include_adult: false,
              },
            });

            const safeMovie = movies.results.find((m) => !m.adult);

            return {
              id: genre.id,
              title: genre.name,
              img: safeMovie?.poster_path
                ? `${IMAGE_BASE_URL}${safeMovie.poster_path}`
                : `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(
                    genre.name
                  )}`,
              rating: (Math.random() * 3 + 7).toFixed(1),
              duration: generateRandomDuration(),
              year: generateRandomYear(),
              genre: genre.name,
            };
          } catch {
            return {
              id: genre.id,
              title: genre.name,
              img: `https://via.placeholder.com/500x750/1a1a1a/ffffff?text=${encodeURIComponent(
                genre.name
              )}`,
              rating: (Math.random() * 3 + 7).toFixed(1),
              duration: generateRandomDuration(),
              year: generateRandomYear(),
              genre: genre.name,
            };
          }
        })
      );
      return genresWithImages;
    }

    return data.results
      .filter((movie) => !movie.adult)
      .map((movie) => ({
        id: movie.id,
        title: movie.title || movie.name,
        img: movie.poster_path
          ? `${IMAGE_BASE_URL}${movie.poster_path}`
          : `https://via.placeholder.com/500x750/1a1a1a/666666?text=No+Image`,
        rating: movie.vote_average
          ? movie.vote_average.toFixed(1)
          : (Math.random() * 3 + 7).toFixed(1),
        duration: generateRandomDuration(),
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : generateRandomYear(),
        genre: movie.genre_ids ? "Movie" : "Film",
      }));
  } catch (err) {
    console.error(`Error fetching ${category}:`, err.message);
    return [];
  }
}
