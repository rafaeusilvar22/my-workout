<template>
  <div class="layout-wrapper">
  <q-layout view="lHh lpr lFf">
    <q-header :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'" :style="$q.dark.isActive ? 'border-bottom: 1px solid rgba(255,255,255,0.08)' : 'border-bottom: 1px solid rgba(0,0,0,0.08)'">
      <q-toolbar>
        <q-icon name="fitness_center" size="28px" class="q-mr-sm text-primary" />
        <q-toolbar-title class="text-weight-bold text-primary">My Workout</q-toolbar-title>
        <q-space />
        <q-btn flat dense round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" :class="$q.dark.isActive ? 'text-white' : 'text-dark'" @click="toggleTheme" />
        <q-btn flat dense round icon="logout" :class="$q.dark.isActive ? 'text-white' : 'text-dark'" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="athlete-footer" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
      <q-tabs
        active-color="primary"
        indicator-color="primary"
        align="justify"
        class="athlete-tabs"
      >
        <q-route-tab to="/athlete/home" icon="home" label="Hoje" exact />
        <q-route-tab to="/athlete/progress" icon="emoji_events" label="Conquistas" exact />
        <q-route-tab to="/athlete/profile" icon="person" label="Perfil" exact />
      </q-tabs>
    </q-footer>
  </q-layout>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

function toggleTheme() {
  $q.dark.toggle()
  localStorage.setItem('theme', $q.dark.isActive ? 'dark' : 'light')
}

function handleLogout() {
  $q.dialog({
    title: 'Sair',
    message: 'Deseja realmente sair da sua conta?',
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Sair', color: 'negative', flat: true },
    persistent: false,
  }).onOk(async () => {
    await authStore.signOut()
    router.push('/auth/login')
  })
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
