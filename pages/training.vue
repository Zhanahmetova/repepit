<template>
  <div class="flex flex-col items-center justify-center my-10">
    <h1>Training</h1>
    <p>{{ data }}</p>
  </div>
</template>

<script setup lang="ts">
import type { TResponse, Word } from "~/types/word";
import { useAuthStore } from "~/stores/auth";

const authStore = useAuthStore();

const { data, error } = useLazyAsyncData<TResponse<Word>>(
  "favorite-words",
  () =>
    $fetch<TResponse<Word>>("http://localhost:1337/api/favorites?populate=word_id", {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
      params: {
        filters: {
          user_id: {
            id: authStore.user?.id,
          },
        },
      },
    })
);

if (error.value) {
  console.error(error.value);
}
</script>
