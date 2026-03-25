import axios from "axios";

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = import.meta.env.DEV ? "/api/v1" : configuredBaseURL || "/api/v1";

export const http = axios.create({
  baseURL,
  timeout: 15000
});

export function attachAccessToken(token: string | null): void {
  if (!token) {
    delete http.defaults.headers.common.Authorization;
    return;
  }
  http.defaults.headers.common.Authorization = `Bearer ${token}`;
}
