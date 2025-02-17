<template>
  <div class="flex flex-col items-center justify-center my-6">
    <div>
      <MiniCard v-if="currentWord" :word="currentWord" />
      <div class="flex gap-4 mt-4">
        <UButton
          size="xl"
          variant="solid"
          color="gray"
          @click="updateWordProgress(0)"
          class="btn"
          >I don't know</UButton
        >
        <UButton
          size="xl"
          variant="solid"
          color="gray"
          @click="updateWordProgress(3)"
          class="btn"
          >I'm struggling</UButton
        >
        <UButton
          size="xl"
          variant="solid"
          color="gray"
          @click="updateWordProgress(5)"
          class="btn"
          >I know</UButton
        >
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import MiniCard from "~/components/word/MiniCard.vue";
import type { Word, TResponse } from "~/types/word";

const authStore = useAuthStore();

const trainingMode = useState<
  "default" | "multipleChoice" | "typing" | "audio"
>("trainingMode", () => "default");

const currentWord = useState<Word | null>("currentWord", () => null);

const words = useState<Word[]>("all-words", () => []);

useLazyAsyncData("all-words", async () => {
  try {
    const wordsRes = await $fetch<TResponse<Word>>(
      `http://localhost:1337/api/words`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );

    words.value = wordsRes.data.map((word) => ({
      ...word,
      ease_factor: 2.5,
      interval: 1,
      repetition: 0,
      next_review: new Date().toISOString(),
      is_learned: false,
    }));

    currentWord.value = words.value[0];
  } catch (err) {
    console.error("Error fetching words:", err);
  }
});

const nextWord = () => {
  words.value = words.value.slice(1);
  currentWord.value = words.value[0];
};

const { updateWordProgress } = useProgress({
  currentWord,
  userInput: ref(""),
  words,
  changeCorrectAnswer: () => {},
  nextWord,
  updateWordsArray: () => {},
});
</script>
