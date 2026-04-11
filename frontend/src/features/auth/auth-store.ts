import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { MeResponse } from "@/types/auth";

type AuthState = {
  accessToken: string | null;
  me: MeResponse | null;
  setSession: (token: string, me: MeResponse) => void;
  setMe: (me: MeResponse) => void;
  setToken: (token: string | null) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      me: null,
      setSession: (token, me) => set({ accessToken: token, me }),
      setMe: (me) => set({ me }),
      setToken: (token) => set({ accessToken: token }),
      clearSession: () => set({ accessToken: null, me: null }),
    }),
    {
      name: "bh-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        me: s.me,
      }),
    },
  ),
);
