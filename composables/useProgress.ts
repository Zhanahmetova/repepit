import type { Word } from "~/types/word";
import levenshteinDistance from "~/utils/levensteinDistance";
import type { AuthStore } from "~/types/auth";
import type { TResponse } from "~/types/word";
import type { Favorite } from "~/types/word";
import { useAuthStore } from "~/stores/auth";

export const useProgress = ({
  currentWord,
  userInput,
  feedbackMessage,
  feedbackClass,
  updateStats,
  showErrorModal,
  correctAnswer,
  words,
  changeCorrectAnswer,
}: {
  currentWord: Ref<Word | null>;
  userInput: Ref<string>;
  feedbackMessage: Ref<string>;
  feedbackClass: Ref<string>;
  updateStats: (isCorrect: boolean) => void;
  showErrorModal: Ref<boolean>;
  correctAnswer: Ref<string>;
  words: Ref<Favorite[]>;
  changeCorrectAnswer: (answer: string) => void;
}) => {
  const authStore = useAuthStore();
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
      changeCorrectAnswer(currentWord.value.translation);
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
    const progressId = wordProgress.documentId;

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

    try {
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
    } catch (error) {
      await addToFavorites(wordProgress as Word);

      console.log("❌ Error updating word progress:", { error });
    }

    words.value = words.value.slice(1);
  }

  // Закрываем модальное окно и переходим к следующему слову
  function nextWord() {
    showErrorModal.value = false;
    updateWordProgress(0);
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
          meta: {
            pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
          },
        };
      } catch (err) {
        console.error("Error fetching favorites:", err);
        return {
          data: [],
          meta: {
            pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
          },
        };
      }
    }
  );

  return {
    checkTyping,
    checkMultipleChoice,
    updateWordProgress,
    nextWord,
    favoritesData,
  };
};
