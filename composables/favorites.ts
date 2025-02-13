import type { Favorite, TResponse, Word } from "~/types/word";
import { useAuthStore } from "~/stores/auth";
export const useFavorites = () => {
  const authStore = useAuthStore();
  const toast = useToast();

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
    return word.favorites.some(
      (favorite) => favorite.user?.id === authStore.user?.id
    );
  };

  const removeFromFavorites = async (id: string) => {
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
      toast.add({
        title: "Error removing word from favorites",
        color: "red",
      });
    }
  };

  const toggleFavorite = async (word: Word) => {
    if (isFavorite(word)) {
      await removeFromFavorites(word.favorites[0].documentId);
    } else {
      await addToFavorites(word);
    }
  };

  return {
    addToFavorites,
    isFavorite,
    removeFromFavorites,
    toggleFavorite,
  };
};
