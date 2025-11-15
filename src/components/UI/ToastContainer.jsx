import React, { useEffect, useState } from 'react';
import './Toast.css';

let idSeq = 0;
export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (e) => {
      const detail = e.detail || {};
      const message = detail.message || '';
      const type = detail.type || 'info';
      const id = ++idSeq;
      setToasts((t) => [...t, { id, message, type }]);
      // auto remove after 2.5s
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, detail.duration || 2500);
    };

    window.addEventListener('app:toast', onToast);
    return () => window.removeEventListener('app:toast', onToast);
  }, []);

  return (
    <div className="app-toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className={`app-toast ${t.type}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
