import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw Error("VITE_API_URL environment variable not set");
}

const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
});

export default api;
