export default defineEventHandler(async (event) => {
  const { word } = getQuery(event);
  if (!word) return { error: "No word provided" };

  try {
    const response = await $fetch(
      `https://api.datamuse.com/words?sl=${word}&max=10`
    );
    return response;
  } catch (error) {
    console.error("Error fetching Datamuse words:", error);
    return { error: "Failed to fetch words" };
  }
});
