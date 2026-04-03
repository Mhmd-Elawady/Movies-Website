import { useMemo, useCallback } from "react";
import { apiClient, IMAGE_BASE_URL, normalizeTV } from "../services/tmdb";
import { createBoundedCache } from "../utils/helpers";
import useFetch, { fetchWithRetry } from "./UseFetch";

const cache = createBoundedCache(50);

/** Fetch and normalize all TV-show-related data from TMDB */
async function fetchTVShow(id, signal) {
  const get = (url) =>
    fetchWithRetry(() => apiClient.get(url, { signal }));

  const [
    { data: show },
    { data: credits },
    { data: videos },
    { data: similar },
  ] = await Promise.all([
    get(`/tv/${id}`),
    get(`/tv/${id}/credits`),
    get(`/tv/${id}/videos`),
    get(`/tv/${id}/similar`),
  ]);

  if (!show?.id) throw new Error("Invalid TV show data received from API");

  const trailers = (videos?.results ?? []).filter(
    (v) => v?.type === "Trailer" && v?.site === "YouTube" && v?.key
  );

  return {
    tvShow: normalizeTV(show),
    cast: (credits?.cast ?? []).filter((a) => a?.id).slice(0, 12),
    crew: (credits?.crew ?? []).filter((p) => p?.id).slice(0, 6),
    similar: (similar?.results ?? [])
      .filter((s) => s?.id)
      .slice(0, 12)
      .map(normalizeTV),
    trailers,
  };
}

// ─────────────────────────────────────────────

const useTVShow = (id) => {
  const { data, loading, error } = useFetch(id, fetchTVShow, cache);

  const trailers = data?.trailers ?? [];

  const getTrailerUrl = useCallback(
    () => (trailers[0]?.key ? `https://www.youtube.com/embed/${trailers[0].key}` : null),
    [trailers]
  );

  const hasTrailer = useCallback(() => trailers.length > 0, [trailers.length]);

  const getAllTrailers = useMemo(
    () =>
      trailers.map((t) => ({
        id:   t.id,
        key:  t.key,
        name: t.name,
        url:  `https://www.youtube.com/embed/${t.key}`,
      })),
    [trailers]
  );

  const getMainCast = useMemo(() => data?.cast?.slice(0, 8) ?? [], [data?.cast]);

  const getShowInfo = useMemo(() => {
    const s = data?.tvShow;
    if (!s) return null;
    return {
      title:        s.name,
      overview:     s.overview,
      rating:       s.vote_average,
      genres:       s.genres,
      firstAirDate: s.first_air_date,
      lastAirDate:  s.last_air_date,
      episodes:     s.number_of_episodes,
      seasons:      s.number_of_seasons,
      status:       s.status,
    };
  }, [data?.tvShow]);

  return {
    data,
    loading,
    error,
    IMG: IMAGE_BASE_URL,
    getTrailerUrl,
    hasTrailer,
    getAllTrailers,
    getMainCast,
    getShowInfo,
    trailers,
  };
};

export default useTVShow;