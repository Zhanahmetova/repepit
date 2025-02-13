<template>
<UCard class="mb-4">
    <div class="flex items-center gap-2 justify-between">
        <p>{{ word?.title }}</p>
        <UButton size="xl" variant="ghost" color="indigo" @click="speakWord(word?.title)">
            <UIcon name="i-heroicons-speaker-wave" />
        </UButton>
    </div>
    <hr class="my-2" color="border-gray-500" />
    <p class="text-sm text-gray-500 italic">[{{ word?.pronunciation }}]</p>
</UCard>
</template>

<script setup lang="ts">
import type { Word } from "~/types/word";

const props = defineProps<{
  word: Word;
}>();

function speakWord(text: string | undefined) {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9; // Скорость речи
  speechSynthesis.speak(utterance);
}
</script>
