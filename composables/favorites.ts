import type { Favorite, TResponse, Word } from "~/types/word";
import { useAuthStore } from "~/stores/auth";

export const useFavorites = () => {
  const authStore = useAuthStore();
  const toast = useToast();
  const favWords = useState<TResponse<Favorite>>("favorite-words", () => {
    return {
      data: [],
      meta: {
        pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
      },
    };
  });

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
            repetition: word.repetition || 0,
            ease_factor: word.ease_factor || 2.5,
            interval: word.interval || 1,
            next_review: word.next_review || new Date().toISOString(),
            is_learned: word.is_learned || false,
          },
        },
      });

      console.log(`✅ Word "${word.title}" added to favorites`);
    } catch (error) {
      console.error("❌ Error adding word to favorites:", error);
    }
  }

  const isFavorite = (word: Word) => {
    return word.is_favorite;
  };

  const removeFromFavorites = async (id?: string) => {
    if (!id) return;
    try {
      const { data } = await $fetch<TResponse<Favorite>>(
        `http://localhost:1337/api/favorites/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

      if (data) {
        toast.add({
          title: "Word removed from favorites",
          color: "green",
        });
      }
    } catch (error) {
      console.log({ error });
    }
  };

  const toggleFavorite = async (word: Word) => {
    const previousState = word.is_favorite; // Store the previous state
    word.is_favorite = !word.is_favorite; // Optimistically update UI

    try {
      if (previousState) {
        await removeFromFavorites(word.favorites?.[0]?.documentId);
      } else {
        await addToFavorites(word);
      }
    } catch (error) {
      console.log({ error });
      word.is_favorite = previousState; // Revert on failure
    }
  };

  const query = new URLSearchParams({
    "filters[$and][0][user][id][$eq]": authStore.user?.id + "" || "",
    "filters[$or][0][next_review][$lte]": new Date().toISOString(),
    "filters[$or][1][next_review][$null]": "true",
    "filters[is_learned][$ne]": "true", // Исключаем выученные слова
  }).toString();

  const getFavorites = async (): Promise<TResponse<Favorite>> => {
    if (favWords.value?.data?.length > 0) {
      return favWords.value;
    }

    try {
      const res = await $fetch<TResponse<Favorite>>(
        `http://localhost:1337/api/favorites?populate[word][populate][0]=alternative_translations&${query}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );
      favWords.value = res;
      return res;
    } catch (err) {
      console.error("Error fetching favorites:", err);
      return {
        data: [],
        meta: {
          pagination: { page: 1, pageSize: 10, pageCount: 1, total: 0 },
        },
      };
    }
  };

  return {
    getFavorites,
    addToFavorites,
    isFavorite,
    removeFromFavorites,
    toggleFavorite,
  };
};
