<template>
  <div>
    <UContainer>
      <div class="flex justify-between my-5 gap-4">
        <div class="flex items-center gap-4">
          <UButton color="gray" variant="link" to="/">Main</UButton>
          <UButton color="gray" variant="link" to="/training">Training</UButton>
        </div>

        <h1
          class="text-2xl font-bold cursor-pointer flex items-center gap-2 h-[60px]"
          @click="playAudio"
        >
          Repepit
          <UIcon v-if="!isPlaying" name="i-heroicons-play"  />
          <Wave v-else name="i-heroicons-pause" />
        </h1>

        <audio ref="audio" id="audio" src="/repepepepit.mp3"></audio>

        <UDropdown
          :items="[[{ label: 'Logout', click: () => authStore.logout() }]]"
          :popper="{ placement: 'bottom-start' }"
        >
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
import Wave from '~/components/Wave.vue';

const authStore = useAuthStore();
authStore.fetchUser();

const audio = ref<HTMLAudioElement | null>(null);
const isPlaying = ref(false);

const playAudio = () => {
  if (isPlaying.value) {
    audio.value?.pause();
    isPlaying.value = false;
  } else {
    audio.value?.play();
    isPlaying.value = true;
  }
};
</script>
