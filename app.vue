<template>
  <div>
    <UContainer>
      <div class="flex justify-end my-5 gap-4">
        <UDropdown :items="[[{label: 'Logout', click: () => authStore.logout() }]]" :popper="{ placement: 'bottom-start' }" >
          <UButton variant="ghost" class="flex items-center gap-2" color="gray">
          <UAvatar :alt="authStore.user?.username?.toUpperCase()" />
          <p class="text-sm text-gray-500">{{ authStore.user?.username }}</p>
        </UButton>
        </UDropdown>
      </div>

      <NuxtPage />
    </UContainer>

    <UNotifications />
  </div>
</template>
<script setup lang="ts">
const authStore = useAuthStore();
authStore.fetchUser();
</script>