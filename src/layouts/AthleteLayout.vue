<template>
  <q-layout view="lHh lpr lFf">
    <q-header class="bg-dark" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
      <q-toolbar>
        <q-icon name="fitness_center" size="28px" class="q-mr-sm text-primary" />
        <q-toolbar-title class="text-weight-bold text-primary">My Workout</q-toolbar-title>
        <q-space />
        <q-btn flat dense round icon="logout" class="text-white" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bg-dark athlete-footer">
      <q-tabs
        active-color="primary"
        indicator-color="primary"
        align="justify"
        class="athlete-tabs"
      >
        <q-route-tab to="/athlete/home" icon="home" label="Hoje" exact />
        <q-route-tab to="/athlete/history" icon="history" label="Histórico" exact />
        <q-route-tab to="/athlete/progress" icon="emoji_events" label="Conquistas" exact />
        <q-route-tab to="/athlete/profile" icon="person" label="Perfil" exact />
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  await authStore.signOut()
  router.push('/auth/login')
}
</script>

<style>
.athlete-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.athlete-tabs .q-tab {
  color: rgba(255, 255, 255, 0.4) !important;
}
.athlete-tabs .q-tab--active {
  color: var(--q-primary) !important;
}
</style>
