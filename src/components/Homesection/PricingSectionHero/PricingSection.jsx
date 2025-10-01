import React, { useState } from "react";
import "./PricingSection.css";

const PricingSection = () => {
  const [isMonthly, setIsMonthly] = useState(true);

  const plans = [
    {
      name: "Basic Plan",
      description: "Enjoy an extensive library of movies and shows, featuring a range of content, including recently released titles.",
      monthlyPrice: "$9.99",
      yearlyPrice: "$99.99",
    },
    {
      name: "Standard Plan",
      description: "Access to a wider selection of movies and shows, including most new releases and exclusive content.",
      monthlyPrice: "$12.99",
      yearlyPrice: "$129.99",
    },
    {
      name: "Premium Plan",
      description: "Access to a premium selection of movies and shows, including all new releases and Offline Viewing.",
      monthlyPrice: "$14.99",
      yearlyPrice: "$149.99",
    },
  ];

  return (
    <section className="pricing-section">
      <div className="pricing-header">
        <h2>Choose the plan that's right for you</h2>
        <p>
          Join StreamVibe and select from our flexible subscription options tailored to suit your viewing needs. Get ready for non-stop entertainment!
        </p>
        <div className="pricing-toggle">
          <span
            className={`toggle-option ${isMonthly ? "active" : ""}`}
            onClick={() => setIsMonthly(true)}
          >
            Monthly
          </span>
          <span
            className={`toggle-option ${!isMonthly ? "active" : ""}`}
            onClick={() => setIsMonthly(false)}
          >
            Yearly
          </span>
        </div>
      </div>
      <div className="pricing-container">
        {plans.map((plan, index) => (
          <div key={index} className="pricing-card">
            <h3>{plan.name}</h3>
            <p>{plan.description}</p>
            <div className="price">
              {isMonthly ? plan.monthlyPrice : plan.yearlyPrice}
              <span>/month</span>
            </div>
            <button className="start-trial">Start Free Trial</button>
            <button className="choose-plan">Choose Plan</button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;