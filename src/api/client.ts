import ky from "ky";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Pre-configured ky instance pointing at the backend.
 * Sends cookies (credentials: "include") on every request.
 */
const api = ky.create({
  prefixUrl: API_BASE_URL,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
