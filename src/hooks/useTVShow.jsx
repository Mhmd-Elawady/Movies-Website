import { useEffect, useState } from "react";

const API_KEY = "4f5be434fbfbc3e5d1718cbf7b949777";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const useTVShow = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id || isNaN(id)) {
      setLoading(false);
      setError("Invalid TV show ID");
      return;
    }

    const controller = new AbortController();

    const fetchTVShowData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [tvShowResponse, creditsResponse] = await Promise.all([
          fetch(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`, {
            signal: controller.signal,
          }),
          fetch(`${BASE_URL}/tv/${id}/credits?api_key=${API_KEY}`, {
            signal: controller.signal,
          }),
        ]);

        if (!tvShowResponse.ok || !creditsResponse.ok) {
          throw new Error("Failed to fetch TV show data");
        }

        const [tvShowData, creditsData] = await Promise.all([
          tvShowResponse.json(),
          creditsResponse.json(),
        ]);

        setData({
          tvShow: tvShowData,
          cast: creditsData.cast?.slice(0, 12) || [],
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching TV show data:", err);
          setError(err.message);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTVShowData();

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

export default useTVShow;