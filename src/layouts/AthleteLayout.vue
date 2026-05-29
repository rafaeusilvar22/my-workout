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

      <q-footer class="fnav-footer">
        <nav class="fnav">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            custom
            v-slot="{ isExactActive, navigate }"
          >
            <button
              class="fnav__btn"
              :class="{ 'fnav__btn--active': isExactActive }"
              @click="navigate"
            >
              <i :class="item.icon" />
            </button>
          </router-link>
        </nav>
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

const navItems = [
  { to: '/athlete/home', icon: 'fas fa-house' },
  { to: '/athlete/progress', icon: 'fas fa-trophy' },
  { to: '/athlete/profile', icon: 'fas fa-user' },
]

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
/* ── Footer shell ── */
.fnav-footer {
  background: transparent !important;
  padding: 10px 24px calc(10px + env(safe-area-inset-bottom));
  box-shadow: none !important;
}

/* ── Nav row: sem background, só espaçamento ── */
.fnav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  width: fit-content;
  margin: 0 auto;
}

/* ── Nav button: mesmo estilo do ios-glass-btn ── */
.fnav__btn {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.06) 100%
  );
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.20);
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 17px;
  transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  -webkit-tap-highlight-color: transparent;
}

.fnav__btn:active {
  transform: scale(0.86);
  transition: transform 0.1s ease;
}

/* ── Active state ── */
.fnav__btn--active {
  background: var(--q-primary);
  color: white;
  transform: scale(1.06);
  box-shadow:
    0 0 0 4px rgba(255, 255, 255, 0.06),
    0 6px 24px color-mix(in srgb, var(--q-primary) 55%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

/* ── Light theme overrides ── */
body.body--light .fnav__btn {
  background: linear-gradient(
    145deg,
    rgba(255, 255, 255, 0.80) 0%,
    rgba(255, 255, 255, 0.55) 100%
  );
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 1);
  color: rgba(0, 0, 0, 0.45);
}

body.body--light .fnav__btn--active {
  background: var(--q-primary);
  color: white;
  box-shadow:
    0 0 0 4px rgba(0, 0, 0, 0.04),
    0 6px 24px color-mix(in srgb, var(--q-primary) 45%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
</style>
