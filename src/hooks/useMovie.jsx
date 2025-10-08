import { useEffect, useState } from "react";

const API_KEY = "4f5be434fbfbc3e5d1718cbf7b949777";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const useMovie = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
   
    if (!id || isNaN(id)) {
      setLoading(false);
      setError("Invalid movie ID");
      return;
    }

    const controller = new AbortController();

    const fetchMovieData = async () => {
      try {
        setLoading(true);
        setError(null);

        
        const [movieResponse, creditsResponse, similarResponse, videosResponse] =
          await Promise.all([
            fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`, {
              signal: controller.signal,
            }),
            fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}`, {
              signal: controller.signal,
            }),
            fetch(`${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}`, {
              signal: controller.signal,
            }),
            fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}`, {
              signal: controller.signal,
            }),
          ]);

      
        if (!movieResponse.ok || !creditsResponse.ok || !similarResponse.ok || !videosResponse.ok) {
          throw new Error("Failed to fetch movie data");
        }

        const [movieData, creditsData, similarData, videosData] = await Promise.all([
          movieResponse.json(),
          creditsResponse.json(),
          similarResponse.json(),
          videosResponse.json(),
        ]);

      
        const trailer = videosData.results?.find(
          video => video.type === 'Trailer' && video.site === 'YouTube'
        );

       
        setData({
          movie: movieData,
          cast: creditsData.cast?.slice(0, 12) || [],
          similar: similarData.results?.slice(0, 8) || [],
          trailer: trailer || null,
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching movie data:", err);
          setError(err.message);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();

   
    return () => {
      controller.abort();
    };
  }, [id]);

  return {
    data,
    loading,
    error,
    IMG: IMAGE_BASE_URL,
  };
};

export default useMovie;