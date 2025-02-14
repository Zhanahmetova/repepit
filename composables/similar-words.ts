export const useSimilarWords = () => {
  const cachedWords = useState<Map<string, string[]>>(
    "cachedWords",
    () => new Map<string, string[]>()
  );

  async function fetchSimilarWords(targetWord: string): Promise<string[]> {
    if (cachedWords.value.has(targetWord)) {
      console.log(`🔄 Using cached words for: ${targetWord}`);
      return cachedWords.value.get(targetWord)!; // Берем из кэша
    }

    try {
      console.log(`🌍 Fetching from Datamuse: ${targetWord}`);
      const response = await $fetch<{ word: string; score: number }[]>(
        `/api/datamuse?word=${targetWord}`
      );

      // Take the first 3 words, ensuring they aren't the same as the current word
      const filteredWords = response
        .map((item) => item.word) // Extract word field
        .filter((word) => word.toLowerCase() !== targetWord.toLowerCase()) // Exclude current word
        .slice(0, 3); // Take the first 3 results

      cachedWords.value.set(targetWord, filteredWords); // Сохраняем в кэш
      console.log("filteredWords", filteredWords);
      return filteredWords;
    } catch (error) {
      console.error("❌ Error fetching similar words from Datamuse:", error);
      return [];
    }
  }

  return { fetchSimilarWords };
};
