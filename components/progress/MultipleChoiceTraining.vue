<template>
  <div class="flex flex-col gap-3 mt-4">
    <MiniCard v-if="word" :word="word" />

    <UButton
      v-for="option in options"
      :key="option"
      size="xl"
      variant="solid"
      color="gray"
      @click="$emit('check-answer', option)"
      class="btn"
    >
      {{ option }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { Word } from '~/types/word';
import MiniCard from '~/components/word/MiniCard.vue';

defineProps<{
  word: Word | null;
  options: string[];
}>();

defineEmits<{
  'check-answer': [option: string]
}>();
</script> 