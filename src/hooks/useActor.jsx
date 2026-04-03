import { useMemo } from "react";
import { apiClient, IMAGE_BASE_URL } from "../services/tmdb";
import { createBoundedCache } from "../utils/helpers";
import useFetch from "./UseFetch";

const cache = createBoundedCache(50);

/** Returns age in years from a birthday string, or null if invalid. */
function calcAge(birthday) {
  if (!birthday) return null;
  const dob = new Date(birthday);
  if (isNaN(dob)) return null;
  const ageDt = new Date(Date.now() - dob.getTime());
  return Math.abs(ageDt.getUTCFullYear() - 1970);
}

/** Fetch and normalize actor + credits from TMDB */
async function fetchActor(id, signal) {
  const opts = { signal };

  const [personRes, movieRes, tvRes] = await Promise.all([
    apiClient.get(`/person/${id}`, opts),
    apiClient.get(`/person/${id}/movie_credits`, opts),
    apiClient.get(`/person/${id}/tv_credits`, opts),
  ]);

  const person = personRes?.data ?? null;

  const sortByPopularity = (arr) =>
    arr
      .filter((x) => x?.id)
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  return {
    person,
    famousMovies:         sortByPopularity(movieRes?.data?.cast ?? []).slice(0, 12),
    famousTV:             sortByPopularity(tvRes?.data?.cast   ?? []).slice(0, 8),
    biography:            person?.biography        ?? null,
    birthday:             person?.birthday         ?? null,
    age:                  calcAge(person?.birthday),
    knownForDepartment:   person?.known_for_department ?? null,
    placeOfBirth:         person?.place_of_birth   ?? null,
    alsoKnownAs:          Array.isArray(person?.also_known_as) ? person.also_known_as : [],
    homepage:             person?.homepage         ?? null,
    profilePath:          person?.profile_path     ?? null,
  };
}

// ─────────────────────────────────────────────

const useActor = (id) => {
  const { data, loading, error } = useFetch(id, fetchActor, cache);

  // Expose a ready-to-use image helper consistent with other hooks
  const getProfileUrl = useMemo(
    () => (data?.profilePath ? `${IMAGE_BASE_URL}${data.profilePath}` : null),
    [data?.profilePath]
  );

  return { data, loading, error, IMG: IMAGE_BASE_URL, getProfileUrl };
};

export default useActor;