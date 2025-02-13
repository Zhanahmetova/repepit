<template>
  <div class="flex flex-col items-center justify-center my-10">
    <div v-if="data?.data?.length">
      <p>{{ currentWord?.title }}</p>

      <div
        v-if="trainingMode === 'multipleChoice'"
        class="flex flex-col gap-2 mt-4"
      >
        <button
          v-for="option in shuffledOptions"
          :key="option"
          @click="checkMultipleChoice(option)"
          class="btn"
        >
          {{ option }}
        </button>
      </div>

      <div
        v-else-if="trainingMode === 'typing'"
        class="flex flex-col gap-2 mt-4"
      >
        <input
          v-model="userInput"
          type="text"
          class="input"
          placeholder="Введите ответ"
        />
        <button @click="checkTyping" class="btn">Проверить</button>
      </div>

      <p v-if="feedbackMessage" :class="feedbackClass">{{ feedbackMessage }}</p>

      <div v-else class="flex gap-4 mt-4">
        <button @click="updateWordProgress(0)" class="btn">Не знаю</button>
        <button @click="updateWordProgress(3)" class="btn">Затрудняюсь</button>
        <button @click="updateWordProgress(5)" class="btn">Знаю</button>
      </div>
    </div>

    <p v-else>Нет слов для повторения</p>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import type { TResponse, Favorite, Word } from "~/types/word";

const authStore = useAuthStore();
const words = useState<Favorite[]>(() => []);
const trainingMode = ref<"default" | "multipleChoice" | "typing">("default");
const userInput = ref("");
const feedbackMessage = ref("");
const feedbackClass = ref("");
const shuffledOptions = ref<string[]>([]);

const query = new URLSearchParams({
  populate: "word",
  "filters[user][$eq]": authStore.user?.id || "",
  "filters[$or][0][next_review][$lte]": new Date().toISOString(), // Показываем слова для повторения
  "filters[$or][1][next_review][$null]": "true", // Также включаем слова без next_review (новые)
}).toString();

const { data, error } = useLazyAsyncData<TResponse<Favorite>>(
  "favorite-words",
  async () => {
    const res = await $fetch<TResponse<Favorite>>(
      `http://localhost:1337/api/favorites?${query}`,
      {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      }
    );
    words.value = res.data;
    return res;
  }
);

console.log(error.value);

const currentWord = computed<Word | null>(() => words.value[0]?.word || null);

// Функция перемешивания вариантов ответа
function shuffleArray(array: string[]) {
  return array.sort(() => Math.random() - 0.5);
}

// Выбираем режим тренировки при смене слова
watch(currentWord, () => {
  if (!currentWord.value) return;

  const randomMode = Math.random() > 0.5 ? "multipleChoice" : "typing";
  trainingMode.value = randomMode;

  if (randomMode === "multipleChoice") {
    shuffledOptions.value = shuffleArray([
      currentWord.value.translation,
      ...(currentWord.value.alternative_translations || []),
    ]);
  }
});

// Проверка ответа при ручном вводе
function checkTyping() {
  if (!currentWord.value) return;

  if (
    userInput.value.toLowerCase().trim() ===
    currentWord.value.translation.toLowerCase()
  ) {
    feedbackMessage.value = "✅ Правильно!";
    feedbackClass.value = "text-green-500";
    setTimeout(() => updateWordProgress(5), 1000);
  } else {
    feedbackMessage.value = `❌ Неправильно! Правильный ответ: ${currentWord.value.translation}`;
    feedbackClass.value = "text-red-500";
    setTimeout(() => updateWordProgress(0), 2000);
  }
}

// Проверка ответа при выборе варианта
function checkMultipleChoice(option: string) {
  if (!currentWord.value) return;

  if (option === currentWord.value.translation) {
    feedbackMessage.value = "✅ Правильно!";
    feedbackClass.value = "text-green-500";
    setTimeout(() => updateWordProgress(5), 1000);
  } else {
    feedbackMessage.value = "❌ Неправильно!";
    feedbackClass.value = "text-red-500";
    setTimeout(() => updateWordProgress(0), 2000);
  }
}

// Обновление прогресса
async function updateWordProgress(grade: number) {
  if (!currentWord.value) return;

  const wordProgress = words.value[0];
  const progressId = words.value[0].documentId;

  let easeFactor = wordProgress.ease_factor || 2.5;
  let interval = wordProgress.interval || 1;
  let repetition = wordProgress.repetition || 0;

  if (grade >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = Math.max(
      1.3,
      easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    );
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
    easeFactor = 2.5;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  await $fetch(`http://localhost:1337/api/favorites/${progressId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${authStore.token}`,
    },
    body: JSON.stringify({
      data: {
        next_review: nextReview.toISOString(),
        repetition,
        ease_factor: easeFactor,
        interval,
      },
    }),
  });

  words.value = words.value.slice(1);
  userInput.value = "";
  feedbackMessage.value = "";
}
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
.input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.text-green-500 {
  color: green;
}
.text-red-500 {
  color: red;
}
</style>
