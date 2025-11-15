import React, { useEffect, useState, useRef } from "react";
import { useSelector } from 'react-redux';
import { Navbar, Nav, Container } from "react-bootstrap";
import { FaRegBell, FaRegListAlt } from "react-icons/fa";
import { IoIosSearch } from "react-icons/io";
import "bootstrap/dist/css/bootstrap.min.css";
import "./MyNavbar.css";
import logo from "../../../assets/Logo.svg";
import { Link } from "react-router-dom";
import SearchDropdown from "./SearchDropdown";
import { getFavorites } from "../../../utils/helpers";

export default function MyNavbar() {
  const [count, setCount] = useState(0);
  const storeCount = useSelector((s) => (s.watchlist?.items || []).length || 0);
  const [bump, setBump] = useState(false);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    const favs = getFavorites();
    setCount(Array.isArray(favs) ? favs.length : 0);

    // sync initial value from store if available
    if (storeCount && storeCount > 0) setCount(storeCount);

    // Listen for storage changes from other tabs/windows and custom events
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
    if (typeof storeCount === 'number') setCount(storeCount);
  }, [storeCount]);

  // Trigger bump animation when count changes (skip initial mount)
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    setBump(true);
    const t = setTimeout(() => setBump(false), 650);
    return () => clearTimeout(t);
  }, [storeCount]);

  return (
    <>
      <Navbar expand="lg" className="px-4">
        <Container
          fluid
          className="d-flex justify-content-between align-items-center"
        >
          <Navbar.Brand href="#">
            <img src={logo} alt="StreamVibe" />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="links ms-auto">
              <Nav.Link as={Link} to="/">
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/movies_shows">
                Movies & Shows
              </Nav.Link>
              <Nav.Link as={Link} to="/support">
                Support
              </Nav.Link>
              <Nav.Link as={Link} to="/subscription">
                Subscriptions
              </Nav.Link>
            </Nav>

            <Nav className="ms-auto" style={{ alignItems: "center" }}>
              {/* Inline SearchDropdown component - keeps existing layout and CSS unchanged */}
              <SearchDropdown />
              <Nav.Link as={Link} to="/watchlist" title={`Watchlist (${count})`}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <FaRegListAlt size={18} />
                  <span className={`watchlist-count ${bump ? 'bump' : ''}`} title={`${count} items in Watchlist`} aria-live="polite">{count > 99 ? '99+' : count}</span>
                </div>
              </Nav.Link>
              
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}
