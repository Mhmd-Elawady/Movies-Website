import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { FaRegListAlt } from "react-icons/fa";
import { IoIosSearch, IoMdClose } from "react-icons/io";
import { HiOutlineMenuAlt3 } from "react-icons/hi";
import { AiOutlineHome } from "react-icons/ai";
import { MdOutlineLocalMovies, MdOutlineContactSupport, MdOutlineSubscriptions } from "react-icons/md";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MyNavbar.css";
import logo from "../../../assets/Logo.svg";
import { Link, useLocation } from "react-router-dom";
import SearchDropdown from "./SearchDropdown";
import { getFavorites } from "../../../utils/helpers";

export default function MyNavbar() {
  const [count, setCount] = useState(0);
  const storeCount = useSelector((s) => (s.watchlist?.items || []).length || 0);
  const [bump, setBump] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const firstRenderRef = useRef(true);
  const location = useLocation();

  // ---- Favorites count ----
  useEffect(() => {
    const favs = getFavorites();
    setCount(Array.isArray(favs) ? favs.length : 0);
    if (storeCount && storeCount > 0) setCount(storeCount);

    const onStorage = (e) => {
      if (e.key === null || e.key === undefined || e.key === "myapp.favorites.v1") {
        const updated = getFavorites();
        setCount(Array.isArray(updated) ? updated.length : 0);
      }
    };
    const onCustom = () => {
      const updated = getFavorites();
      setCount(Array.isArray(updated) ? updated.length : 0);
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("favorites:change", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("favorites:change", onCustom);
    };
  }, []);

  useEffect(() => {
    if (typeof storeCount === "number") setCount(storeCount);
  }, [storeCount]);

  // ---- Bump animation ----
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setBump(true);
    const t = setTimeout(() => setBump(false), 650);
    return () => clearTimeout(t);
  }, [storeCount]);

  // ---- Scroll detection ----
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---- Close menu on route change ----
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ---- Lock body scroll when menu open ----
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  // ---- Close menu on ESC ----
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ---- Close menu if screen resizes to desktop ----
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 600) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const navLinks = [
    { to: "/",              label: "Home",          Icon: AiOutlineHome },
    { to: "/movies_shows",  label: "Movies & Shows", Icon: MdOutlineLocalMovies },
    { to: "/support",       label: "Support",        Icon: MdOutlineContactSupport },
    { to: "/subscription",  label: "Subscriptions",  Icon: MdOutlineSubscriptions },
  ];

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className={`navbar px-4 ${scrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="StreamVibe" />
        </Link>

        {/* Desktop links */}
        <div className="links d-none d-md-flex">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              className={`nav-link ${location.pathname === to ? "active" : ""}`}
              to={to}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="nav-actions d-none d-md-flex align-items-center gap-2">
          <SearchDropdown />
          <Link
            className="nav-link"
            to="/watchlist"
            title={`Watchlist (${count})`}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <FaRegListAlt size={18} />
              <span
                className={`watchlist-count ${bump ? "bump" : ""}`}
                aria-live="polite"
              >
                {count > 99 ? "99+" : count}
              </span>
            </div>
          </Link>
        </div>

        {/* Mobile: icons + hamburger */}
        <div className="mobile-right d-flex d-md-none align-items-center gap-3">
          <SearchDropdown />
          <Link
            className="mobile-icon-btn"
            to="/watchlist"
            title={`Watchlist (${count})`}
          >
            <FaRegListAlt size={20} />
            {count > 0 && (
              <span className={`mobile-badge ${bump ? "bump" : ""}`} aria-live="polite">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <button
            className={`hamburger-btn ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </nav>

      {/* ===== MOBILE MENU OVERLAY ===== */}
      <div
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="mobile-menu-header">
          <Link className="navbar-brand" to="/" onClick={() => setMenuOpen(false)}>
            <img src={logo} alt="StreamVibe" />
          </Link>
          <button
            className="close-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Links in column */}
        <nav className="mobile-menu-links">
          {navLinks.map(({ to, label, Icon }) => (
            <Link
              key={to}
              className={`mobile-nav-link ${location.pathname === to ? "active" : ""}`}
              to={to}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}