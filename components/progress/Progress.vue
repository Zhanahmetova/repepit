<template>
  <div class="flex flex-col items-center justify-center my-10 w-1/2">
    <!-- Если у пользователя нет слов, показываем новую страницу -->
    <div v-if="!hasStartedTraining">
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

          <template v-if="!isLoadingOptions">
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
          </template>

          <template v-else>
            <USkeleton class="h-12 w-full mb-2" v-for="n in 3" :key="n" />
          </template>
        </div>

        <div
          v-else-if="trainingMode === 'typing'"
          class="flex flex-col gap-3 mt-4"
        >
          <UCard class="mb-4">
            <p>{{ currentWord?.translation }}</p>
          </UCard>
          <UForm :state="formState" @submit="onSubmit">
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

        <div v-if="trainingMode === 'audio'" class="flex flex-col items-center">
          <Audio
            v-if="currentWord"
            :currentWord="currentWord"
            :shuffledOptions="shuffledOptions"
            :checkAudioChoice="checkAudioChoice"
            :isLoadingOptions="isLoadingOptions"
          />
        </div>

        <p v-if="feedbackMessage" class="mt-4">
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
import MiniCard from "~/components/word/MiniCard.vue";
import Audio from "~/components/progress/Audio.vue";

const authStore = useAuthStore();
const words = useState<Favorite[]>("words", () => []);
const toast = useToast();
const shuffledOptions = useState<string[]>("shuffledOptions", () => []);

const trainingMode = useState<
  "default" | "multipleChoice" | "typing" | "audio"
>("trainingMode", () => "default");

const showErrorModal = useState("showErrorModal", () => false);
const feedbackMessage = useState("feedbackMessage");

const userInput = ref("");
const formState = ref({
  userInput: "",
});
const correctAnswer = ref("");
const isLoadingOptions = ref(false);

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

const changeCorrectAnswer = (answer: string) => {
  correctAnswer.value = answer;
};

const isNewUser = useState("isNewUser");

const { fetchSimilarWords } = useSimilarWords();

const isFetching = ref(false);

const selectNewWord = async (word: Word | undefined) => {
  console.log({ word });

  if (!word || isFetching.value) return;

  isFetching.value = true;
  isLoadingOptions.value = true; // Показываем Skeleton
  console.log("Fetching similar words for:", word.title);

  const incorrectOptions = await fetchSimilarWords(word.title);

  while (incorrectOptions.length < 3) {
    const randomWord =
      words.value[Math.floor(Math.random() * words.value.length)]?.word?.title;
    if (randomWord && !incorrectOptions.includes(randomWord)) {
      incorrectOptions.push(randomWord);
    }
  }

  await nextTick(); // Ensure DOM updates correctly before changing options
  shuffledOptions.value = shuffleArray([word.title, ...incorrectOptions]);

  console.log("Shuffled options:", shuffledOptions.value);
  isFetching.value = false;
  isLoadingOptions.value = false; // Скрываем Skeleton после загрузки
};

const nextWord = () => {
  showErrorModal.value = false;

  if (words.value.length > 1) {
    words.value = words.value.slice(1);
    // Выбираем случайный режим, включая новый "audio"
    const modes: ("multipleChoice" | "typing" | "audio")[] = [
      "multipleChoice",
      "typing",
      "audio",
    ];
    trainingMode.value = modes[Math.floor(Math.random() * modes.length)];

    if (currentWord.value && trainingMode.value === "multipleChoice") {
      shuffledOptions.value = shuffleArray([
        currentWord.value?.translation,
        ...(currentWord.value?.alternative_translations?.map(
          (translation) => translation.text
        ) || []),
      ]);
    }

    if (trainingMode.value === "audio" && currentWord.value) {
      selectNewWord(currentWord.value);
    }
  } else {
    console.log("No more words to train!");
  }
};

const updateWordsArray = (array: Favorite[]) => {
  words.value = array;
};

const {
  checkTyping,
  checkMultipleChoice,
  updateWordProgress,
  favoritesData,
  checkAudioChoice,
} = useProgress({
  currentWord,
  userInput,
  words,
  changeCorrectAnswer,
  nextWord,
  updateWordsArray,
});

const onSubmit = async () => {
  await checkTyping();
  userInput.value = "";
};

const hasStartedTraining = useState(
  "hasStartedTraining",
  () => favoritesData?.data?.value?.data?.length === 0
);

// Если `favoritesData` пустой, загружаем слова из `words`
watchEffect(async () => {
  if (favoritesData?.data?.value?.data?.length === 0) {
    try {
      const wordsRes = await $fetch<TResponse<Word>>(
        `http://localhost:1337/api/words`,
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

// Перемешивание вариантов ответа
function shuffleArray(array: string[]) {
  return array.sort(() => Math.random() - 0.5);
}

function goToTraining() {
  console.log("goToTraining");
  trainingMode.value = "default";
  hasStartedTraining.value = true; // Mark training as started
}
</script>
