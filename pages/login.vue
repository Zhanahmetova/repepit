<script setup>
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const form = ref({ identifier: '', password: '' });
const toast = useToast();

async function handleLogin() {
    try {
        await auth.login(form.value.identifier, form.value.password);
        if (auth.user) navigateTo('/');
    } catch (error) {
        console.error(error);
        toast.add({
            title: 'Login failed',
            description: 'Invalid email or password',
            color: 'red',
        });
    }
}
</script>

<template>
  <div class="max-w-md mx-auto p-6">
    <UCard>
      <h1 class="text-lg font-bold">Login</h1>
      <UForm @submit="handleLogin">
        <UInput v-model="form.identifier" placeholder="Email or Username" class="mt-2" />
        <UInput v-model="form.password" type="password" placeholder="Password" class="mt-2" />
        <UButton type="submit" color="primary" class="mt-4">Login</UButton>
      </UForm>
      <p class="mt-4 text-sm">Don't have an account? <NuxtLink to="/register" class="text-blue-500">Register</NuxtLink></p>
    </UCard>
  </div>
</template>