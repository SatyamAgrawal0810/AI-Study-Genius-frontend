import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://ai-study-genius-backend.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Token automatically add karo
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;