import axios from "axios";
import { lookInSession, storeInSession, logOutUser } from "./session";

// Create a custom axios instance that all components will use
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true, // Required so the httpOnly refreshToken cookie is sent
});

// Track whether a token refresh is already in progress
let isRefreshing = false;
// Queue of failed requests waiting for the new token
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ---- RESPONSE INTERCEPTOR ----
// This runs on EVERY response. If the server says "token expired",
// we silently refresh and retry. If refresh also fails, we force logout.
api.interceptors.response.use(
  (response) => response, // Success: pass through
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 with ACCESS_TOKEN_EXPIRED, and only retry once
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "ACCESS_TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the backend refresh endpoint (httpOnly cookie is sent automatically)
        const { data } = await axios.post(
          import.meta.env.VITE_BACKEND_URL + "/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newAccessToken = data.access_token;

        // Update sessionStorage with the new token
        let userInSession = lookInSession("user");
        if (userInSession) {
          userInSession.access_token = newAccessToken;
          storeInSession("user", userInSession);
        }

        // Notify the React app about the new token (callback set by App.jsx)
        if (api._onTokenRefreshed) {
          api._onTokenRefreshed(newAccessToken);
        }

        // Retry all queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry the original failed request
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token is also dead — force full logout
        processQueue(refreshError, null);
        logOutUser();

        if (api._onForceLogout) {
          api._onForceLogout();
        }

        // Redirect to signin
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For all other errors (403, 500, etc.), just pass them through
    return Promise.reject(error);
  }
);

export default api;
