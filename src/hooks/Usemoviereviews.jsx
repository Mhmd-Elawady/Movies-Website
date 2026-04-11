/**
 * useMovieReviews.js
 * Fetches, submits, and deletes movie reviews from Supabase.
 * Subscribes to real-time inserts/deletes so the list stays fresh.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabase";

const TABLE = "movie_reviews";

/**
 * @param {string|number} movieId  – TMDB movie id
 * @param {object|null}   user     – Supabase auth user (or null)
 */
export default function useMovieReviews(movieId, user) {
  const [reviews,     setReviews]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState("");
  const channelRef = useRef(null);

  /* ── Fetch all reviews for this movie ──────────────────── */
  const fetchReviews = useCallback(async () => {
    if (!movieId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, user_id, user_name, body, created_at")
      .eq("movie_id", String(movieId))
      .order("created_at", { ascending: false });

    if (!error && data) setReviews(data);
    setLoading(false);
  }, [movieId]);

  /* ── Initial fetch ──────────────────────────────────────── */
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  /* ── Real-time subscription ─────────────────────────────── */
  useEffect(() => {
    if (!movieId) return;

    // Clean up previous channel if movieId changes
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`movie_reviews:${movieId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLE,
          filter: `movie_id=eq.${movieId}`,
        },
        (payload) => {
          setReviews((prev) => {
            // Avoid duplicates (optimistic insert may have already added it)
            if (prev.some((r) => r.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: TABLE,
        },
        (payload) => {
          setReviews((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [movieId]);

  /* ── Submit a new review ────────────────────────────────── */
  const submitReview = useCallback(
    async (body) => {
      const trimmed = body?.trim();
      if (!trimmed) return { error: "Review cannot be empty." };
      if (!user)    return { error: "You must be logged in to leave a review." };

      setSubmitting(true);
      setSubmitError("");

      const userName =
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Anonymous";

      const newReview = {
        movie_id:   String(movieId),
        user_id:    user.id,
        user_name:  userName,
        user_email: user.email || null,
        body:       trimmed,
      };

      // Optimistic insert — add immediately so the user sees it
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        ...newReview,
        id:         tempId,
        created_at: new Date().toISOString(),
      };
      setReviews((prev) => [optimistic, ...prev]);

      const { data, error } = await supabase
        .from(TABLE)
        .insert([newReview])
        .select()
        .single();

      setSubmitting(false);

      if (error) {
        // Roll back optimistic insert
        setReviews((prev) => prev.filter((r) => r.id !== tempId));
        const msg = error.message || "Failed to post review.";
        setSubmitError(msg);
        return { error: msg };
      }

      // Replace temp entry with the real one from DB
      setReviews((prev) =>
        prev.map((r) => (r.id === tempId ? data : r))
      );

      return { data };
    },
    [movieId, user]
  );

  /* ── Delete own review ──────────────────────────────────── */
  const deleteReview = useCallback(
    async (reviewId) => {
      if (!user) return;

      // Optimistic remove
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));

      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id); // safety: can only delete own

      if (error) {
        // Re-fetch to restore state
        fetchReviews();
        console.error("Delete review error:", error);
      }
    },
    [user, fetchReviews]
  );

  return {
    reviews,
    loading,
    submitting,
    submitError,
    setSubmitError,
    submitReview,
    deleteReview,
    refetch: fetchReviews,
  };
}