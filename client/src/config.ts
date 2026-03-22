const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE = isLocal 
    ? 'http://localhost:8000/api' 
    : (import.meta.env.VITE_API_BASE_URL || 'https://studygenie-1-o65o.onrender.com/api');