import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const user =  useAuthStore(); 
  const whiteList = ['/login', '/register'];

  if ((!user?.token) && !whiteList.includes(to.path)) {
    return navigateTo('/login');
  }
});