<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="bg-dark" style="border-bottom: 1px solid rgba(255,255,255,0.08);">
      <q-toolbar>
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" class="lt-md text-white" />
        <q-icon name="fitness_center" size="28px" class="q-mr-sm text-primary" />
        <q-toolbar-title class="text-weight-bold text-primary">My Workout</q-toolbar-title>
        <q-space />
        <q-btn flat dense round icon="logout" class="text-white" @click="handleLogout" />
      </q-toolbar>
    </q-header>

    <!-- Sidebar desktop -->
    <q-drawer v-model="drawer" show-if-above :width="230" :breakpoint="900" class="bg-dark" style="border-right: 1px solid rgba(255,255,255,0.08);">
      <q-scroll-area class="fit">
        <div class="q-pa-md q-pt-lg">
          <div class="flex items-center q-mb-lg">
            <q-avatar color="primary" text-color="dark" size="40px">
              {{ initials }}
            </q-avatar>
            <div class="q-ml-sm">
              <div class="text-weight-medium text-body2 text-white">{{ authStore.profile?.full_name }}</div>
              <div class="text-caption" style="color: rgba(255,255,255,0.45);">Treinador</div>
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
    <q-footer class="gt-sm-hide bg-dark trainer-footer">
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'src/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(false)

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

async function handleLogout() {
  await authStore.signOut()
  router.push('/auth/login')
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
