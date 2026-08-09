import axios from "axios";
import { BaseUrlBB, BaseUrlItacha, BaseUrl, BaseUrlTest } from "./apiservice";


const api = axios.create({
  baseURL: BaseUrlTest,
});

// 🔥 REQUEST INTERCEPTOR (auto bearer)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🔥 RESPONSE INTERCEPTOR (auto logout)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("accessToken");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;