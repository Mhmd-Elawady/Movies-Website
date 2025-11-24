import { useEffect, useState } from 'react';
import { apiClient } from '../services/tmdb';
import { getFavorites } from '../utils/helpers';

// Simple recommendations: fetch trending movies and exclude those in watchlist
export default function useRecommendations(limit = 8) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchRecs = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get('/trending/movie/week');
        if (!mounted) return;
        const watchlist = getFavorites() || [];
        const watchIds = new Set(watchlist.map((w) => Number(w.id)));
        const results = Array.isArray(data?.results) ? data.results : [];
        const filtered = results.filter((r) => r && r.id && !watchIds.has(Number(r.id))).slice(0, limit);
        setItems(filtered);
      } catch (err) {
        console.error('Failed to fetch recommendations', err);
        setError(err?.message || 'Failed');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchRecs();
    return () => { mounted = false; };
  }, [limit]);

  return { items, loading, error };
}
