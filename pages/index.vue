<template>
  <div class="flex flex-col items-center justify-center my-10">
    <h1 class="text-2xl font-bold">Repepit</h1>

    <UCard class="w-full mt-4">
      <ul class="flex flex-col gap-4">
        <li v-for="word in data?.data" :key="word.id" class="relative">
          <div class="flex flex-col gap-2 basis-1/2">
            <h2 class="text-xl font-bold">{{ word.title }}</h2>
            <hr class="w-full border-gray-500" />
            <div class="flex flex-col gap-2">
              <p class="text-sm text-gray-500">{{ word.pronunciation }}</p>
              <p class="text-md text-gray-300">Example: </p>
              <p class="text-md text-gray-300">{{ word.description }}</p>
            </div>
          </div>
          <UButton class="absolute top-0 right-0">Add to favorites</UButton>
        </li>
      </ul>
    </UCard>
  </div>

</template>
<script setup lang="ts">
import type { TResponse, Word } from "~/types/word";

const toast = useToast();

const { data, error } = useFetch<TResponse<Word>>(
  "http://localhost:1337/api/words"
);

if (error.value) {
  toast.add({
    title: "Error fetching words",
    description: error.value?.message,
    color: "red",
  });
}


</script>
