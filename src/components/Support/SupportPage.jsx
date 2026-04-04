import React, { useState, useCallback, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./SupportPage.css";
import subContainer from "../../assets/Sub_Container.png";

const VALIDATION_RULES = {
  firstName: { required: true, message: "First name is required" },
  lastName: { required: true, message: "Last name is required" },
  email: {
    required: true,
    pattern: /\S+@\S+\.\S+/,
    message: "Email is invalid",
  },
  phone: {
    required: true,
    pattern: /^\d{10}$/,
    message: "Phone must be 10 digits",
  },
  message: { required: true, message: "Message is required" },
  agree: { required: true, message: "You must agree to the terms" },
};


const INITIAL_FORM_DATA = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  agree: false,
};

export default function SupportPage() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);


  const validateForm = useCallback(() => {
    const newErrors = {};

    Object.keys(VALIDATION_RULES).forEach((field) => {
      const rule = VALIDATION_RULES[field];
      const value = formData[field];

      if (rule.required) {
        if (typeof value === "boolean") {
          if (!value) newErrors[field] = rule.message;
        } else if (!value?.trim()) {
          newErrors[field] = rule.message;
        }
      }

      if (rule.pattern && value?.trim()) {
        if (!rule.pattern.test(value)) {
          newErrors[field] = rule.message;
        }
      }
    });

    return newErrors;
  }, [formData]);


  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);


  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));


    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);


      const firstErrorField = Object.keys(newErrors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.focus();
      }
      return;
    }


    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert(
        `Message Sent!\nThank you, ${formData.firstName}. We'll get back to you soon.`
      );


      setFormData(INITIAL_FORM_DATA);
      setErrors({});
    } catch (error) {
      alert("There was an error sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    const newErrors = validateForm();

    if (newErrors[name]) {
      setErrors(prev => ({ ...prev, [name]: newErrors[name] }));
    }
  }, [validateForm]);

  return (
    <div className="support-container d-flex justify-content-center align-items-center">
        <div className="container support-box row text-light gx-5">

        <section
          className="col-md-6 left-section mb-4 mb-md-0 "
          aria-labelledby="welcome-heading"
        >
          <h2 id="welcome-heading" className="fw-bold mb-3">
            Welcome to our<br />support page!
          </h2>
          <p className="text-muted mb-4">
            We're here to help you with any problems you may be having with our
            product.
          </p>
          <div className="image-container">
            <img
              src={subContainer}
              alt="Collection of movies and TV shows available on our platform"
              className="img-fluid rounded"
              loading="lazy"
            />
          </div>
        </section>

        <section
          className="col-md-6 right-section bg-dark p-4 rounded"
          aria-labelledby="support-form-heading"
        >
          <h3 id="support-form-heading" className="visually-hidden">
            Support Request Form
          </h3>

          <form onSubmit={handleSubmit} noValidate>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="firstName" className="form-label">
                  First Name *
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                  id="firstName"
                  name="firstName"
                  placeholder="Enter First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.firstName ? "firstNameError" : undefined}
                  aria-required="true"
                />
                {errors.firstName && (
                  <div id="firstNameError" className="invalid-feedback" role="alert">
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="lastName" className="form-label">
                  Last Name *
                </label>
                <input
                  type="text"
                  className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                  id="lastName"
                  name="lastName"
                  placeholder="Enter Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.lastName ? "lastNameError" : undefined}
                  aria-required="true"
                />
                {errors.lastName && (
                  <div id="lastNameError" className="invalid-feedback" role="alert">
                    {errors.lastName}
                  </div>
                )}
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  Email *
                </label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  id="email"
                  name="email"
                  placeholder="Enter your Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-describedby={errors.email ? "emailError" : undefined}
                  aria-required="true"
                />
                {errors.email && (
                  <div id="emailError" className="invalid-feedback" role="alert">
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <div className="d-flex align-items-start">

                  <div className="flex-grow-1">
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                      id="phone"
                      name="phone"
                      placeholder="Enter Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-describedby={errors.phone ? "phoneError" : undefined}
                      aria-required="true"
                    />
                    {errors.phone && (
                      <div id="phoneError" className="invalid-feedback" role="alert">
                        {errors.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="message" className="form-label">
                Message *
              </label>
              <textarea
                className={`form-control ${errors.message ? "is-invalid" : ""}`}
                id="message"
                name="message"
                rows="7"
                placeholder="Please describe your issue in detail..."
                value={formData.message}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby={errors.message ? "messageError" : undefined}
                aria-required="true"
              ></textarea>
              {errors.message && (
                <div id="messageError" className="invalid-feedback" role="alert">
                  {errors.message}
                </div>
              )}
            </div>

            <div className="form-check mb-4">
              <input
                type="checkbox"
                className={`form-check-input ${errors.agree ? "is-invalid" : ""}`}
                id="agree"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                aria-describedby={errors.agree ? "agreeError" : undefined}
                aria-required="true"
              />
              <label htmlFor="agree" className="form-check-label text-muted">
                I agree with Terms of Use and Privacy Policy *
              </label>
              {errors.agree && (
                <div id="agreeError" className="invalid-feedback d-block" role="alert">
                  {errors.agree}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-danger w-100 py-2 fw-semibold"
              disabled={isSubmitting || hasErrors}
              aria-describedby="submit-help"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>

            <div id="submit-help" className="form-text text-muted mt-2 text-center">
              * Required fields
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}