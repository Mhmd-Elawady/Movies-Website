import React, { useState } from "react";
import "./FaqSection.css";

const faqs = [
  {
    id: 1,
    question: "What is StreamVibe?",
    answer: "StreamVibe is a streaming service that allows you to watch movies and shows on demand.",
  },
  {
    id: 2,
    question: "How much does StreamVibe cost?",
    answer: "The cost of StreamVibe depends on the subscription plan you choose. Visit our pricing page for details.",
  },
  {
    id: 3,
    question: "What content is available on StreamVibe?",
    answer: "StreamVibe offers a wide range of movies, TV shows, and exclusive content across various genres.",
  },
  {
    id: 4,
    question: "How can I watch StreamVibe?",
    answer: "You can watch StreamVibe on smart TVs, smartphones, tablets, and more by downloading our app or visiting our website.",
  },
  {
    id: 5,
    question: "How do I sign up for StreamVibe?",
    answer: "You can sign up by visiting our website and creating an account with your email address.",
  },
  {
    id: 6,
    question: "What is the StreamVibe free trial?",
    answer: "StreamVibe offers a 7-day free trial for new users. Sign up to start your trial today!",
  },
  {
    id: 7,
    question: "How do I contact StreamVibe customer support?",
    answer: "You can contact us via email at support@streamvibe.com or through our help center.",
  },
  {
    id: 8,
    question: "What are the StreamVibe payment methods?",
    answer: "We accept credit cards, debit cards, and PayPal as payment methods.",
  },
];

const FaqSection = () => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <section className="faq-section">
      <div className="faq-header">
        <h2>Frequently Asked Questions</h2>
        <p>
          Got questions? We've got answers! Check out our FAQ section to find answers to the most common questions about StreamVibe.
        </p>
        
      </div>
      <div className="faq-container">
        <div className="faq-left">
          {faqs.slice(0, 4).map((faq) => (
            <div key={faq.id} className={`faq-item ${openFaq === faq.id ? "open" : ""}`}>
              <div
                className="faq-question"
                onClick={() => toggleFaq(faq.id)}
              >
                <span className="faq-number">{`0${faq.id}`}</span>
                <h3>{faq.question}</h3>
                <span className="faq-toggle">{openFaq === faq.id ? "-" : "+"}</span>
              </div>
              {openFaq === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="faq-right">
          {faqs.slice(4).map((faq) => (
            <div key={faq.id} className={`faq-item ${openFaq === faq.id ? "open" : ""}`}>
              <div
                className="faq-question"
                onClick={() => toggleFaq(faq.id)}
              >
                <span className="faq-number">{`0${faq.id}`}</span>
                <h3>{faq.question}</h3>
                <span className="faq-toggle">{openFaq === faq.id ? "-" : "+"}</span>
              </div>
              {openFaq === faq.id && (
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;