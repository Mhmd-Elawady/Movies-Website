/**
 * MovieReviews.jsx
 * Displays and manages user reviews for a single movie.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import useMovieReviews from "../../hooks/Usemoviereviews";
import "./MovieReviews.css";

const INITIAL_VISIBLE = 2;

/* ── Helpers ──────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

// Consistent color per user based on name
const AVATAR_COLORS = [
  "#e50914", "#c0392b", "#8e44ad", "#2980b9",
  "#16a085", "#d35400", "#27ae60", "#2c3e50",
];
function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/* ── Sub-components ───────────────────────────────────────── */

function Avatar({ name, size = 40 }) {
  return (
    <div
      className="review-avatar"
      style={{
        width: size,
        height: size,
        background: avatarColor(name),
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}

function ReviewCard({ review, currentUserId, onDelete }) {
  const isOwn = review.user_id === currentUserId;
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <article
      className={`review-card ${isOwn ? "review-card--own" : ""}`}
      aria-label={`Review by ${review.user_name}`}
    >
      <div className="review-card__header">
        <Avatar name={review.user_name} />
        <div className="review-card__meta">
          <span className="review-card__name">
            {review.user_name}
            {isOwn && <span className="review-card__you-badge">You</span>}
          </span>
          <time
            className="review-card__time"
            dateTime={review.created_at}
            title={new Date(review.created_at).toLocaleString()}
          >
            {timeAgo(review.created_at)}
          </time>
        </div>

        {isOwn && (
          <div className="review-card__actions">
            {confirmDelete ? (
              <>
                <button
                  className="review-card__action review-card__action--confirm"
                  onClick={() => { onDelete(review.id); setConfirmDelete(false); }}
                  aria-label="Confirm delete"
                >
                  Delete
                </button>
                <button
                  className="review-card__action review-card__action--cancel"
                  onClick={() => setConfirmDelete(false)}
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="review-card__action review-card__action--delete"
                onClick={() => setConfirmDelete(true)}
                aria-label="Delete review"
                title="Delete review"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="review-card__body">{review.body}</p>
    </article>
  );
}

/* ── Main Component ───────────────────────────────────────── */

export default function MovieReviews({ movieId }) {
  const { user } = useAuth();
  const {
    reviews,
    loading,
    submitting,
    submitError,
    setSubmitError,
    submitReview,
    deleteReview,
  } = useMovieReviews(movieId, user);

  const [text,        setText]        = useState("");
  const [showAll,     setShowAll]     = useState(false);
  const [charErr,     setCharErr]     = useState("");
  const textareaRef = useRef(null);
  const MAX_CHARS   = 1000;

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`;
  }, [text]);

  const handleTextChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) {
      setCharErr(`Maximum ${MAX_CHARS} characters.`);
      return;
    }
    setCharErr("");
    setSubmitError("");
    setText(val);
  }, [setSubmitError]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!text.trim()) { setCharErr("Please write something first."); return; }
    const { error } = await submitReview(text);
    if (!error) {
      setText("");
      setShowAll(false); // show from top
    }
  }, [text, submitReview]);

  const visibleReviews = showAll ? reviews : reviews.slice(0, INITIAL_VISIBLE);
  const hiddenCount    = reviews.length - INITIAL_VISIBLE;

  return (
    <section className="reviews-section" aria-label="User reviews">

      {/* ── Header ── */}
      <div className="reviews-header">
        <h2 className="reviews-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Reviews
        </h2>
        {reviews.length > 0 && (
          <span className="reviews-count" aria-live="polite">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        )}
      </div>

      {/* ── Write a review ── */}
      {user ? (
        <form
          className="reviews-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Write a review"
        >
          <div className="reviews-form__author">
            <Avatar name={
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] || "You"
            } size={36} />
            <span className="reviews-form__author-name">
              {user.user_metadata?.full_name || user.email?.split("@")[0] || "You"}
            </span>
          </div>

          <div className={`reviews-form__field ${charErr || submitError ? "reviews-form__field--error" : ""}`}>
            <textarea
              ref={textareaRef}
              className="reviews-form__textarea"
              placeholder="Share your thoughts about this movie…"
              value={text}
              onChange={handleTextChange}
              rows={3}
              maxLength={MAX_CHARS}
              aria-label="Review text"
              aria-describedby={charErr || submitError ? "review-error" : undefined}
              disabled={submitting}
            />
            <div className="reviews-form__footer">
              {(charErr || submitError) ? (
                <p id="review-error" className="reviews-form__error" role="alert">
                  {charErr || submitError}
                </p>
              ) : (
                <span className="reviews-form__char-count">
                  {text.length}/{MAX_CHARS}
                </span>
              )}
              <button
                type="submit"
                className="reviews-form__submit"
                disabled={submitting || !text.trim()}
                aria-busy={submitting}
              >
                {submitting ? (
                  <>
                    <span className="reviews-spinner" aria-hidden="true" />
                    Posting…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                         strokeLinejoin="round" aria-hidden="true">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Post Review
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="reviews-login-prompt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round"
               strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
          <span>
            <a href="/login" className="reviews-login-link">Sign in</a> to leave a review
          </span>
        </div>
      )}

      {/* ── Reviews list ── */}
      <div className="reviews-list" aria-live="polite" aria-label="Reviews list">
        {loading ? (
          <div className="reviews-loading">
            {[1, 2].map((i) => (
              <div key={i} className="review-skeleton">
                <div className="review-skeleton__avatar" />
                <div className="review-skeleton__lines">
                  <div className="review-skeleton__line review-skeleton__line--short" />
                  <div className="review-skeleton__line" />
                  <div className="review-skeleton__line review-skeleton__line--med" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">
            <div className="reviews-empty__icon" aria-hidden="true">💬</div>
            <p className="reviews-empty__title">No reviews yet</p>
            <p className="reviews-empty__sub">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <>
            {visibleReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                currentUserId={user?.id}
                onDelete={deleteReview}
              />
            ))}

            {/* Show more / less toggle */}
            {reviews.length > INITIAL_VISIBLE && (
              <div className="reviews-toggle">
                <button
                  className="reviews-toggle__btn"
                  onClick={() => setShowAll((p) => !p)}
                  aria-expanded={showAll}
                >
                  {showAll ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                           strokeLinejoin="round" aria-hidden="true">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                      Show Less
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                           strokeLinejoin="round" aria-hidden="true">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                      Show {hiddenCount} More {hiddenCount === 1 ? "Review" : "Reviews"}
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}