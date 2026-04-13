import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useActor from "../../hooks/useActor";
import MyNavbar from "../Homesection/Navbar/MyNavbar";
import { buildImageUrl } from "../../utils/helpers";
import "./Actor.css";
import { FaArrowLeft } from "react-icons/fa";
import MovieReviews from "../Moviereviews/Moviereviews";

export default function Actor() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { data, loading, error } = useActor(id);

  const fromState         = location?.state?.from || null;
  const [referrerPath, setReferrerPath] = useState(null);

  /* Detect same-origin referrer (movie or TV) */
  useEffect(() => {
    try {
      if (typeof document !== "undefined" && document.referrer) {
        const ref = new URL(document.referrer);
        if (
          ref.origin === window.location.origin &&
          (ref.pathname.startsWith("/movie/") || ref.pathname.startsWith("/tv/"))
        ) {
          setReferrerPath(ref.pathname + ref.search + ref.hash);
        }
      }
    } catch (_) { /* ignore malformed referrer */ }
  }, []);

  /* Back navigation priority chain */
  const handleBack = () => {
    if (fromState)       { navigate(fromState);      return; }
    if (referrerPath)    { navigate(referrerPath);   return; }
    if (window.history.length > 1) { navigate(-1);   return; }
    navigate("/", { replace: true });
  };

  const profileSrc = useMemo(() =>
    buildImageUrl(
      data?.profilePath,
      "w500",
      "https://via.placeholder.com/400x600?text=No+Image"
    ),
    [data?.profilePath]
  );

  // Prefix with "actor-" so reviews are stored separately from movies/TV
  const reviewsId = `actor-${id}`;

  if (loading) return null;

  if (error) return (
    <div>
      <MyNavbar />
      <main className="actor-main-a">
        <button className="actor-back-a" onClick={handleBack} aria-label="Go back">
          <FaArrowLeft aria-hidden="true" /> Back
        </button>
        <p className="actor-error-a">Failed to load actor information.</p>
      </main>
    </div>
  );

  return (
    <div>
      <MyNavbar />
      <main className="actor-main-a">

        {/* ── Back Button ── */}
        <button className="actor-back-a" onClick={handleBack} aria-label="Go back">
          <FaArrowLeft aria-hidden="true" /> Back
        </button>

        {/* ── Hero: Photo + Info ── */}
        <section className="actor-hero-a" aria-label={`${data?.person?.name || "Actor"} profile`}>

          <div className="actor-photo-a">
            <img
              src={profileSrc}
              alt={data?.person?.name || "Actor"}
              loading="eager"
            />
          </div>

          <div className="actor-summary-a">
            <h1 className="actor-name-a">{data?.person?.name}</h1>

            <div className="actor-meta-a">
              {data?.age && <span>{data.age} yrs</span>}
              {data?.age && data?.placeOfBirth && <span className="sep-a">•</span>}
              {data?.placeOfBirth && <span>{data.placeOfBirth}</span>}
            </div>

            <p className="actor-bio-title-a">About</p>
            <p className="actor-bio-a">
              {data?.biography || "Biography not available."}
            </p>
          </div>
        </section>

        {/* ── Famous Movies ── */}
        <section className="actor-section-a" aria-label="Famous movies">
          <h2 className="actor-section-title-a">Famous Movies</h2>
          <div className="actor-cards-a">
            {data?.famousMovies?.length ? (
              data.famousMovies.map((m) => (
                <div
                  key={m.id}
                  className="actor-card-a"
                  onClick={() => navigate(`/movie/${m.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") navigate(`/movie/${m.id}`);
                  }}
                  aria-label={`View ${m.title || m.name}`}
                >
                  <img
                    src={buildImageUrl(
                      m.poster_path, "w300",
                      "https://via.placeholder.com/200x300?text=No+Image"
                    )}
                    alt={m.title || m.name}
                    loading="lazy"
                  />
                  <div className="actor-card-title-a">{m.title || m.name}</div>
                </div>
              ))
            ) : (
              <p className="actor-no-movies-a">No movie credits found.</p>
            )}
          </div>
        </section>

        {/* ── Reviews ── */}
        <MovieReviews movieId={reviewsId} />

      </main>
    </div>
  );
}