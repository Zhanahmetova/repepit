import { defineStore } from "pinia";
import type { Favorite } from "~/types/word";

export const useSession = defineStore("session", {
  state: (): {
    sessionWords: Favorite[];
    sessionCompleted: boolean;
  } => ({
    sessionWords: [],
    sessionCompleted: false,
  }),
  actions: {
    setSessionWords(words: Favorite[]) {
      this.sessionWords = words;
    },
    setSessionCompleted(completed: boolean) {
      this.sessionCompleted = completed;
    },
  },
});
