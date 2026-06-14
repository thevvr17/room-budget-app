import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/api`
    : "/api");

const api = axios.create({
  baseURL
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
