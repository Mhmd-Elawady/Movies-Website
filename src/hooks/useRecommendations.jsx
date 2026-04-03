import { useEffect, useState } from "react";
import { apiClient } from "../services/tmdb";
import { getFavorites } from "../utils/helpers";

/**
 * Returns trending movies that are not already in the user's watchlist.
 *
 * @param {number} limit - Max number of recommendations to return (default 8)
 */
const useRecommendations = (limit = 8) => {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchRecs = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await apiClient.get("/trending/movie/week");

        if (!mounted) return;

        const watchlistIds = new Set(
          (getFavorites() ?? []).map((w) => Number(w.id))
        );

        const filtered = (data?.results ?? [])
          .filter((r) => r?.id && !watchlistIds.has(Number(r.id)))
          .slice(0, limit);

        setItems(filtered);
      } catch (err) {
        if (mounted) {
          console.error("[useRecommendations]", err);
          setError(err?.message ?? "Failed to fetch recommendations");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRecs();

    return () => { mounted = false; };
  }, [limit]);

  return { items, loading, error };
};

export default useRecommendations;