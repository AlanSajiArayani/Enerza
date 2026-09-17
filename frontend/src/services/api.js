import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (username, password) => {
  const response = await api.post('/auth/login/', { username, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register/', userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me/');
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/profile/');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.patch('/profile/', profileData);
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get('/admin/users/');
  return response.data;
};

export const updateAdminUserStatus = async (userId, data) => {
  const response = await api.patch(`/admin/users/${userId}/`, data);
  return response.data;
};

export const getDashboardSummary = async (simulationTime = null) => {
  const url = simulationTime 
    ? `/dashboard/?simulation_time=${encodeURIComponent(simulationTime)}` 
    : '/dashboard/';
  const response = await api.get(url);
  return response.data;
};

export const getAppliances = async () => {
  const response = await api.get('/appliances/');
  return response.data;
};

export const getAlerts = async () => {
  const response = await api.get('/alerts/');
  return response.data;
};

export const getForecast = async () => {
  const response = await api.get('/forecast/');
  return response.data;
};

export const askAiAdvisor = async (question) => {
  const response = await api.post('/ai-advisor/', { question });
  return response.data;
};

export default api;

