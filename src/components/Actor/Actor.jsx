import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import useActor from "../../hooks/useActor";
import MyNavbar from "../Homesection/Navbar/MyNavbar";
import { buildImageUrl } from "../../utils/helpers";
import "./Actor.css";
import { FaArrowLeft } from "react-icons/fa";

export default function Actor() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();
  const { data, loading, error } = useActor(id);

  const fromState          = location?.state?.from || null;
  const [referrerMoviePath, setReferrerMoviePath] = useState(null);

  const person = data?.person || {};

  const profileSrc = useMemo(() =>
    buildImageUrl(
      data?.profile_path,
      "w500",
      "https://via.placeholder.com/400x600?text=No+Image"
    ),
    [data?.profile_path]
  );

  /* Detect same-origin movie referrer (new-tab case) */
  useEffect(() => {
    try {
      if (typeof document !== "undefined" && document.referrer) {
        const ref = new URL(document.referrer);
        if (
          ref.origin === window.location.origin &&
          ref.pathname.startsWith("/movie/")
        ) {
          setReferrerMoviePath(ref.pathname + ref.search + ref.hash);
        }
      }
    } catch (_) { /* ignore malformed referrer */ }
  }, []);

  /* Back navigation with priority chain */
  const handleBack = () => {
    if (fromState)          { navigate(fromState);          return; }
    if (referrerMoviePath)  { navigate(referrerMoviePath);  return; }
    if (window.history.length > 1) { navigate(-1);          return; }
    navigate("/", { replace: true });
  };

  if (loading) return null;

  if (error) return (
    <div>
      <MyNavbar />
      <main className="actor-main-a">
        <button className="actor-back-a" onClick={handleBack}>
          <FaArrowLeft /> Back
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
        <button className="actor-back-a" onClick={handleBack}>
          <FaArrowLeft /> Back
        </button>

        {/* ── Hero: Photo + Info ── */}
        <section className="actor-hero-a">

          {/* Photo */}
          <div className="actor-photo-a">
            <img
              src={profileSrc}
              alt={person.name || "Actor"}
              loading="eager"
            />
          </div>

          <div className="actor-summary-a">
            <h1 className="actor-name-a">{person.name}</h1>

            <div className="actor-meta-a">
              {data?.age        && <span>{data.age} yrs</span>}
              {data?.age && data?.place_of_birth && <span className="sep-a">•</span>}
              {data?.place_of_birth && <span>{data.place_of_birth}</span>}
            </div>

            <p className="actor-bio-title-a">About</p>
            <p className="actor-bio-a">
              {data?.biography || "Biography not available."}
            </p>
          </div>
        </section>

        {/* ── Famous Movies ── */}
        <section className="actor-section-a">
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
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/movie/${m.id}`)}
                  aria-label={`View ${m.title || m.name}`}
                >
                  <img
                    src={buildImageUrl(
                      m.poster_path,
                      "w300",
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

      </main>
    </div>
  );
}