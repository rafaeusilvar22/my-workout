<template>
  <q-page class="q-pa-md">
    <!-- Saudação -->
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h6 text-weight-bold">Olá, {{ firstName }}! 👋</div>
        <div class="text-caption text-grey-6">{{ todayLabel }}</div>
      </div>
      <q-space />
      <div class="text-center">
        <q-icon name="local_fire_department" color="orange" size="28px" />
        <div class="text-weight-bold text-orange">{{ streak }}</div>
        <div class="text-caption text-grey-6">sequência</div>
      </div>
    </div>

    <!-- Aviso academia fechada -->
    <q-banner v-if="isGymClosedToday" rounded class="q-mb-md bg-red-1 text-red-8">
      <template #avatar>
        <q-icon name="event_busy" color="negative" />
      </template>
      <span class="text-weight-medium">Academia fechada hoje</span>
      <span v-if="todayException?.reason" class="text-caption"> · {{ todayException.reason }}</span>
    </q-banner>

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
      <div class="text-subtitle1 text-weight-bold q-mb-sm">Treino de hoje</div>

      <!-- Já treinou hoje -->
      <template v-if="todayCompletedSplit">
        <q-card
          flat bordered
          class="q-mb-sm split-card"
          :style="{
            borderLeft: `5px solid ${todayCompletedSplit.color || '#43a047'}`,
            background: hexToFaded(todayCompletedSplit.color || '#43a047'),
          }"
        >
          <q-card-section class="row items-center no-wrap">
            <q-icon
              name="check_circle"
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
        </q-card>

        <div class="text-caption text-grey-6 q-mb-xs q-mt-md">PRÓXIMO TREINO</div>
        <q-card
          v-if="nextSplit"
          flat bordered
          class="q-mb-sm split-card"
          :style="{ borderLeft: `5px solid ${nextSplit.color || '#1976d2'}` }"
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
        </q-card>
      </template>

      <!-- Próximo treino na fila -->
      <template v-else-if="nextSplit">
        <q-card
          flat bordered
          class="q-mb-sm cursor-pointer split-card"
          :style="{ borderLeft: `5px solid ${nextSplit.color || '#1976d2'}` }"
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
            <q-badge
              text-color="white"
              :style="{ background: nextSplit.color || '#1976d2' }"
            >
              Iniciar
            </q-badge>
            <q-icon name="chevron_right" color="grey-5" class="q-ml-sm" />
          </q-card-section>
        </q-card>
      </template>

      <div v-else class="text-center text-grey-5 q-py-md">
        <q-icon name="celebration" size="40px" color="orange" />
        <div class="q-mt-sm">Nenhum treino configurado na fase atual</div>
      </div>

      <!-- Botão escolher outro treino -->
      <q-btn
        v-if="allSplits.length > 1"
        flat
        color="grey-7"
        icon="swap_vert"
        label="Escolher outro treino"
        size="sm"
        class="full-width q-mt-xs"
        @click="chooserSheet = true"
      />
    </template>

    <div v-else class="text-center text-grey-5 q-py-xl">
      <q-icon name="assignment_late" size="56px" />
      <div class="q-mt-sm">Você ainda não tem um programa ativo.</div>
      <div class="text-caption">Aguarde seu treinador prescrever um treino.</div>
    </div>

    <!-- Dialog detalhe da sessão -->
    <q-dialog v-model="sessionDetailSheet" position="bottom">
      <q-card style="width: 100%; max-width: 600px; border-radius: 16px 16px 0 0;">
        <div
          class="q-pa-md row items-center"
          :style="{ background: selectedSession?.training_splits?.color || '#1976d2', borderRadius: '16px 16px 0 0' }"
        >
          <div class="col">
            <div class="text-white text-weight-bold text-h6">
              {{ selectedSession?.training_splits?.name || 'Treino' }}
            </div>
            <div class="text-caption" style="color:rgba(255,255,255,0.8)">
              {{ formatDateFull(selectedSession?.session_date) }}
              <span v-if="selectedSession?.duration_minutes"> · {{ selectedSession.duration_minutes }} min</span>
            </div>
          </div>
          <q-btn flat round dense icon="close" text-color="white" v-close-popup />
        </div>

        <div v-if="logsLoading" class="flex flex-center q-pa-lg">
          <q-spinner color="primary" size="32px" />
        </div>

        <q-list v-else padding>
          <q-item v-if="sessionLogs.length === 0">
            <q-item-section class="text-grey-5 text-center">Nenhum exercício registrado</q-item-section>
          </q-item>

          <q-item v-for="log in sessionLogs" :key="log.id" class="q-py-sm">
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ log.split_exercises?.exercises?.name || 'Exercício' }}
              </q-item-label>
              <q-item-label caption>
                {{ log.sets_completed }} séries · {{ log.reps_completed }} reps
                <span v-if="log.weight_kg"> · <strong>{{ log.weight_kg }} kg</strong></span>
              </q-item-label>
              <q-item-label v-if="log.notes" caption class="text-grey-5 q-mt-xs">
                {{ log.notes }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="fitness_center" color="grey-4" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Dialog seletor de treino -->
    <q-dialog v-model="chooserSheet" position="bottom">
      <q-card style="width: 100%; max-width: 600px; border-radius: 16px 16px 0 0;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-bold">Escolher treino</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
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
              :style="{ borderLeft: `4px solid ${split.color || '#1976d2'}` }"
              @click="startSplit(split)"
            >
              <q-item-section avatar>
                <div
                  class="split-color-dot"
                  :style="{ background: split.color || '#1976d2' }"
                />
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
                <q-icon v-else name="chevron_right" color="grey-4" />
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
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'
import { useScheduleStore } from 'src/stores/schedule'
import ConsistencyCalendar from 'src/components/athlete/ConsistencyCalendar.vue'

const router = useRouter()
const authStore = useAuthStore()
const sessionsStore = useSessionsStore()
const scheduleStore = useScheduleStore()
const loading = ref(true)
const chooserSheet = ref(false)

const todayStr = new Date().toISOString().split('T')[0]
const isGymClosedToday = computed(() => !scheduleStore.isGymOpen(todayStr))
const todayException = computed(() => scheduleStore.exceptions.find(e => e.exception_date === todayStr))

// Detalhe de sessão
const sessionDetailSheet = ref(false)
const selectedSession = ref(null)
const sessionLogs = ref([])
const logsLoading = ref(false)

async function openSessionDetail({ session }) {
  selectedSession.value = session
  sessionLogs.value = []
  sessionDetailSheet.value = true
  logsLoading.value = true
  const { data } = await sessionsStore.fetchSessionLogs(session.id)
  sessionLogs.value = data
  logsLoading.value = false
}

function formatDateFull(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

const firstName = computed(() => (authStore.profile?.full_name || 'Atleta').split(' ')[0])
const streak = computed(() => sessionsStore.getStreak())

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
})

const nextSplit = computed(() =>
  sessionsStore.getNextSplit(sessionsStore.activeProgram)
)

const todayCompletedSplit = computed(() =>
  sessionsStore.getTodayCompletedSplit(sessionsStore.activeProgram)
)

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


onMounted(async () => {
  await Promise.all([
    sessionsStore.fetchActiveProgram(authStore.user.id),
    sessionsStore.fetchSessions(authStore.user.id),
  ])
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
  border-radius: 10px;
}
.split-color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
