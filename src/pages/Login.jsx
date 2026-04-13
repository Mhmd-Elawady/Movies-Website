/**
 * Login.jsx
 * Login page — Formik + Yup + Supabase signInWithPassword.
 *
 * FLOW:  Login → authenticate via Supabase → redirect to / (Home)
 */

import React, { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

/* ── Validation schema ───────────────────────────────────────── */
const LoginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

/* ── SVG icons ───────────────────────────────────────────────── */
const Icons = {
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  lock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  eyeOpen: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  eyeClosed: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  ),
  alertCircle: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  ),
  film: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M7 3v18M17 3v18M3 7.5h4M17 7.5h4M3 12h18M3 16.5h4M17 16.5h4" />
    </svg>
  ),
};

/* ── Component ───────────────────────────────────────────────── */
export default function Login() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, go straight to Home
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  // Redirect destination after login (default: Home)
  const redirectTo = location.state?.from?.pathname || "/";

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerError("");
    try {
      const { error } = await signIn({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        const msg = error.message?.toLowerCase().includes("invalid login")
          ? "Invalid email or password. Please try again."
          : error.message || "Login failed. Please try again.";
        setServerError(msg);
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (meta) => {
    if (meta.touched && meta.error) return "auth-input input-error";
    if (meta.touched && !meta.error && meta.value) return "auth-input input-success";
    return "auth-input";
  };

  return (
    <div className="auth-page" id="login-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">{Icons.film}</div>
        </div>

        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to continue to StreamVibe</p>
        </div>

        {serverError && (
          <div className="auth-server-error" role="alert">{serverError}</div>
        )}

        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={LoginSchema}
          validateOnBlur={true}
          validateOnChange={true}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="auth-form" noValidate>
              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">Email Address</label>
                <Field name="email">
                  {({ field, meta }) => (
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">{Icons.mail}</span>
                      <input {...field} id="login-email" type="email"
                        placeholder="you@example.com" autoComplete="email"
                        className={inputClass(meta)} />
                    </div>
                  )}
                </Field>
                {touched.email && errors.email && (
                  <span className="auth-error-msg" role="alert">
                    <span className="error-icon">{Icons.alertCircle}</span>
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-password">Password</label>
                <Field name="password">
                  {({ field, meta }) => (
                    <div className="auth-input-wrapper">
                      <span className="auth-input-icon">{Icons.lock}</span>
                      <input {...field} id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password" autoComplete="current-password"
                        className={inputClass(meta)} />
                      <button type="button" className="auth-password-toggle"
                        onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? Icons.eyeClosed : Icons.eyeOpen}
                      </button>
                    </div>
                  )}
                </Field>
                {touched.password && errors.password && (
                  <span className="auth-error-msg" role="alert">
                    <span className="error-icon">{Icons.alertCircle}</span>
                    {errors.password}
                  </span>
                )}
              </div>

              {/* Submit */}
              <button type="submit" className="auth-submit-btn"
                disabled={isSubmitting} id="login-submit-btn">
                <span className="btn-content">
                  {isSubmitting ? (
                    <><span className="auth-spinner" /> Signing In…</>
                  ) : "Sign In"}
                </span>
              </button>
            </Form>
          )}
        </Formik>

        <div className="auth-footer">
          Don't have an account?{" "}
          <Link to="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
