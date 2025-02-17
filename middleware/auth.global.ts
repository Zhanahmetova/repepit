export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie("user_id").value;
  const whiteList = ["/login", "/register"];

  if (!token && !whiteList.includes(to.path)) {
    return navigateTo("/login");
  }
});
