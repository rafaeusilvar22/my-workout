<template>
  <div class="layout-wrapper">
  <q-layout view="lHh Lpr lFf">
    <q-header :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'" :style="headerBorder">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" class="lt-md" :class="$q.dark.isActive ? 'text-white' : 'text-dark'" />
        <q-icon name="fitness_center" size="28px" class="q-mr-sm text-primary" />
        <q-toolbar-title class="text-weight-bold text-primary">My Workout</q-toolbar-title>
        <q-space />
        <q-btn flat dense round :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'" :class="$q.dark.isActive ? 'text-white' : 'text-dark'" @click="toggleTheme" />
        <q-btn flat dense round icon="logout" :class="$q.dark.isActive ? 'text-white' : 'text-dark'" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <!-- Sidebar desktop -->
    <q-drawer v-model="drawer" show-if-above :width="230" :breakpoint="900" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'" :style="drawerBorder">
      <q-scroll-area class="fit">
        <div class="q-pa-md q-pt-lg">
          <div class="flex items-center q-mb-lg">
            <q-avatar color="primary" text-color="dark" size="40px">
              {{ initials }}
            </q-avatar>
            <div class="q-ml-sm">
              <div class="text-weight-medium text-body2" :class="$q.dark.isActive ? 'text-white' : 'text-dark'">{{ authStore.profile?.full_name }}</div>
              <div class="text-caption text-grey-6">Treinador</div>
            </div>
          </div>

          <q-list padding>
            <q-item
              v-for="item in navItems"
              :key="item.to"
              clickable
              :to="item.to"
              active-class="nav-item--active"
              exact
              rounded
              class="nav-item"
            >
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>{{ item.label }}</q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Bottom nav mobile -->
    <q-footer class="gt-sm-hide trainer-footer" :class="$q.dark.isActive ? 'bg-dark' : 'bg-white'">
      <q-tabs
        active-color="primary"
        indicator-color="primary"
        align="justify"
        class="trainer-tabs"
      >
        <q-route-tab
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          :label="item.label"
          exact
        />
      </q-tabs>
    </q-footer>
  </q-layout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()
const drawer = ref(false)

const headerBorder = computed(() =>
  $q.dark.isActive
    ? 'border-bottom: 1px solid rgba(255,255,255,0.08)'
    : 'border-bottom: 1px solid rgba(0,0,0,0.08)'
)

const drawerBorder = computed(() =>
  $q.dark.isActive
    ? 'border-right: 1px solid rgba(255,255,255,0.08)'
    : 'border-right: 1px solid rgba(0,0,0,0.08)'
)

function toggleTheme() {
  $q.dark.toggle()
  localStorage.setItem('theme', $q.dark.isActive ? 'dark' : 'light')
}

const navItems = [
  { label: 'Início', icon: 'dashboard', to: '/trainer/dashboard' },
  { label: 'Alunos', icon: 'group', to: '/trainer/athletes' },
  { label: 'Exercícios', icon: 'fitness_center', to: '/trainer/exercises' },
  { label: 'Horários', icon: 'event_available', to: '/trainer/schedule' },
]

const initials = computed(() => {
  const name = authStore.profile?.full_name || ''
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
})

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
.trainer-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.trainer-tabs .q-tab {
  color: rgba(255, 255, 255, 0.4) !important;
}
.trainer-tabs .q-tab--active {
  color: var(--q-primary) !important;
}
.nav-item {
  color: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  margin-bottom: 2px;
}
.nav-item--active {
  color: var(--q-primary) !important;
  background: rgba(0, 230, 118, 0.12) !important;
}
</style>
