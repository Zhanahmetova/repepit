<template>
  <div class="flex flex-col gap-3 mt-4">
    <UCard class="mb-4">
      <p>{{ word?.translation }}</p>
    </UCard>
    <UForm :state="formState" @submit="$emit('check-answer', userInput)">
      <UInput
        size="xl"
        v-model="userInput"
        type="text"
        class="input"
        variant="outline"
        color="primary"
        placeholder="Enter your answer"
      />
      <UButton
        size="xl"
        variant="solid"
        color="gray"
        type="submit"
        class="mt-4 w-[100%]"
        >Check</UButton
      >
    </UForm>
  </div>
</template>

<script setup lang="ts">
import type { Word } from '~/types/word';

const props = defineProps<{
  word: Word | null;
}>();

defineEmits<{
  'check-answer': [answer: string]
}>();

const userInput = ref('');
const formState = ref({
  userInput: '',
});
</script> 