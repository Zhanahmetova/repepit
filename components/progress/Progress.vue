<template>
  <div class="flex flex-col items-center justify-center my-10 w-1/2">
    <!-- Если у пользователя нет слов, показываем новую страницу -->
    <div v-if="isNewUser">
      <h1 class="text-xl font-bold mb-4">Start training</h1>
      <p class="text-gray-500">Check your favorite words</p>
      <UButton
        @click="goToTraining"
        size="xl"
        color="primary"
        variant="outline"
        class="mt-4 w-[100%]"
        >Start</UButton
      >
    </div>

    <div v-else class="w-full">
      <div v-if="words.length" class="w-full">
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
              >I don't know</UButton
            >
            <UButton
              size="xl"
              variant="solid"
              color="gray"
              @click="updateWordProgress(3)"
              class="btn"
              >I'm struggling</UButton
            >
            <UButton
              size="xl"
              variant="solid"
              color="gray"
              @click="updateWordProgress(5)"
              class="btn"
              >I know</UButton
            >
          </div>
        </div>
      </div>
      <!-- Обычная логика тренировки -->
    </div>

    <!-- Модальное окно при ошибке -->
    <UModal v-model="showErrorModal">
      <UCard>
        <template #header> ❌ Wrong answer </template>
        <p>
          Correct answer: <strong>{{ correctAnswer }}</strong>
        </p>
        <UButton
          size="xl"
          variant="solid"
          color="primary"
          @click="nextWord"
          class="mt-4"
        >
          Next (Enter)
        </UButton>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import type { TResponse, Favorite, Word } from "~/types/word";
import levenshteinDistance from "~/utils/levensteinDistance";
import MiniCard from "~/components/word/MiniCard.vue";

const authStore = useAuthStore();
const words = useState<Favorite[]>("words", () => []);
const trainingMode = ref<"default" | "multipleChoice" | "typing">("default");
const userInput = ref("");
const feedbackMessage = ref("");
const feedbackClass = ref("");
const shuffledOptions = useState<string[]>("shuffledOptions", () => []);
const formState = ref({
  userInput: "",
});
const toast = useToast();
const showErrorModal = ref(false);
const correctAnswer = ref("");

const isNewUser = computed(() => words.value.length === 0);

const { updateStats } = useStatistics();

function goToTraining() {
  trainingMode.value = "default";
}

const query = new URLSearchParams({
  "filters[user][$eq]": authStore.user?.documentId || "",
  "filters[$or][0][next_review][$lte]": new Date().toISOString(),
  "filters[$or][1][next_review][$null]": "true",
  "filters[is_learned][$ne]": "true", // Исключаем выученные слова
}).toString();

const favoritesData = useLazyAsyncData(
  "favorite-words",
  async (): Promise<TResponse<Favorite>> => {
    try {
      const res = await $fetch<TResponse<Favorite>>(
        `http://localhost:1337/api/favorites?populate[word][populate][0]=alternative_translations&${query}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      if (res.data.length > 0) {
        words.value = res.data.map((word) => ({
          ...word,
          id: word.id || 0, // Если `id` undefined, подставляем 0
          ease_factor: 2.5,
          interval: 1,
          repetition: 0,
          next_review: new Date().toISOString(),
          is_learned: false,
        }));
        return res;
      }

      // Если избранных слов нет, возвращаем пустой массив
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 } },
      };
    } catch (err) {
      console.error("Error fetching favorites:", err);
      return {
        data: [],
        meta: { pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 } },
      };
    }
  }
);

// Если `favoritesData` пустой, загружаем слова из `words`
watchEffect(async () => {
  if (favoritesData?.data?.value?.data?.length === 0) {
    try {
      const wordsRes = await $fetch<TResponse<Word>>(
        `http://localhost:1337/api/words?populate=alternative_translations`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      words.value = wordsRes.data.map((word) => ({
        ...word,
        ease_factor: 2.5,
        interval: 1,
        repetition: 0,
        next_review: new Date().toISOString(),
        is_learned: false,
      }));
    } catch (err) {
      console.error("Error fetching words:", err);
    }
  }
});

const currentWord = computed<Word | null>(() => {
  if (!words.value.length) return null;

  const firstItem = words.value[0];

  // Если это объект `Favorite`, берем `word` (связанное слово)
  if ("word" in firstItem) {
    return firstItem.word as Word;
  }

  // Если это объект `Word`, просто возвращаем его
  return firstItem as Word;
});

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

async function addToFavorites(word?: Word) {
  if (!word) return;
  try {
    await $fetch("http://localhost:1337/api/favorites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        "Content-Type": "application/json",
      },
      body: {
        data: {
          user: { connect: [authStore.user] },
          word: { connect: [word] },
          repetition: 0,
          ease_factor: 2.5,
          interval: 1,
          next_review: new Date().toISOString(),
        },
      },
    });

    console.log(`✅ Word "${word.title}" added to favorites`);
  } catch (error) {
    console.error("❌ Error adding word to favorites:", error);
  }
}

async function updateWordProgress(grade: number) {
  if (!currentWord.value) return;

  let wordProgress = words.value[0];
  const progressId = wordProgress.id;

  let easeFactor = wordProgress.ease_factor || 2.5;
  let interval = wordProgress.interval || 1;
  let repetition = wordProgress.repetition || 0;
  let isLearned = wordProgress.is_learned || false;

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

    // Если слово выбрано "Не знаю" или "Затрудняюсь" и оно не в избранном — добавляем его
    if (!wordProgress.is_learned) {
      await addToFavorites(wordProgress.word);
    }
  }

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
    body: {
      data: {
        next_review: nextReview.toISOString(),
        repetition,
        ease_factor: easeFactor,
        interval,
        is_learned: isLearned,
      },
    },
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
