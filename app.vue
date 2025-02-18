<template>
  <div>
    <UContainer>
      <Header />
      <NuxtPage />
    </UContainer>

    <UNotifications />
  </div>
</template>

<script setup lang="ts">
import Header from "~/components/header/index.vue";
import type { User } from "~/types/user";
const token = useCookie("access_token").value;

const authStore = useAuthStore();

// useLazyAsyncData(async () => {
//   try {
//     const res = await $fetch<User>("http://http://10.80.22.4:1337/api/users/me", {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     authStore.token = token;
//   } catch (error) {
//     console.error("Failed to fetch user:", error);
//     authStore.logout();
//     await navigateTo("/login");
//   }
// });
</script>
