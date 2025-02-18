<template>
  <div class="flex flex-col items-center justify-center my-10">
    <template v-if="status === 'pending'">
      <UProgress animation="carousel" />
    </template>

    <template v-if="sessionCompleted">
      <div class="text-center">
        <h2 class="text-2xl font-bold">🎉 Ура, на сегодня всё!</h2>
        <UButton color="green" @click="startNewSession">
          Начать новую сессию</UButton
        >
      </div>
    </template>

    <template v-else>
      <Progress />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { TResponse } from "~/types/word";
import type { Favorite } from "~/types/word";
import { useSession } from "~/stores/session";

const id = useCookie("user_id").value;
const token = useCookie("access_token").value;
const { sessionCompleted, setSessionCompleted } = useSession();

const startNewSession = async () => {
  setSessionCompleted(false);
  await refreshNuxtData("favorite-words");
};

const { status } = await useLazyAsyncData(
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
      !res?.data?.length && navigateTo("/new-words");

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
