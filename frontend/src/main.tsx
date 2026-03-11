import './instrument';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import axios from 'axios';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

axios.defaults.baseURL = process.env.VITE_API_URL;

// Only send the API key to our own backend
axios.interceptors.request.use((config) => {
    const isInternal = config.url?.startsWith('/') || config.url?.startsWith(process.env.VITE_API_URL || '');
    if (isInternal && process.env.VITE_API_KEY) {
        config.headers.Authorization = `Bearer ${process.env.VITE_API_KEY}`;
    }
    return config;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
