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
import Header from '~/components/header/index.vue';
</script>
