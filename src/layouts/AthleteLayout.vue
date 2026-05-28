<template>
  <div class="layout-wrapper">
    <q-layout view="lHh lpr lFf">
      <q-header class="transparent-header">
        <q-toolbar>
          <q-space />
          <q-btn
            flat
            round
            :icon="$q.dark.isActive ? 'fas fa-sun' : 'fas fa-moon'"
            class="ios-glass-btn q-mr-xs"
            @click="toggleTheme"
          />
          <q-btn
            flat
            round
            icon="fas fa-right-from-bracket"
            class="ios-glass-btn"
            @click="handleLogout"
          />
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
          <q-route-tab to="/athlete/home" icon="fas fa-house" label="Início" exact />
          <q-route-tab to="/athlete/progress" icon="fas fa-trophy" label="Conquistas" exact />
          <q-route-tab to="/athlete/profile" icon="fas fa-user" label="Perfil" exact />
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
