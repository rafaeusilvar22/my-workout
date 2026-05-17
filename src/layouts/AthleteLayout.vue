<template>
  <q-layout view="lHh lpr lFf">
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-icon name="fitness_center" size="28px" class="q-mr-sm" />
        <q-toolbar-title class="text-weight-bold">My Workout</q-toolbar-title>
        <q-space />
        <q-btn flat dense round icon="logout" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer style="background: #fff; border-top: 1px solid #eee;">
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
.athlete-tabs .q-tab {
  color: #9e9e9e !important;
}
.athlete-tabs .q-tab--active {
  color: var(--q-primary) !important;
}
</style>
