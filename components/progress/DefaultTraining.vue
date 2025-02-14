<template>
  <div>
    <MiniCard v-if="word" :word="word" />
    <div class="flex gap-4 mt-4">
      <UButton
        size="xl"
        variant="solid"
        color="gray"
        @click="$emit('update-progress', 0)"
        class="btn"
        >I don't know</UButton
      >
      <UButton
        size="xl"
        variant="solid"
        color="gray"
        @click="$emit('update-progress', 3)"
        class="btn"
        >I'm struggling</UButton
      >
      <UButton
        size="xl"
        variant="solid"
        color="gray"
        @click="$emit('update-progress', 5)"
        class="btn"
        >I know</UButton
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Word } from '~/types/word';
import MiniCard from '~/components/word/MiniCard.vue';

defineProps<{
  word: Word | null;
}>();

defineEmits<{
  'update-progress': [grade: number]
}>();
</script> 