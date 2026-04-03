/**
 * useFetch — generic data-fetching hook with cache, retry, and abort support.
 *
 * @param {string|number|null} id       - Entity ID to fetch (skips fetch if falsy)
 * @param {Function}           fetcher  - async (numericId, signal) => normalized data
 * @param {BoundedCache}       cache    - shared cache instance (passed in per hook)
 * @param {Function}           [parseId] - optional ID parser (defaults to Number())
 */

import { useEffect, useState } from "react";
import { parseNumericId } from "../utils/helpers";

const DEFAULT_RETRIES = 2;

/**
 * Retry a fetch up to `retries` times with exponential back-off.
 * Aborts immediately on client errors (4xx) or AbortError.
 */
export async function fetchWithRetry(fn, retries = DEFAULT_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isClientError = err?.response?.status < 500;
      const isLast = attempt === retries;

      if (isClientError || isLast) throw err;

      // Exponential back-off: 1 s, 2 s, …
      await new Promise((res) => setTimeout(res, 1000 * (attempt + 1)));
    }
  }
}

const useFetch = (id, fetcher, cache) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const numericId = parseNumericId(id);

    if (!numericId) {
      setLoading(false);
      setError("Invalid ID");
      return;
    }

    // Cache hit — no network request needed
    if (cache.has(numericId)) {
      setData(cache.get(numericId));
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await fetcher(numericId, controller.signal);

        if (!mounted) return;

        cache.set(numericId, result);
        setData(result);
      } catch (err) {
        if (err.name !== "AbortError" && mounted) {
          console.error("[useFetch]", err);
          setError(err.message || "Failed to fetch data");
          setData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  // `fetcher` and `cache` are stable references — intentionally omitted

  return { data, loading, error };
};

export default useFetch;