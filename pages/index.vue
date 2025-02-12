<template>
  <div class="flex flex-col items-center justify-center my-10">
    <h1
      class="text-2xl font-bold cursor-pointer flex items-center gap-2"
      @click="playAudio"
    >
      Repepit
      <UIcon v-if="!isPlaying" name="i-heroicons-play" class="w-5 h-5" />
      <UIcon v-else name="i-heroicons-pause" class="w-5 h-5" />
    </h1>

    <audio ref="audio" id="audio" src="/repepepepit.mp3"></audio>

    <ul class="flex flex-col gap-4 w-full mt-4">
      <li v-for="word in data?.data" :key="word.id" class="relative">
        <UCard>
          <div class="flex flex-col gap-2 basis-1/2">
            <h2 class="text-xl font-bold">{{ word.title }}</h2>
            <hr class="w-full border-gray-500" />
            <div class="flex flex-col gap-2">
              <p v-if="word.pronunciation" class="text-sm text-gray-500">
                {{ word.pronunciation }}
              </p>

              <p v-if="word.description" class="text-md text-gray-300">
                <span class="text-md text-gray-400">For Example: </span>
                {{ word.description }}
              </p>
            </div>
          </div>
          <UButton
            variant="ghost"
            @click="toggleFavorite(word)"
            class="absolute top-0 right-0 m-4"
          >
            <UIcon
              v-if="isFavorite(word)"
              name="i-heroicons-star-solid"
              class="w-5 h-5"
            />
            <UIcon v-else name="i-heroicons-star" class="w-5 h-5" />
          </UButton>
        </UCard>
      </li>
    </ul>
  </div>
</template>
<script setup lang="ts">
import type { TResponse, Word, Favorite } from "~/types/word";
import { useAuthStore } from "~/stores/auth";
import { useFavorites } from "~/composables/favorites";

const toast = useToast();
const authStore = useAuthStore();
const audio = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);

const { data, error } = useLazyAsyncData<TResponse<Word>>("words", () =>
  $fetch<TResponse<Word>>(
    "http://localhost:1337/api/words?populate[favorites][populate]=user_id&populate[favorites][populate]=word_id"
  )
);

if (error.value) {
  toast.add({
    title: "Error fetching words",
    description: error.value?.message,
    color: "red",
  });
}

const playAudio = () => {
  if (isPlaying.value) {
    audio.value?.pause();
    isPlaying.value = false;
  } else {
    audio.value?.play();
    isPlaying.value = true;
  }
};

const { toggleFavorite, isFavorite } = useFavorites();
</script>
