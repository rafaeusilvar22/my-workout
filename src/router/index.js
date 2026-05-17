import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach(async (to) => {
    // Lazy-load the auth store only when needed (avoids circular dep at module init)
    const { useAuthStore } = await import('src/stores/auth')
    const authStore = useAuthStore()

    if (!authStore.user) {
      await authStore.init()
    }

    const isAuthRoute = to.path.startsWith('/auth')

    if (!authStore.user && !isAuthRoute) {
      return '/auth/login'
    }

    if (authStore.user && isAuthRoute) {
      return authStore.isTrainer ? '/trainer/dashboard' : '/athlete/home'
    }

    if (authStore.profile?.role === 'athlete' && to.path.startsWith('/trainer')) {
      return '/athlete/home'
    }

    if (authStore.profile?.role === 'trainer' && to.path.startsWith('/athlete')) {
      return '/trainer/dashboard'
    }
  })

  return Router
})
