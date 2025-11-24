import { useEffect, useState, useMemo } from "react";
import { apiClient } from "../services/tmdb";
import { parseNumericId, createBoundedCache } from "../utils/helpers";

const actorCache = createBoundedCache(50);

const calcAge = (birthday) => {
  if (!birthday) return null;
  try {
    const dob = new Date(birthday);
    if (isNaN(dob)) return null;
    const diff = Date.now() - dob.getTime();
    const ageDt = new Date(diff);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  } catch {
    return null;
  }
};

const useActor = (id) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const numericId = parseNumericId(id);
    if (!numericId) {
      setLoading(false);
      setError("Invalid actor ID");
      return;
    }

    if (actorCache.has(numericId)) {
      setData(actorCache.get(numericId));
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchActor = async () => {
      try {
        setLoading(true);
        setError(null);

        const [personRes, movieCreditsRes, tvCreditsRes] = await Promise.all([
          apiClient.get(`/person/${numericId}`, { signal: controller.signal }),
          apiClient.get(`/person/${numericId}/movie_credits`, { signal: controller.signal }),
          apiClient.get(`/person/${numericId}/tv_credits`, { signal: controller.signal }),
        ]);

        if (!isMounted) return;

        const person = personRes?.data || null;
        const movieCredits = Array.isArray(movieCreditsRes?.data?.cast)
          ? movieCreditsRes.data.cast
          : [];
        const tvCredits = Array.isArray(tvCreditsRes?.data?.cast)
          ? tvCreditsRes.data.cast
          : [];

        // Sort credits by popularity / release date where possible and pick top items
        const famousMovies = movieCredits
          .filter((m) => m && m.id)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 12);

        const famousTV = tvCredits
          .filter((t) => t && t.id)
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 8);

        const normalized = {
          person,
          famousMovies,
          famousTV,
          biography: person?.biography || null,
          birthday: person?.birthday || null,
          age: calcAge(person?.birthday),
          known_for_department: person?.known_for_department || null,
          place_of_birth: person?.place_of_birth || null,
          also_known_as: Array.isArray(person?.also_known_as) ? person.also_known_as : [],
          homepage: person?.homepage || null,
          profile_path: person?.profile_path || null,
        };

        actorCache.set(numericId, normalized);
        setData(normalized);
      } catch (err) {
        if (err.name !== "AbortError" && isMounted) {
          console.error("Error fetching actor data:", err);
          setError(err.message || "Failed to fetch actor data");
        }
        setData(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchActor();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  return { data, loading, error };
};

export default useActor;
