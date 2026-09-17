import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardSummary = async () => {
  const response = await api.get('/dashboard/');
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
