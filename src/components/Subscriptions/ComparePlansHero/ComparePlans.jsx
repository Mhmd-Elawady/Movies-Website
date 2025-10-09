import React, { useState } from "react";
import "./ComparePlans.css";

const ComparePlans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    { id: "basic", name: "Basic", price: "$9.99/Month", popular: false },
    { id: "standard", name: "Standard", price: "$12.99/Month", popular: true },
    { id: "premium", name: "Premium", price: "$14.99/Month", popular: false },
  ];

  const features = [
    {
      name: "Price",
      basic: "$9.99/Month",
      standard: "$12.99/Month",
      premium: "$14.99/Month",
    },
    {
      name: "Content",
      basic: "Access to a wide selection of movies and shows, including some new releases.",
      standard: "Access to a wider selection of movies and shows, including most new releases and exclusive content.",
      premium: "Access to the widest selection of movies and shows, including all new releases and Offline Viewing.",
    },
    {
      name: "Devices",
      basic: "Watch on one device simultaneously",
      standard: "Watch on two devices simultaneously",
      premium: "Watch on four devices simultaneously",
    },
    {
      name: "Free Trial",
      basic: "7 Days",
      standard: "7 Days",
      premium: "7 Days",
    },
    {
      name: "Cancel Anytime",
      basic: "Yes",
      standard: "Yes",
      premium: "Yes",
    },
    {
      name: "HDR",
      basic: "No",
      standard: "Yes",
      premium: "Yes",
    },
    {
      name: "Dolby Atmos",
      basic: "No",
      standard: "Yes",
      premium: "Yes",
    },
    {
      name: "Ad-Free",
      basic: "No",
      standard: "Yes",
      premium: "Yes",
    },
    {
      name: "Offline Viewing",
      basic: "No",
      standard: "Yes, for select titles.",
      premium: "Yes, for all titles.",
    },
    {
      name: "Family Sharing",
      basic: "No",
      standard: "Yes, up to 5 family members.",
      premium: "Yes, up to 6 family members.",
    },
  ];

  const getFeatureIcon = (value) => {
    if (value === "Yes") return "✓";
    if (value === "No") return "✗";
    return value;
  };

  return (
    <div className="plans-container">
      <div className="plans-header">
        <h1>Compare our plans and find the right one for you</h1>
        <p>
          StreamVibe offers three different plans to fit your needs: Basic,
          Standard, and Premium. Compare the features of each plan and choose the
          one that's right for you.
        </p>
      </div>

 
      <div className="desktop-view">
        <table className="plans-table" role="table" aria-label="Comparison of streaming plans">
          <thead>
            <tr>
              <th scope="col" className="feature-header">Features</th>
              {plans.map((plan) => (
                <th 
                  key={plan.id} 
                  scope="col" 
                  className={`plan-header ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="plan-title">
                    {plan.name}
                    {plan.popular && <span className="popular-tag">Popular</span>}
                  </div>
                  <div className="plan-price">{plan.price}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={index}>
                <th scope="row" className="feature-name">{feature.name}</th>
                <td data-plan="Basic">{getFeatureIcon(feature.basic)}</td>
                <td data-plan="Standard">{getFeatureIcon(feature.standard)}</td>
                <td data-plan="Premium">{getFeatureIcon(feature.premium)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-view">
        <div className="plan-cards">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className="plan-card-header">
                <h3>{plan.name}</h3>
                {plan.popular && <span className="popular-tag">Popular</span>}
                <div className="plan-price">{plan.price}</div>
              </div>
              <div className="plan-features">
                {features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-name">{feature.name}:</span>
                    <span className="feature-value">{getFeatureIcon(feature[plan.id])}</span>
                  </div>
                ))}
              </div>
              <button className="select-plan-btn">
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComparePlans;