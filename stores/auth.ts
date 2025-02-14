import { defineStore } from "pinia";
import type { User, UserResponse } from "~/types/user";
import type { AuthState } from "~/types/auth";

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null as any,
    token: useCookie("access_token").value,
    userStatsId: null as string | null,
  }),

  actions: {
    async login(identifier: string, password: string) {
      try {
        const { data } = await useFetch<UserResponse>(
          "http://localhost:1337/api/auth/local",
          {
            method: "POST",
            body: { identifier, password },
          }
        );

        if (data.value) {
          this.token = data.value?.jwt;
          this.user = data.value?.user;
          useCookie("access_token").value = this.token;
        }
      } catch (error) {
        console.error("Login failed:", error);
      }
    },

    async register(username: string, email: string, password: string) {
      try {
        const { data } = await useFetch<UserResponse>(
          "http://localhost:1337/api/auth/local/register",
          {
            method: "POST",
            body: { username, email, password },
          }
        );

        if (data.value) {
          this.token = data.value.jwt;
          this.user = data.value.user;
          useCookie("access_token").value = this.token;
        }
      } catch (error) {
        console.error("Registration failed:", error);
      }
    },

    async fetchUser() {
      if (!this.token) return;

      try {
        const { data } = await useFetch<User>(
          "http://localhost:1337/api/users/me",
          {
            headers: { Authorization: `Bearer ${this.token}` },
          }
        );

        this.user = data.value;
      } catch (error) {
        console.error("Failed to fetch user:", error);
        this.token = null;
        this.user = null;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      useCookie("access_token").value = null;
      navigateTo("/login");
    },
  },
});
