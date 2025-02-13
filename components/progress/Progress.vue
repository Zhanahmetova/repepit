<template>
  <div class="flex flex-col items-center justify-center my-10 w-1/2">
    <div v-if="data?.data?.length" class="w-full">
      <div
        v-if="trainingMode === 'multipleChoice'"
        class="flex flex-col gap-3 mt-4"
      >
			<MiniCard v-if="currentWord" :word="currentWord" />

        <UButton
          v-for="option in shuffledOptions"
          :key="option"
          size="xl"
          variant="solid"
          color="gray"
          @click="checkMultipleChoice(option)"
          class="btn"
        >
          {{ option }}
        </UButton>
      </div>

      <div
        v-else-if="trainingMode === 'typing'"
        class="flex flex-col gap-3 mt-4"
      >
        <UCard class="mb-4">
          <p>{{ currentWord?.translation }}</p>
        </UCard>
        <UForm :state="formState" @submit="checkTyping">
          <UInput
            size="xl"
            v-model="userInput"
            type="text"
            class="input"
            variant="outline"
            color="primary"
            placeholder="Введите ответ"
          />
          <UButton
            size="xl"
            variant="solid"
            color="gray"
            type="submit"
            class="mt-4 w-full"
            >Проверить</UButton
          >
        </UForm>
      </div>

      <p v-if="feedbackMessage" :class="feedbackClass" class="mt-4">
        {{ feedbackMessage }}
      </p>

      <div v-else-if="trainingMode === 'default'">
        <MiniCard v-if="currentWord" :word="currentWord" />
        <div class="flex gap-4 mt-4">
          <UButton
            size="xl"
            variant="solid"
            color="gray"
            @click="updateWordProgress(0)"
            class="btn"
            >Не знаю</UButton
          >
          <UButton
            size="xl"
            variant="solid"
            color="gray"
            @click="updateWordProgress(3)"
            class="btn"
            >Затрудняюсь</UButton
          >
          <UButton
            size="xl"
            variant="solid"
            color="gray"
            @click="updateWordProgress(5)"
            class="btn"
            >Знаю</UButton
          >
        </div>
      </div>
    </div>

    <p v-if="words.length === 0" class="text-gray-500">You have no words to repeat.</p>

    <!-- Модальное окно при ошибке -->
    <UModal v-model="showErrorModal">
      <UCard>
        <template #header> ❌ Wrong answer </template>
        <p>Correct answer: <strong>{{ correctAnswer }}</strong></p>
        <UButton size="xl" variant="solid" color="primary" @click="nextWord" class="mt-4">
          Next (Enter)
        </UButton>
      </UCard>
    </UModal>
		<UCard class="mt-4 p-4">
			<h2 class="text-lg font-bold">Статистика</h2>
			<p>Правильные ответы: {{ stats.correct }}</p>
			<p>Ошибки: {{ stats.incorrect }}</p>
			<p>Процент успеха: {{ successRate }}%</p>
			<p>Выученные слова: {{ learnedWords.length }}</p>
		</UCard>

		<UCard v-if="learnedWords.length" class="mt-4 p-4">
			<h2 class="text-lg font-bold">Выученные слова</h2>
			<ul>
				<li v-for="favorite in learnedWords" :key="favorite.id">{{ favorite.word?.title }}</li>
			</ul>
		</UCard>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import type { TResponse, Favorite, Word } from "~/types/word";
import levenshteinDistance from "~/utils/levensteinDistance";
import MiniCard from "~/components/word/MiniCard.vue";

const authStore = useAuthStore();
const words = useState<Favorite[]>(() => []);
const trainingMode = ref<"default" | "multipleChoice" | "typing">("default");
const userInput = ref("");
const feedbackMessage = ref("");
const feedbackClass = ref("");
const shuffledOptions = useState<string[]>("shuffledOptions", () => []);
const formState = ref({
  userInput: "",
});

const showErrorModal = ref(false);
const correctAnswer = ref("");

const stats = reactive({
  correct: 0,
  incorrect: 0,
});

function updateStats(isCorrect: boolean) {
  if (isCorrect) {
    stats.correct++;
  } else {
    stats.incorrect++;
  }
}

const successRate = computed(() => {
  const total = stats.correct + stats.incorrect;
  return total === 0 ? 0 : Math.round((stats.correct / total) * 100);
});

const query = new URLSearchParams({
  "filters[user][$eq]": authStore.user?.id || "",
  "filters[$or][0][next_review][$lte]": new Date().toISOString(),
  "filters[$or][1][next_review][$null]": "true",
  "filters[is_learned][$ne]": "true", // Исключаем выученные слова
}).toString();

const { data, error } = useLazyAsyncData<TResponse<Favorite>>(
  "favorite-words",
  async () => {
    const res = await $fetch<TResponse<Favorite>>(
      `http://localhost:1337/api/favorites?populate[word][populate][0]=alternative_translations&${query}`,
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

const currentWord = computed<Word | null>(() => words.value[0]?.word || null);

const learnedWords = computed(() => words.value.filter(word => word.is_learned));

// Перемешивание вариантов ответа
function shuffleArray(array: string[]) {
  return array.sort(() => Math.random() - 0.5);
}

// Выбор режима тренировки
watch(currentWord, () => {
  if (!currentWord.value) return;

  const randomMode = Math.random() > 0.5 ? "multipleChoice" : "typing";
  trainingMode.value = randomMode;

  if (randomMode === "multipleChoice") {
    shuffledOptions.value = shuffleArray([
      currentWord.value.translation,
      ...(currentWord.value.alternative_translations?.map(
        (translation) => translation.text
      ) || []),
    ]);
  }
});




// Проверка ответа при вводе текста с учетом опечаток
function checkTyping() {
  if (!currentWord.value) return;

  const userAnswer = userInput.value.trim().toLowerCase();
  const correctAnswer = currentWord.value.translation.trim().toLowerCase();

  const distance = levenshteinDistance(userAnswer, correctAnswer);
  const maxTolerance = Math.floor(correctAnswer.length * 0.2); // Допускаем 20% ошибок

  if (distance <= maxTolerance) {
    feedbackMessage.value = "✅ Правильно (с учетом опечаток)!";
    feedbackClass.value = "text-green-500";
    updateStats(true);
    updateWordProgress(5);
  } else {
    updateStats(false);
    showErrorModal.value = true;
  }
}

// Проверка ответа при выборе варианта
async function checkMultipleChoice(option: string) {
  if (!currentWord.value) return;

  if (option === currentWord.value.translation) {
    feedbackMessage.value = "✅ Correct!";
    feedbackClass.value = "text-green-500";
    updateStats(true);
    updateWordProgress(5);
  } else {
    updateStats(false);
    correctAnswer.value = currentWord.value.translation;
    showErrorModal.value = true; // Показываем окно
  }
}

async function updateWordProgress(grade: number) {
  if (!currentWord.value) return;

  const wordProgress = words.value[0];
  const progressId = words.value[0].documentId;

  let easeFactor = wordProgress.ease_factor || 2.5;
  let interval = wordProgress.interval || 1;
  let repetition = wordProgress.repetition || 0;
  let isLearned = wordProgress.is_learned || false;

  if (grade >= 3) {
    if (repetition === 0) interval = 1;
    else if (repetition === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
    repetition += 1;
  } else {
    repetition = 0;
    interval = 1;
    easeFactor = 2.5;
  }

  // Если слово повторено 5 раз подряд без ошибок, оно считается выученным
  if (repetition >= 5) {
    isLearned = true;
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
        is_learned: isLearned, // Обновляем флаг
      },
    }),
  });

  words.value = words.value.slice(1);
}

// Закрываем модальное окно и переходим к следующему слову
function nextWord() {
  showErrorModal.value = false;
  updateWordProgress(0);
}

// Реагируем на Enter
onMounted(() => {
  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && showErrorModal.value) {
      nextWord();
    }
  });
});
</script>