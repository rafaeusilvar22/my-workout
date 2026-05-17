<template>
  <q-page class="q-pa-md">
    <div class="text-h6 text-weight-bold q-mb-md">Conquistas</div>

    <!-- Stats rápidos -->
    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-4">
        <q-card flat bordered class="text-center q-pa-sm">
          <q-icon name="local_fire_department" color="orange" size="28px" />
          <div class="text-h6 text-weight-bold">{{ streak }}</div>
          <div class="text-caption text-grey-6">Sequência</div>
        </q-card>
      </div>
      <div class="col-4">
        <q-card flat bordered class="text-center q-pa-sm">
          <q-icon name="check_circle" color="positive" size="28px" />
          <div class="text-h6 text-weight-bold">{{ completedCount }}</div>
          <div class="text-caption text-grey-6">Treinos</div>
        </q-card>
      </div>
      <div class="col-4">
        <q-card flat bordered class="text-center q-pa-sm">
          <q-icon name="emoji_events" color="amber" size="28px" />
          <div class="text-h6 text-weight-bold">{{ sessionsStore.achievements.length }}</div>
          <div class="text-caption text-grey-6">Badges</div>
        </q-card>
      </div>
    </div>

    <!-- Conquistas desbloqueadas -->
    <div class="text-subtitle1 text-weight-medium q-mb-sm">Desbloqueadas</div>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="sessionsStore.achievements.length === 0" class="text-center text-grey-5 q-py-md">
      <q-icon name="emoji_events" size="48px" />
      <div class="q-mt-sm">Nenhuma conquista ainda — continue treinando!</div>
    </div>

    <div v-else class="row q-col-gutter-sm q-mb-lg">
      <div v-for="ach in sessionsStore.achievements" :key="ach.id" class="col-6">
        <q-card flat bordered class="text-center q-pa-md">
          <q-icon :name="achIcon(ach.type)" :color="achColor(ach.type)" size="36px" />
          <div class="text-weight-bold q-mt-xs text-body2">{{ achLabel(ach.type) }}</div>
          <div class="text-caption text-grey-6">{{ formatDate(ach.earned_at) }}</div>
        </q-card>
      </div>
    </div>

    <!-- Conquistas bloqueadas -->
    <div class="text-subtitle1 text-weight-medium q-mb-sm">Em progresso</div>
    <div class="row q-col-gutter-sm">
      <div
        v-for="badge in lockedBadges"
        :key="badge.type"
        class="col-6"
      >
        <q-card flat bordered class="text-center q-pa-md opacity-50">
          <q-icon :name="badge.icon" color="grey-5" size="36px" />
          <div class="text-weight-bold q-mt-xs text-body2 text-grey-6">{{ badge.label }}</div>
          <q-linear-progress
            :value="badge.progress"
            color="primary"
            class="q-mt-sm"
            rounded
          />
          <div class="text-caption text-grey-5 q-mt-xs">{{ badge.hint }}</div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'

const authStore = useAuthStore()
const sessionsStore = useSessionsStore()
const loading = ref(true)

const streak = computed(() => sessionsStore.getStreak())
const completedCount = computed(() => sessionsStore.sessions.filter(s => s.completed).length)
const earnedTypes = computed(() => new Set(sessionsStore.achievements.map(a => a.type)))

const allBadges = [
  { type: 'first_session', icon: 'star', color: 'amber', label: 'Primeira Sessão' },
  { type: 'streak_7', icon: 'local_fire_department', color: 'orange', label: '7 Dias Seguidos' },
  { type: '10_sessions', icon: 'military_tech', color: 'blue', label: '10 Sessões' },
]

const lockedBadges = computed(() => {
  return allBadges
    .filter(b => !earnedTypes.value.has(b.type))
    .map(b => ({
      ...b,
      progress: badgeProgress(b.type),
      hint: badgeHint(b.type),
    }))
})

function badgeProgress(type) {
  if (type === 'first_session') return Math.min(completedCount.value, 1)
  if (type === 'streak_7') return Math.min(streak.value / 7, 1)
  if (type === '10_sessions') return Math.min(completedCount.value / 10, 1)
  return 0
}

function badgeHint(type) {
  if (type === 'first_session') return `${completedCount.value}/1 sessão`
  if (type === 'streak_7') return `${streak.value}/7 dias`
  if (type === '10_sessions') return `${completedCount.value}/10 sessões`
  return ''
}

function achIcon(type) {
  return allBadges.find(b => b.type === type)?.icon || 'emoji_events'
}
function achColor(type) {
  return allBadges.find(b => b.type === type)?.color || 'amber'
}
function achLabel(type) {
  return allBadges.find(b => b.type === type)?.label || type
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
  await Promise.all([
    sessionsStore.fetchSessions(authStore.user.id),
    sessionsStore.fetchAchievements(authStore.user.id),
  ])
  loading.value = false
})
</script>
