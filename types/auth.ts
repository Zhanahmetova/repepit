import type { User } from "./user";
import type { useAuthStore } from "~/stores/auth";

export type AuthState = {
  user: User | null;
  token?: string | null;
  userStatsId: string | null;
};

export type AuthStore = ReturnType<typeof useAuthStore>;
