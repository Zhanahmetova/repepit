<script setup>
import { useAuthStore } from '~/stores/auth';

const auth = useAuthStore();
const form = ref({ username: '', email: '', password: '' });
const toast = useToast();

async function handleRegister() {
    try {
        await auth.register(form.value.username, form.value.email, form.value.password);
        if (auth.user) navigateTo('/');
    } catch (error) {
        console.error(error);
        toast.add({
            title: 'Registration failed',
            description: 'Invalid email or password',
            color: 'red',
        });
    }
}
</script>

<template>
  <div class="max-w-md mx-auto p-6">
    <UCard>
      <h1 class="text-lg font-bold">Register</h1>
      <UForm @submit="handleRegister">
        <UInput v-model="form.username" placeholder="Username" class="mt-2" />
        <UInput v-model="form.email" type="email" placeholder="Email" class="mt-2" />
        <UInput v-model="form.password" type="password" placeholder="Password" class="mt-2" />
        <UButton type="submit" color="primary" class="mt-4">Register</UButton>
      </UForm>
    </UCard>
  </div>
</template>