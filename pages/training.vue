<template>
  <div class="flex flex-col items-center justify-center my-10">
    <template v-if="status === 'pending'">
      <ULoading />
    </template>
    <template v-else>
      <template v-if="!!data?.data?.length">
        <Progress />
      </template>
      <template v-else>
        <NewWords />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import NewWords from "~/components/progress/NewWords.vue";
import type { TResponse } from "~/types/word";
import type { Favorite } from "~/types/word";
import { useFavorites } from "~/composables/favorites";

const { getFavoritesByUser } = useFavorites();

const { data, status } = useLazyAsyncData(
  "user-favorites",
  async (): Promise<TResponse<Favorite>> => {
    return await getFavoritesByUser();
  },
  {
    server: false,
  }
);
</script>
