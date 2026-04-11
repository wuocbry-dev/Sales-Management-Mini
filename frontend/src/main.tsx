import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/app/App";
import { useAuthStore } from "@/features/auth/auth-store";
import "@/index.css";

void Promise.resolve(useAuthStore.persist.rehydrate()).then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
