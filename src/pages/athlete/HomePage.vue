<template>
  <q-page class="q-pa-md">
    <!-- Saudação -->
    <div class="row items-center q-mb-lg">
      <q-avatar size="52px" class="q-mr-md avatar-glass">
        <img
          v-if="authStore.profile?.avatar_url"
          :src="authStore.profile.avatar_url"
          style="object-fit: cover"
        />
        <span v-else class="text-h6 text-weight-bold text-primary">{{ firstName[0] }}</span>
      </q-avatar>
      <div class="col">
        <div
          class="text-caption text-grey-5 q-mb-none"
          style="letter-spacing: 0.5px; text-transform: uppercase; font-size: 10px"
        >
          Bem-vindo de volta
        </div>
        <div class="text-h6 text-weight-bold" style="line-height: 1.2; letter-spacing: -0.3px">
          {{ firstName }}
        </div>
        <div class="text-caption text-grey-6">{{ todayLabel }}</div>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="row q-gutter-sm q-mb-md">
      <div class="col glass-card stat-card">
        <div class="stat-number" style="color: #ff6b00">{{ streak }}</div>
        <div class="stat-label">Sequência</div>
      </div>
      <div class="col glass-card stat-card">
        <div class="stat-number text-primary">{{ completedCount }}</div>
        <div class="stat-label">Treinos</div>
      </div>
      <div class="col glass-card stat-card">
        <div class="stat-number" style="color: #ffd32a">{{ achievementsCount }}</div>
        <div class="stat-label">Badges</div>
      </div>
    </div>

    <!-- Aviso academia fechada -->
    <div
      v-if="isGymClosedToday"
      class="glass-card q-pa-md q-mb-md row items-center no-wrap"
      style="border-color: rgba(255, 71, 87, 0.35)"
    >
      <q-icon name="fas fa-calendar-xmark" color="negative" size="22px" class="q-mr-sm" />
      <div>
        <span class="text-weight-medium" style="color: #ff4757">Academia fechada hoje</span>
        <span v-if="todayException?.reason" class="text-caption text-grey-5">
          · {{ todayException.reason }}</span
        >
      </div>
    </div>

    <!-- Calendário -->
    <ConsistencyCalendar
      :sessions="sessionsStore.sessions"
      :program="sessionsStore.activeProgram"
      :gym-schedule="scheduleStore.schedule"
      :gym-exceptions="scheduleStore.exceptions"
      class="q-mb-md"
      @day-click="openSessionDetail"
    />

    <!-- Programa ativo -->
    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else-if="sessionsStore.activeProgram">
      <div class="section-label q-mb-sm">Treino de hoje</div>

      <!-- Treino em andamento -->
      <div
        v-if="inProgressSession && !todayCompletedSplit"
        class="glass-card q-mb-sm split-card cursor-pointer"
        @click="router.push(`/athlete/workout/${inProgressSession.split_id}`)"
      >
        <q-card-section class="row items-center no-wrap">
          <q-icon name="fas fa-circle-play" size="32px" class="q-mr-md text-orange" />
          <div class="col">
            <div class="text-weight-bold text-orange">Continuar treino</div>
            <div class="text-caption text-grey-6">
              {{ inProgressSession.training_splits?.name }} · em andamento
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="far fa-trash-can"
            color="grey-5"
            @click.stop="confirmDiscard(inProgressSession)"
          />
        </q-card-section>
      </div>

      <!-- Já treinou hoje -->
      <template v-if="todayCompletedSplit">
        <div
          class="glass-card q-mb-sm split-card"
          :style="{ background: hexToFaded(todayCompletedSplit.color || '#43a047') }"
        >
          <q-card-section class="row items-center no-wrap">
            <q-icon
              name="fas fa-circle-check"
              size="32px"
              class="q-mr-md"
              :style="{ color: todayCompletedSplit.color || '#43a047' }"
            />
            <div class="col">
              <div
                class="text-weight-bold"
                :style="{ color: todayCompletedSplit.color || '#43a047' }"
              >
                {{ todayCompletedSplit.name }} concluído!
              </div>
              <div class="text-caption text-grey-6">Bom trabalho hoje 💪</div>
            </div>
          </q-card-section>
        </div>

        <div class="section-label q-mb-sm q-mt-md">Próximo treino</div>
        <div
          v-if="nextSplit"
          class="glass-card q-mb-sm split-card"
        >
          <q-card-section class="row items-center no-wrap">
            <div
              class="split-color-dot q-mr-md"
              :style="{ background: nextSplit.color || '#1976d2' }"
            />
            <div class="col">
              <div class="text-weight-bold text-grey-7">{{ nextSplit.name }}</div>
              <div class="text-caption text-grey-5">
                {{ nextSplit.split_exercises?.length || 0 }} exercícios
              </div>
            </div>
            <q-badge
              text-color="white"
              :style="{ background: nextSplit.color || '#1976d2', opacity: 0.7 }"
            >
              Amanhã
            </q-badge>
          </q-card-section>
        </div>
      </template>

      <!-- Próximo treino na fila -->
      <template v-else-if="nextSplit">
        <div
          class="glass-card q-mb-sm cursor-pointer split-card"
          @click="$router.push(`/athlete/workout/${nextSplit.id}`)"
        >
          <q-card-section class="row items-center no-wrap">
            <div
              class="split-color-dot q-mr-md"
              :style="{ background: nextSplit.color || '#1976d2' }"
            />
            <div class="col">
              <div class="text-weight-bold">{{ nextSplit.name }}</div>
              <div class="text-caption text-grey-6">
                {{ nextSplit.split_exercises?.length || 0 }} exercícios
              </div>
            </div>
            <q-badge text-color="white" :style="{ background: nextSplit.color || '#1976d2' }">
              Iniciar
            </q-badge>
            <q-icon name="fas fa-chevron-right" color="grey-5" class="q-ml-sm" />
          </q-card-section>
        </div>
      </template>

      <div v-else class="text-center text-grey-5 q-py-md">
        <q-icon name="fas fa-champagne-glasses" size="40px" color="orange" />
        <div class="q-mt-sm">Nenhum treino configurado na fase atual</div>
      </div>

      <!-- Botão escolher outro treino -->
      <q-btn
        v-if="allSplits.length > 1"
        flat
        color="grey-7"
        icon="fas fa-arrows-up-down"
        label="Escolher outro treino"
        size="sm"
        class="full-width q-mt-xs"
        @click="chooserSheet = true"
      />
    </template>

    <div v-else class="text-center text-grey-5 q-py-xl">
      <q-icon name="fas fa-clipboard-question" size="56px" />
      <div class="q-mt-sm">Você ainda não tem um programa ativo.</div>
      <div class="text-caption">Aguarde seu treinador prescrever um treino.</div>
    </div>

    <!-- Dialog detalhe da sessão -->
    <q-dialog v-model="sessionDetailSheet" position="bottom">
      <q-card style="width: 100%; max-width: 600px">
        <div
          class="q-pa-md row items-center"
          :style="{
            background: selectedSession?.training_splits?.color || '#1976d2',
            borderRadius: '22px 22px 0 0',
          }"
        >
          <div class="col">
            <div class="text-white text-weight-bold text-h6">
              {{ selectedSession?.training_splits?.name || 'Treino' }}
            </div>
            <div class="text-caption" style="color: rgba(255, 255, 255, 0.8)">
              {{ formatDateFull(selectedSession?.session_date) }}
              <span v-if="selectedSession?.duration_minutes">
                · {{ selectedSession.duration_minutes }} min</span
              >
            </div>
          </div>
          <q-btn flat round dense icon="fas fa-xmark" text-color="white" v-close-popup />
        </div>

        <q-list padding>
          <q-item v-if="sessionLogs.length === 0">
            <q-item-section class="text-grey-5 text-center"
              >Nenhum exercício registrado</q-item-section
            >
          </q-item>

          <q-item v-for="log in sessionLogs" :key="log.id" class="q-py-sm">
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ log.split_exercises?.exercises?.name || 'Exercício' }}
              </q-item-label>
              <q-item-label caption>
                {{ log.sets_completed }} séries · {{ log.reps_completed }} reps
                <span v-if="log.weight_kg">
                  · <strong>{{ log.weight_kg }} kg</strong></span
                >
              </q-item-label>
              <q-item-label v-if="log.notes" caption class="text-grey-5 q-mt-xs">
                {{ log.notes }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="fas fa-dumbbell" color="grey-4" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Dialog seletor de treino -->
    <q-dialog v-model="chooserSheet" position="bottom">
      <q-card style="width: 100%; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold">Escolher treino</div>
          <q-space />
          <q-btn flat round dense icon="fas fa-xmark" v-close-popup />
        </q-card-section>

        <q-list padding>
          <template v-for="phase in sessionsStore.activeProgram?.program_phases" :key="phase.id">
            <q-item-label header class="text-caption text-grey-6 q-pt-sm q-pb-xs">
              {{ phase.name }}
            </q-item-label>

            <q-item
              v-for="split in phase.training_splits"
              :key="split.id"
              clickable
              rounded
              class="q-mb-xs"
              @click="startSplit(split)"
            >
              <q-item-section avatar>
                <div class="split-color-dot" :style="{ background: split.color || '#1976d2' }" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ split.name }}</q-item-label>
                <q-item-label caption>
                  {{ split.split_exercises?.length || 0 }} exercícios
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  v-if="split.id === nextSplit?.id"
                  text-color="white"
                  :style="{ background: split.color || '#1976d2' }"
                >
                  Sugerido
                </q-badge>
                <q-icon v-else name="fas fa-chevron-right" color="grey-4" />
              </q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'
import { useScheduleStore } from 'src/stores/schedule'
import ConsistencyCalendar from 'src/components/athlete/ConsistencyCalendar.vue'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const sessionsStore = useSessionsStore()
const scheduleStore = useScheduleStore()
const loading = ref(true)
const chooserSheet = ref(false)

const d = new Date()
const todayStr = [
  d.getFullYear(),
  String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0'),
].join('-')
const isGymClosedToday = computed(() => !scheduleStore.isGymOpen(todayStr))
const todayException = computed(() =>
  scheduleStore.exceptions.find((e) => e.exception_date === todayStr),
)

// Detalhe de sessão
const sessionDetailSheet = ref(false)
const selectedSession = ref(null)
const sessionLogs = ref([])

async function openSessionDetail({ session }) {
  selectedSession.value = session
  const { data } = await sessionsStore.fetchSessionLogs(session.id)
  sessionLogs.value = data
  sessionDetailSheet.value = true
}

function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const firstName = computed(() => (authStore.profile?.full_name || 'Atleta').split(' ')[0])
const streak = computed(() => sessionsStore.getStreak())
const completedCount = computed(() => sessionsStore.sessions.filter((s) => s.completed).length)
const achievementsCount = computed(() => sessionsStore.achievements.length)

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
})

const nextSplit = computed(() => sessionsStore.getNextSplit(sessionsStore.activeProgram))

const todayCompletedSplit = computed(() =>
  sessionsStore.getTodayCompletedSplit(sessionsStore.activeProgram),
)

const inProgressSession = computed(() => {
  const now = new Date()
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-')
  return sessionsStore.sessions.find((s) => s.session_date === today && !s.completed) || null
})

// Todos os splits do programa ativo (para o seletor)
const allSplits = computed(() => {
  const splits = []
  for (const phase of sessionsStore.activeProgram?.program_phases || []) {
    splits.push(...(phase.training_splits || []))
  }
  return splits
})

function startSplit(split) {
  chooserSheet.value = false
  router.push(`/athlete/workout/${split.id}`)
}

function hexToFaded(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, 0.1)`
}

function confirmDiscard(session) {
  $q.dialog({
    title: 'Excluir treino',
    message: `Deseja excluir o treino "${session.training_splits?.name}" que foi iniciado acidentalmente?`,
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Excluir', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(async () => {
    await sessionsStore.discardSession(session.id, authStore.user.id)
    $q.notify({ type: 'positive', message: 'Treino excluído.' })
  })
}

onMounted(async () => {
  await Promise.all([
    sessionsStore.fetchActiveProgram(authStore.user.id),
    sessionsStore.fetchSessions(authStore.user.id),
    sessionsStore.fetchAchievements(authStore.user.id),
  ])
  await sessionsStore.autoFinishStaleSessions(authStore.user.id)
  const trainerId = sessionsStore.activeProgram?.trainer_id
  if (trainerId) {
    await Promise.all([
      scheduleStore.fetchSchedule(trainerId),
      scheduleStore.fetchExceptions(trainerId),
    ])
  }
  loading.value = false
})
</script>

<style scoped>
.split-card {
  border-radius: 16px;
  overflow: hidden;
}
.split-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}
.avatar-glass {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}
.stat-card {
  padding: 16px 8px;
  text-align: center;
  border-radius: 16px !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.stat-number {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
}
.stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.35);
}
</style>
