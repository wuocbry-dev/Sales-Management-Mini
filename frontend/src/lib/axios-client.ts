import axios from "axios";
import { useAuthStore } from "@/features/auth/auth-store";
import { usePosScopeStore } from "@/features/pos/pos-scope-store";

const raw = import.meta.env.VITE_API_BASE_URL;
const baseURL =
  raw === undefined || String(raw).trim() === ""
    ? ""
    : String(raw).replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  validateStatus: (s) => s >= 200 && s < 300,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  const { selectedStoreId, selectedBranchId } = usePosScopeStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (selectedStoreId != null) {
    config.headers["X-Store-Id"] = String(selectedStoreId);
  }
  if (selectedBranchId != null) {
    config.headers["X-Branch-Id"] = String(selectedBranchId);
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      useAuthStore.getState().clearSession();
      usePosScopeStore.getState().clear();
      const p = window.location.pathname;
      const onAuthPage = p === "/login" || p === "/register" || p.startsWith("/login") || p.startsWith("/register");
      if (!onAuthPage) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);
