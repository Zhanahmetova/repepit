<template>
  <div class="flex flex-col items-center justify-center my-10">
    <ul
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full my-4"
    >
      <template v-if="status === 'pending'">
        <USkeleton class="h-[150px] w-[100%]" v-for="n in 12" :key="n" />
      </template>
      <template v-else>
        <li v-for="word in data?.data" :key="word?.id">
          <UCard class="relative pr-6">
            <div class="flex flex-col gap-2 basis-1/2">
              <h2 class="text-xl font-bold">{{ word?.title }}</h2>
              <hr class="w-full border-gray-500 border-dashed" />
              <div
                class="flex flex-col gap-2 divide-y divide-gray-500 divide-dashed"
              >
                <p v-if="word?.pronunciation" class="text-sm text-gray-500">
                  {{ word?.pronunciation }}
                </p>

                <p v-if="word?.description" class="text-md text-gray-300">
                  <span class="text-md text-gray-400">For Example: </span>
                  {{ word?.description }}
                </p>

                <p v-if="word?.translation" class="text-sm text-gray-400 pt-2">
                  {{ word?.translation }}
                </p>
              </div>
            </div>
            <UButton
              variant="ghost"
              @click="toggleFavorite(word)"
              class="absolute top-0 right-0 p-4"
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
      </template>
    </ul>
    <UPagination
      v-model="page"
      :page-count="data?.meta?.pagination.pageSize || 0"
      :total="data?.meta?.pagination.total || 0"
    />
  </div>
</template>
<script setup lang="ts">
import type { TResponse, Word } from "~/types/word";
import { useAuthStore } from "~/stores/auth";
import { useFavorites } from "~/composables/favorites";

const toast = useToast();
const authStore = useAuthStore();

const page = ref(1);

const { data, error, status } = useLazyAsyncData<TResponse<Word>>(
  "words",
  () =>
    $fetch<TResponse<Word>>(
      `http://localhost:1337/api/words?populate[favorites][populate]=user&populate[favorites][populate]=word&pagination[page]=${page.value}&pagination[pageSize]=21`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    ),
  {
    watch: [page],
  }
);

if (error.value) {
  toast.add({
    title: "Error fetching words",
    description: error.value?.message,
    color: "red",
  });
}

const { toggleFavorite, isFavorite } = useFavorites();
</script>
