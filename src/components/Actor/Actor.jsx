import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import useActor from "../../hooks/useActor";
import MyNavbar from "../Homesection/Navbar/MyNavbar";
import { buildImageUrl } from "../../utils/helpers";
import "./Actor.css";
import { FaArrowLeft } from "react-icons/fa";
export default function Actor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useActor(id);
  const location = useLocation();
  const fromState = location?.state?.from || null;
  const [referrerMoviePath, setReferrerMoviePath] = useState(null);

  const person = data?.person || {};

  const profileSrc = useMemo(() => {
    return buildImageUrl(data?.profile_path, "w500", "https://via.placeholder.com/400x600?text=No+Image");
  }, [data?.profile_path]);

  useEffect(() => {
    // Detect if document.referrer is a same-origin movie detail (useful when opened in a new tab)
    try {
      if (typeof document !== "undefined" && document.referrer) {
        const ref = new URL(document.referrer);
        if (ref.origin === window.location.origin && ref.pathname.startsWith("/movie/")) {
          setReferrerMoviePath(ref.pathname + ref.search + ref.hash);
        }
      }
    } catch (e) {
      // ignore malformed referrer
    }
  }, []);

  if (loading) return null;
  if (error) return (
    <div>
      
      <main className="actor-main-a">
        <p className="actor-error-a">Failed to load actor information.</p>
      </main>
    </div>
  );

  return (
    <div>
      <MyNavbar />
      <main className="actor-main-a">
        <button
          className="actor-back-a"
          onClick={() => {
            // Priority order for Back button navigation:
            // 1) If fromState exists (passed by linking page), navigate there
            if (fromState) {
              navigate(fromState);
              return;
            }

            // 2) If referrer is a same-origin movie page, navigate there
            if (referrerMoviePath) {
              navigate(referrerMoviePath);
              return;
            }

            // 3) Try to go back in browser history
            if (window.history.length > 1) {
              navigate(-1);
              return;
            }

            // 4) Fallback: navigate to home page
            navigate("/", { replace: true });
          }}
        >
          <FaArrowLeft /> Back
        </button>
      

        <section className="actor-hero-a">
          <div className="actor-photo-a">
            <img src={profileSrc} alt={person.name || "Actor"} loading="eager" />
          </div>
          <div className="actor-summar-a">
            <h1 className="actor-name-a">{person.name}</h1>
            <div className="actor-meta-a">
              <span>{data?.age ? `${data.age} yrs` : null}</span>
              {data?.place_of_birth ? <span className="sep-a">•</span> : null}
              <span>{data?.place_of_birth}</span>
            </div>
            <p className="actor-bio-title-a">About the Actor</p>
            <p className="actor-bio-a">{data?.biography || "Biography not available."}</p>
          </div>
        </section>

        <section className="actor-section-a">
          <h2 className="actor-section-title-a">Famous Movies</h2>
          <div className="actor-cards-a">
            {data?.famousMovies?.length ? (
              data.famousMovies.map((m) => (
                <div key={m.id} className="actor-card-a" onClick={() => navigate(`/movie/${m.id}`)}>
                  <img src={buildImageUrl(m.poster_path, "w300", "https://via.placeholder.com/200x300?text=No+Image")} alt={m.title || m.name} loading="lazy" />
                  <div className="actor-card-title-a">{m.title || m.name}</div>
                </div>
              ))
            ) : (
              <p className="actor-no-movies-a">No movie credits found.</p>
            )}
          </div>
        </section>

        {/* More Info section removed as requested */}
      </main>
    </div>
  );
}