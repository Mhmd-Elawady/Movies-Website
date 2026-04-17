import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { FaRegListAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { AiOutlineHome, AiOutlineUser } from "react-icons/ai";
import {
  MdOutlineLocalMovies,
  MdOutlineContactSupport,
  MdOutlineSubscriptions,
} from "react-icons/md";
import "./MyNavbar.css";
import logo from "../../../assets/Logo.svg";
import { Link, useLocation } from "react-router-dom";
import SearchDropdown from "./SearchDropdown";
import { getFavorites } from "../../../utils/helpers";

const NAV_LINKS = [
  { to: "/",             label: "Home",           Icon: AiOutlineHome },
  { to: "/movies_shows", label: "Movies & Shows",  Icon: MdOutlineLocalMovies },
  { to: "/support",      label: "Support",         Icon: MdOutlineContactSupport },
  { to: "/subscription", label: "Subscriptions",   Icon: MdOutlineSubscriptions },
  { to: "/profile",      label: "Profile",         Icon: AiOutlineUser },
];

export default function MyNavbar() {
  const storeCount  = useSelector((s) => (s.watchlist?.items || []).length);
  const [count,     setCount]    = useState(0);
  const [bump,      setBump]     = useState(false);
  const [menuOpen,  setMenuOpen] = useState(false);
  const [scrolled,  setScrolled] = useState(false);
  const firstRender = useRef(true);
  const location    = useLocation();

  /* ── Sync favorites count ─────────────────────────────────── */
  const syncCount = useCallback(() => {
    const favs = getFavorites();
    setCount(Array.isArray(favs) ? favs.length : 0);
  }, []);

  useEffect(() => {
    syncCount();
    const onStorage = (e) => {
      if (!e.key || e.key === "myapp.favorites.v1") syncCount();
    };
    window.addEventListener("storage",         onStorage);
    window.addEventListener("favorites:change", syncCount);
    return () => {
      window.removeEventListener("storage",         onStorage);
      window.removeEventListener("favorites:change", syncCount);
    };
  }, [syncCount]);

  // Redux watchlist overrides local count when it has items
  useEffect(() => {
    if (typeof storeCount === "number" && storeCount > 0) setCount(storeCount);
  }, [storeCount]);

  /* ── Bump animation on count change ──────────────────────── */
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setBump(true);
    const t = setTimeout(() => setBump(false), 650);
    return () => clearTimeout(t);
  }, [storeCount]);

  /* ── Scroll detection ─────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close menu on route change ───────────────────────────── */
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* ── Lock body scroll ─────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  /* ── Close on ESC ─────────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /* ── Close on desktop resize ──────────────────────────────── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleMenu = useCallback(() => setMenuOpen((p) => !p), []);
  const closeMenu  = useCallback(() => setMenuOpen(false),     []);

  const displayCount = count > 99 ? "99+" : count;

  return (
    <>
      {/* ===== NAVBAR ===== */}
      <nav className={`navbar px-4 ${scrolled ? "scrolled" : ""}`} role="navigation" aria-label="Main navigation">
        {/* Logo */}
        <Link className="navbar-brand" to="/" aria-label="StreamVibe Home">
          <img src={logo} alt="StreamVibe" />
        </Link>

        {/* Desktop links */}
        <div className="links d-none d-md-flex" role="menubar">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              className={`nav-link ${location.pathname === to ? "active" : ""}`}
              to={to}
              role="menuitem"
              aria-current={location.pathname === to ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </div>


        {/* Mobile: search + watchlist + hamburger */}
        <div className="mobile-right d-flex d-md-none align-items-center gap-3">
          <SearchDropdown />

          <Link
            className="mobile-icon-btn"
            to="/watchlist"
            aria-label={`Watchlist, ${count} item${count !== 1 ? "s" : ""}`}
          >
            <FaRegListAlt size={20} />
            {count > 0 && (
              <span className={`mobile-badge ${bump ? "bump" : ""}`} aria-live="polite" aria-atomic="true">
                {displayCount}
              </span>
            )}
          </Link>

          <button
            className={`hamburger-btn ${menuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
          </button>
        </div>
      </nav>

      {/* ===== MOBILE OVERLAY BACKDROP ===== */}
      <div
        className={`mobile-backdrop ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* ===== MOBILE MENU ===== */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="mobile-menu-header">
          <Link className="navbar-brand" to="/" onClick={closeMenu} aria-label="StreamVibe Home">
            <img src={logo} alt="StreamVibe" />
          </Link>
          <button className="close-btn" onClick={closeMenu} aria-label="Close menu">
            <IoMdClose size={24} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="mobile-menu-links" aria-label="Mobile navigation links">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              className={`mobile-nav-link ${location.pathname === to ? "active" : ""}`}
              to={to}
              onClick={closeMenu}
              aria-current={location.pathname === to ? "page" : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}