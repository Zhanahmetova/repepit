<template>
  <div class="flex flex-col items-center justify-center my-10">
    <template v-if="status === 'pending'">
      <UProgress animation="carousel" />
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

const id = useCookie("user_id").value;
const token = useCookie("access_token").value;

const { data, status } = await useLazyAsyncData(
  "user-favorites",
  async (): Promise<TResponse<Favorite>> => {
    try {
      const res = await $fetch<TResponse<Favorite>>(
        `http://localhost:1337/api/favorites?filters[$and][0][user][id][$eq]=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res;
    } catch (err) {
      console.error("Error fetching favorites:", err);
      return {
        data: [],
        meta: {
          pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
        },
      };
    }
  }
);
</script>
