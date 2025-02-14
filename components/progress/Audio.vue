<template>
  <div>
    <UCard class="mb-4">
      <p class="text-gray-600 mb-10">
        Нажмите на динамик, чтобы услышать слово
      </p>
      <div class="flex justify-around items-center gap-6">
        <UButton
          @click="playAudio(currentWord.title, 1)"
          size="xl"
          color="primary"
          variant="ghost"
        >
          <UIcon name="i-heroicons-speaker-wave" class="w-[100px] h-[100px]" />
        </UButton>
        <div class="h-[100px] w-[1px] bg-gray-700"></div>
        <UButton
          @click="playAudio(currentWord.title, 0.5)"
          size="xl"
          color="gray"
          variant="ghost"
        >
          <UIcon name="i-noto-turtle" class="w-[100px] h-[100px]" />
        </UButton>
      </div>
    </UCard>

    <div class="flex flex-col gap-3 mt-4">
      <template v-if="!isLoadingOptions">
        <UButton
          v-for="option in shuffledOptions"
          :key="option"
          size="xl"
          variant="solid"
          color="gray"
          @click="checkAudioChoice(option)"
        >
          {{ option }}
        </UButton>
      </template>
      <template v-else>
        <USkeleton class="h-[44px] w-full" v-for="n in 4" :key="n" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Word } from "~/types/word";

defineProps<{
  currentWord: Word;
  shuffledOptions: string[];
  checkAudioChoice: (option: string) => void;
  isLoadingOptions: boolean;
}>();

function playAudio(text?: string, rate?: number) {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate || 0.9; // Скорость речи
  speechSynthesis.speak(utterance);
}
</script>
