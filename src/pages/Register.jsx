/**
 * Register.jsx
 * Registration page — Formik + Yup + Supabase signUp.
 *
 * FLOW:  Register → save to Supabase → redirect to /login
 */

import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useAuth } from "../context/AuthContext";
import "./Auth.css";

/* ── Validation schema ───────────────────────────────────────── */
const RegisterSchema = Yup.object().shape({
  fullName: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters")
    .matches(/^[a-zA-Z\s'-]+$/, "Only letters, spaces, hyphens and apostrophes")
    .required("Full name is required"),

  email: Yup.string()
    .trim()
    .email("Please enter a valid email address")
    .required("Email is required"),

  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Must contain at least one uppercase letter")
    .matches(/[a-z]/, "Must contain at least one lowercase letter")
    .matches(/[0-9]/, "Must contain at least one number")
    .matches(/[^A-Za-z0-9]/, "Must contain at least one special character")
    .required("Password is required"),

  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

/* ── Password strength ───────────────────────────────────────── */
function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 2) return { level: 1, label: "Weak",   cls: "strength-weak" };
  if (score === 3) return { level: 2, label: "Fair",   cls: "strength-fair" };
  if (score === 4) return { level: 3, label: "Good",   cls: "strength-good" };
  return              { level: 4, label: "Strong", cls: "strength-strong" };
}

/* ── SVG icons ───────────────────────────────────────────────── */
const Icons = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
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
export default function Register() {
  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  // If already logged in, go straight to Home
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values, { setSubmitting }) => {
    setServerError("");
    try {
      const { data, error } = await signUp({
        email: values.email.trim(),
        password: values.password,
        fullName: values.fullName.trim(),
      });

      if (error) {
        setServerError(error.message || "Registration failed. Please try again.");
      } else {
  
        setSuccess(true);
        setTimeout(() => navigate("/login"), 2000);
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

  // Success state
  if (success) {
    return (
      <div className="auth-page" id="register-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">{Icons.film}</div>
          </div>
          <div className="auth-success-msg">
            <strong>Account Created! 🎉</strong>
            Redirecting you to sign in…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page" id="register-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">{Icons.film}</div>
        </div>

        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join StreamVibe and start watching</p>
        </div>

        {serverError && (
          <div className="auth-server-error" role="alert">{serverError}</div>
        )}

        <Formik
          initialValues={{ fullName: "", email: "", password: "", confirmPassword: "" }}
          validationSchema={RegisterSchema}
          validateOnBlur={true}
          validateOnChange={true}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, errors, touched, values }) => {
            const strength = getPasswordStrength(values.password);
            return (
              <Form className="auth-form" noValidate>
                {/* Full Name */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-fullName">Full Name</label>
                  <Field name="fullName">
                    {({ field, meta }) => (
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">{Icons.user}</span>
                        <input {...field} id="reg-fullName" type="text"
                          placeholder="John Doe" autoComplete="name"
                          className={inputClass(meta)} />
                      </div>
                    )}
                  </Field>
                  {touched.fullName && errors.fullName && (
                    <span className="auth-error-msg" role="alert">
                      <span className="error-icon">{Icons.alertCircle}</span>
                      {errors.fullName}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-email">Email Address</label>
                  <Field name="email">
                    {({ field, meta }) => (
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">{Icons.mail}</span>
                        <input {...field} id="reg-email" type="email"
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
                  <label className="auth-label" htmlFor="reg-password">Password</label>
                  <Field name="password">
                    {({ field, meta }) => (
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">{Icons.lock}</span>
                        <input {...field} id="reg-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Min. 8 characters" autoComplete="new-password"
                          className={inputClass(meta)} />
                        <button type="button" className="auth-password-toggle"
                          onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                          aria-label={showPassword ? "Hide password" : "Show password"}>
                          {showPassword ? Icons.eyeClosed : Icons.eyeOpen}
                        </button>
                      </div>
                    )}
                  </Field>
                  {values.password && (
                    <>
                      <div className="password-strength">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={`password-strength-bar ${
                            i <= strength.level ? `filled ${strength.cls}` : ""
                          }`} />
                        ))}
                      </div>
                      <span className={`password-strength-label ${strength.cls}`}>
                        {strength.label}
                      </span>
                    </>
                  )}
                  {touched.password && errors.password && (
                    <span className="auth-error-msg" role="alert">
                      <span className="error-icon">{Icons.alertCircle}</span>
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="reg-confirmPassword">Confirm Password</label>
                  <Field name="confirmPassword">
                    {({ field, meta }) => (
                      <div className="auth-input-wrapper">
                        <span className="auth-input-icon">{Icons.lock}</span>
                        <input {...field} id="reg-confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Re-enter your password" autoComplete="new-password"
                          className={inputClass(meta)} />
                        <button type="button" className="auth-password-toggle"
                          onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                          aria-label={showConfirm ? "Hide password" : "Show password"}>
                          {showConfirm ? Icons.eyeClosed : Icons.eyeOpen}
                        </button>
                      </div>
                    )}
                  </Field>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <span className="auth-error-msg" role="alert">
                      <span className="error-icon">{Icons.alertCircle}</span>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>

                {/* Submit */}
                <button type="submit" className="auth-submit-btn"
                  disabled={isSubmitting} id="register-submit-btn">
                  <span className="btn-content">
                    {isSubmitting ? (
                      <><span className="auth-spinner" /> Creating Account…</>
                    ) : "Create Account"}
                  </span>
                </button>
              </Form>
            );
          }}
        </Formik>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
