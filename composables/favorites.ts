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

  const addToFavorites = async (word: Word) => {
    try {
      const { data } = await $fetch<TResponse<Favorite>>(
        "http://localhost:1337/api/favorites",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
          body: {
            data: {
              user: {
                connect: [
                  {
                    id: authStore.user?.id,
                    documentId: authStore.user?.documentId,
                  },
                ],
              },
              word: {
                connect: [{ id: word.id, documentId: word.documentId }],
              },
            },
          },
        }
      );

      if (data) {
        toast.add({
          title: "Word added to favorites",
          color: "green",
        });
      }
    } catch (error) {
      toast.add({
        title: "Error adding word to favorites",
        color: "red",
      });
    }
  };

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

  const getFavoritesByUser = async () => {
    try {
      const res = await $fetch<TResponse<Favorite>>(
        `http://localhost:1337/api/favorites?filters[$and][0][user][id][$eq]=${authStore.user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${authStore.token}`,
          },
        }
      );

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
    getFavoritesByUser,
  };
};
