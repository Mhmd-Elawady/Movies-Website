/**
 * ProtectedRoute.jsx
 * Guards routes that require authentication.
 * - While loading: shows a spinner
 * - Not authenticated: redirects to /register
 * - Authenticated: renders children
 */

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#000",
      }}>
        <div className="auth-spinner" style={{
          width: 36,
          height: 36,
          border: "3px solid rgba(255,255,255,0.15)",
          borderTopColor: "#e50914",
          borderRadius: "50%",
          animation: "authSpinnerRotate 0.65s linear infinite",
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  return children;
}
