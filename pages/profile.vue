<template>
  <div>
    <h1>Profile</h1>

    <UCard class="mt-4 p-4">
      <h2 class="text-lg font-bold">Statistics</h2>
      <p>Correct answers: {{ data?.correct }}</p>
      <p>Errors: {{ data?.incorrect }}</p>
      <p>Success rate: {{ successRate }}%</p>
      <p>Learned words: {{ learnedWords?.length }}</p>
    </UCard>

    <UCard v-if="learnedWords?.length" class="mt-4 p-4">
      <h2 class="text-lg font-bold">Выученные слова</h2>
      <ul>
        <li v-for="favorite in learnedWords" :key="favorite.id">
          {{ favorite.word?.title }}
        </li>
      </ul>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useStatistics } from "~/composables/statistics";
import type { Favorite } from "~/types/word";
import type { UserStats } from "~/types/user";

const { successRate, fetchUserStats } = useStatistics();

const { data } = useLazyAsyncData(
  "user-stats",
  async (): Promise<UserStats | undefined> => await fetchUserStats()
);

const words = useState<Favorite[]>("words");

const learnedWords = computed(() =>
  words.value?.filter((word) => word.is_learned)
);
</script>
