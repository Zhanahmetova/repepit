import type { UserStats } from "~/types/user";
import type { TResponse, Favorite } from "~/types/word";
import { useAuthStore } from "~/stores/auth";

export const useStatistics = () => {
  const authStore = useAuthStore();

  const stats = reactive({
    correct: 0,
    incorrect: 0,
  });

  const isStatExists = useState<boolean>("isStatExists", () => false);

  const successRate = computed(() => {
    const total = stats.correct + stats.incorrect;
    return total === 0 ? 0 : Math.round((stats.correct / total) * 100);
  });

  // Создаем запись статистики для нового пользователя
  async function createUserStats() {
    const createdStat = await $fetch<TResponse<UserStats>>(
      "http://localhost:1337/api/user-stats-list",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
        body: {
          data: {
            user: { connect: [authStore.user] },
            correct: stats.correct,
            incorrect: stats.incorrect,
          },
        },
      }
    );
    // Сохраняем ID созданной записи
    authStore.userStatsId = createdStat?.data?.[0]?.documentId;
    isStatExists;
  }

  // Получаем статистику из базы при входе
  async function fetchUserStats() {
    try {
      const res = await $fetch<TResponse<UserStats>>(
        `http://localhost:1337/api/user-stats-list?populate=*&filters[$and][0][user][id][$eq]=${authStore.user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      if (res.data.length) {
        stats.correct = res.data[0].correct || 0;
        stats.incorrect = res.data[0].incorrect || 0;
        isStatExists.value = true;
      }

      return res.data?.[0];
    } catch (error) {
      isStatExists.value = false;
      console.error("Error fetching user stats:", error);
    }
  }

  useLazyAsyncData("user-stats", fetchUserStats);

  async function updateStats(isCorrect: boolean) {
    if (isCorrect) {
      stats.correct++;
    } else {
      stats.incorrect++;
    }

    // Обновляем статистику в Strapi
    await saveUserStats();
  }

  // Функция обновления статистики в Strapi
  async function saveUserStats() {
    try {
      const userStats = await $fetch<TResponse<UserStats>>(
        `http://localhost:1337/api/user-stats-list?populate=*&filters[$and][0][user][id][$eq]=${authStore.user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      if (!userStats.data.length) {
        console.error("No user stats found, creating new entry.", {
          userStats,
        });
        await createUserStats();
        return;
      }

      const statId = userStats.data[0].documentId;
      console.log({ statId });

      console.log("Updating user stats:", statId);

      await $fetch(`http://localhost:1337/api/user-stats-list/${statId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authStore.token}`,
          "Content-Type": "application/json",
        },
        body: {
          data: {
            user: { connect: [authStore.user] },
            correct: stats.correct,
            incorrect: stats.incorrect,
          },
        },
      });

      console.log("User stats updated successfully!");
    } catch (error) {
      console.error("Error saving user stats:", error);
    }
  }

  return { stats, successRate, updateStats, fetchUserStats };
};
