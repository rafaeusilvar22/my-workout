<template>
  <q-page class="workout-page">
    <!-- Header imersivo -->
    <div class="workout-header" :style="headerStyle">
      <div class="row items-center q-mb-lg">
        <button class="header-btn" @click="$router.back()">
          <i class="fas fa-arrow-left" />
        </button>
        <q-space />
        <div class="timer-pill">
          <i class="fas fa-stopwatch timer-pill__icon" />
          <span class="timer-pill__value">{{ elapsedFormatted }}</span>
        </div>
        <q-space />
        <button class="header-btn" @click="confirmDiscard">
          <i class="far fa-trash-can" />
        </button>
      </div>

      <div class="text-h5 text-weight-bold text-white q-mb-xs" style="letter-spacing: -0.5px;">
        {{ split?.name || 'Treino' }}
      </div>
      <div class="q-mb-md">
        <span class="done-count-chip">
          <i class="fas fa-circle-check done-count-chip__icon" />
          <span>{{ doneCount }}/{{ exercises.length }} exercícios</span>
        </span>
      </div>

      <q-linear-progress
        :value="progress"
        rounded
        size="4px"
        color="white"
        track-color="rgba(255,255,255,0.2)"
      />
    </div>

    <!-- Conteúdo -->
    <div class="q-pa-md">
      <div v-if="loading" class="flex flex-center q-py-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <template v-else>
        <!-- Hint opcional -->
        <div class="row items-center q-mb-md">
          <span class="text-caption text-grey-5">Carga, reps e séries são opcionais</span>
          <q-btn
            flat round dense size="xs"
            icon="fas fa-circle-info"
            color="primary"
            class="q-ml-xs info-btn"
            @click="showInfoDialog"
          />
        </div>

        <template v-for="(group, gi) in exerciseGroups" :key="gi">
          <!-- Bi-set -->
          <div
            v-if="group.superset"
            class="glass-card exercise-card q-mb-sm"
            :style="isGroupDone(group) ? { background: hexToFaded(split?.color) } : {}"
          >
            <div class="q-mb-sm">
              <span class="superset-badge">BI-SET</span>
            </div>

            <template v-for="(se, si) in group.items" :key="se.id">
              <div v-if="si > 0" class="exercise-divider" />
              <div class="exercise-row">
                <span class="exercise-num exercise-num--superset">{{ gi + 1 }}{{ 'ABCDEFGH'[si] }}</span>
                <div class="col">
                  <div class="row items-start justify-between no-wrap q-mb-sm">
                    <div class="col">
                      <div class="text-weight-bold q-mb-xs">{{ se.exercises?.name }}</div>
                      <div class="text-caption text-grey-5">
                        {{ se.sets }} séries · {{ se.reps }} reps
                        <span v-if="si === group.items.length - 1"> · {{ se.rest_seconds }}s descanso</span>
                      </div>
                    </div>
                    <div class="row items-center q-gutter-xs q-ml-sm">
                      <img
                        v-if="se.exercises?.image_url"
                        :src="se.exercises.image_url"
                        class="exercise-thumb"
                        @click.stop="viewImage(se.exercises)"
                      />
                      <button
                        class="done-btn"
                        :class="{ 'done-btn--active': logMap[se.id].done }"
                        :style="logMap[se.id].done ? { background: split?.color, borderColor: 'transparent' } : {}"
                        @click="onToggleDone(se, !logMap[se.id].done)"
                      >
                        <i class="fas fa-check" />
                      </button>
                    </div>
                  </div>
                  <div class="row q-gutter-xs">
                    <q-input v-model.number="logMap[se.id].weight_kg" label="Carga (kg)" borderless dense type="number" class="col workout-input" @blur="saveLog(se)" />
                    <q-input v-model="logMap[se.id].reps_completed" label="Reps feitas" borderless dense class="col workout-input" @blur="saveLog(se)" />
                    <q-input v-model.number="logMap[se.id].sets_completed" label="Séries" borderless dense type="number" style="max-width: 68px" class="workout-input" @blur="saveLog(se)" />
                  </div>
                  <q-input v-if="se.notes" readonly :model-value="se.notes" label="Obs. do treinador" borderless dense class="q-mt-xs workout-input workout-input--note" />
                </div>
              </div>
            </template>
          </div>

          <!-- Exercício normal -->
          <div
            v-else
            class="glass-card exercise-card q-mb-sm"
            :style="logMap[group.items[0].id]?.done ? { background: hexToFaded(split?.color) } : {}"
          >
            <div class="exercise-row">
              <span class="exercise-num">{{ gi + 1 }}</span>
              <div class="col">
                <div class="row items-start justify-between no-wrap q-mb-sm">
                  <div class="col">
                    <div class="text-weight-bold q-mb-xs">{{ group.items[0].exercises?.name }}</div>
                    <div class="text-caption text-grey-5">
                      {{ group.items[0].sets }} séries · {{ group.items[0].reps }} reps · {{ group.items[0].rest_seconds }}s descanso
                    </div>
                  </div>
                  <div class="row items-center q-gutter-xs q-ml-sm">
                    <img
                      v-if="group.items[0].exercises?.image_url"
                      :src="group.items[0].exercises.image_url"
                      class="exercise-thumb"
                      @click.stop="viewImage(group.items[0].exercises)"
                    />
                    <button
                      class="done-btn"
                      :class="{ 'done-btn--active': logMap[group.items[0].id].done }"
                      :style="logMap[group.items[0].id].done ? { background: split?.color, borderColor: 'transparent' } : {}"
                      @click="onToggleDone(group.items[0], !logMap[group.items[0].id].done)"
                    >
                      <i class="fas fa-check" />
                    </button>
                  </div>
                </div>
                <div class="row q-gutter-xs">
                  <q-input v-model.number="logMap[group.items[0].id].weight_kg" label="Carga (kg)" borderless dense type="number" class="col workout-input" @blur="saveLog(group.items[0])" />
                  <q-input v-model="logMap[group.items[0].id].reps_completed" label="Reps feitas" borderless dense class="col workout-input" @blur="saveLog(group.items[0])" />
                  <q-input v-model.number="logMap[group.items[0].id].sets_completed" label="Séries" borderless dense type="number" style="max-width: 68px" class="workout-input" @blur="saveLog(group.items[0])" />
                </div>
                <q-input v-if="group.items[0].notes" readonly :model-value="group.items[0].notes" label="Obs. do treinador" borderless dense class="q-mt-xs workout-input workout-input--note" />
              </div>
            </div>
          </div>
        </template>

        <button
          class="finish-btn q-mt-md"
          :class="{
            'finish-btn--partial': doneCount > 0 && doneCount < exercises.length,
            'finish-btn--ready': exercises.length > 0 && doneCount === exercises.length,
          }"
          :disabled="doneCount === 0 || finishing"
          @click="finishWorkout"
        >
          <span class="finish-btn__inner">
            <q-spinner v-if="finishing" color="white" size="18px" />
            <template v-else>
              <i class="fas fa-circle-check" />
              <span>Finalizar Treino</span>
            </template>
          </span>
        </button>
      </template>
    </div>

    <!-- Dialog: visualização da imagem -->
    <q-dialog v-model="imageDialog">
      <q-card style="width: 92vw; max-width: 420px">
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="text-subtitle1 text-weight-bold">{{ imageExercise?.name }}</div>
          <q-btn flat round dense icon="fas fa-xmark" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <img :src="imageExercise?.image_url" style="width: 100%; border-radius: 8px; display: block" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()
const sessionsStore = useSessionsStore()

const loading = ref(true)
const finishing = ref(false)
const imageDialog = ref(false)
const imageExercise = ref(null)
const sessionId = ref(null)
const split = ref(null)
const exercises = ref([])
const logMap = reactive({})
let startTime = Date.now()
const elapsed = ref(0)
let timer = null

const headerStyle = computed(() => {
  const c = split.value?.color || '#1976d2'
  return {
    background: `linear-gradient(160deg, ${c}ee 0%, ${c}aa 100%)`,
  }
})

function hexToFaded(hex) {
  if (!hex || hex.length < 7) return 'transparent'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.12)`
}

const elapsedFormatted = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const doneCount = computed(() => Object.values(logMap).filter((l) => l.done).length)
const progress = computed(() =>
  exercises.value.length ? doneCount.value / exercises.value.length : 0,
)

const exerciseGroups = computed(() => {
  const sorted = [...exercises.value].sort((a, b) => a.order_index - b.order_index)
  const groups = []
  const seen = new Map()
  for (const se of sorted) {
    if (se.superset_group) {
      if (seen.has(se.superset_group)) {
        groups[seen.get(se.superset_group)].items.push(se)
      } else {
        seen.set(se.superset_group, groups.length)
        groups.push({ superset: true, items: [se] })
      }
    } else {
      groups.push({ superset: false, items: [se] })
    }
  }
  return groups
})

function isGroupDone(group) {
  return group.items.every((se) => logMap[se.id]?.done)
}

async function onToggleDone(se, val) {
  logMap[se.id].done = val
  if (val) await saveLog(se)
}

async function saveLog(se) {
  if (!sessionId.value) return
  const entry = logMap[se.id]
  await sessionsStore.logExercise(sessionId.value, se.id, {
    sets_completed: entry.sets_completed || se.sets,
    reps_completed: entry.reps_completed || se.reps,
    weight_kg: entry.weight_kg || null,
    notes: entry.notes || null,
  })
}

function viewImage(exercise) {
  imageExercise.value = exercise
  imageDialog.value = true
}

function showInfoDialog() {
  $q.dialog({
    title: 'Por que registrar esses dados?',
    message:
      'Carga, repetições e séries realizadas são opcionais. Ao preenchê-los, o seu treinador consegue acompanhar a sua evolução, ajustar o plano e personalizar os próximos treinos com muito mais precisão.',
    ok: { label: 'Entendi', color: 'primary', unelevated: true },
  })
}

function confirmDiscard() {
  $q.dialog({
    title: 'Excluir treino',
    message: 'Deseja excluir este treino? Os exercícios registados serão apagados.',
    cancel: { label: 'Cancelar', flat: true },
    ok: { label: 'Excluir', color: 'negative', unelevated: true },
    persistent: true,
  }).onOk(async () => {
    if (sessionId.value) {
      await sessionsStore.discardSession(sessionId.value, authStore.user.id)
    }
    router.push('/athlete/home')
  })
}

async function finishWorkout() {
  finishing.value = true
  const duration = Math.floor((Date.now() - startTime) / 60000)
  const { error } = await sessionsStore.completeSession(sessionId.value, duration)
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
    finishing.value = false
    return
  }

  const newAchievements = await sessionsStore.checkAndGrantAchievements(authStore.user.id)
  finishing.value = false

  if (newAchievements?.length > 0) {
    $q.notify({
      type: 'positive',
      icon: 'fas fa-trophy',
      message: `Conquista desbloqueada: ${newAchievements[0].description}`,
      timeout: 4000,
    })
  } else {
    $q.notify({ type: 'positive', message: 'Treino concluído! 💪' })
  }

  router.push('/athlete/home')
}

onMounted(async () => {
  const splitId = route.params.splitId
  const program = sessionsStore.activeProgram

  if (program) {
    for (const phase of program.program_phases || []) {
      const found = (phase.training_splits || []).find((s) => s.id === splitId)
      if (found) { split.value = found; break }
    }
  }

  if (!split.value) {
    await sessionsStore.fetchActiveProgram(authStore.user.id)
    const prog = sessionsStore.activeProgram
    for (const phase of prog?.program_phases || []) {
      const found = (phase.training_splits || []).find((s) => s.id === splitId)
      if (found) { split.value = found; break }
    }
  }

  exercises.value = split.value?.split_exercises || []

  for (const se of exercises.value) {
    logMap[se.id] = { done: false, weight_kg: null, reps_completed: '', sets_completed: null, notes: '' }
  }

  const { data, error } = await sessionsStore.startSession(authStore.user.id, splitId)
  if (!error) {
    sessionId.value = data?.id
    if (data?.started_at) {
      startTime = new Date(data.started_at).getTime()
      elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    }
  }

  if (sessionId.value) {
    const [{ data: existingLogs }, { data: prevLogs }] = await Promise.all([
      sessionsStore.fetchSessionLogs(sessionId.value),
      sessionsStore.fetchPreviousSessionLogs(authStore.user.id, splitId, sessionId.value),
    ])

    const existingMap = new Map((existingLogs || []).map((l) => [l.split_exercise_id, l]))
    const prevMap = new Map((prevLogs || []).map((l) => [l.split_exercise_id, l]))

    for (const se of exercises.value) {
      if (existingMap.has(se.id)) {
        const log = existingMap.get(se.id)
        logMap[se.id].done = true
        logMap[se.id].weight_kg = log.weight_kg
        logMap[se.id].reps_completed = log.reps_completed || ''
        logMap[se.id].sets_completed = log.sets_completed || null
      } else if (prevMap.has(se.id)) {
        const log = prevMap.get(se.id)
        if (log.weight_kg) logMap[se.id].weight_kg = log.weight_kg
        if (log.reps_completed) logMap[se.id].reps_completed = log.reps_completed
        if (log.sets_completed) logMap[se.id].sets_completed = log.sets_completed
      }
    }
  }

  loading.value = false
  timer = setInterval(() => { elapsed.value = Math.floor((Date.now() - startTime) / 1000) }, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.workout-page {
  padding-bottom: 80px;
}

/* ── Header ── */
.workout-header {
  padding: 20px 16px 24px;
}

.timer-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 100px;
  background: rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.13);
  font-variant-numeric: tabular-nums;
}

.timer-pill__icon {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.timer-pill__value {
  font-size: 17px;
  font-weight: 800;
  color: white;
  letter-spacing: 2.5px;
}

.header-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

/* ── Exercise cards ── */
.exercise-card {
  padding: 16px;
}

.exercise-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.exercise-divider {
  height: 1px;
  background: rgba(128, 128, 128, 0.15);
  margin: 12px 0;
}

/* ── Exercise number pill ── */
.exercise-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(128, 128, 128, 0.12);
  font-size: 11px;
  font-weight: 700;
  color: rgba(128, 128, 128, 0.8);
  flex-shrink: 0;
  margin-top: 2px;
}

.exercise-num--superset {
  background: rgba(255, 107, 0, 0.15);
  color: #ff6b00;
}

/* ── Superset badge ── */
.superset-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 10px;
  border-radius: 20px;
  background: rgba(255, 107, 0, 0.12);
  color: #ff6b00;
  border: 1px solid rgba(255, 107, 0, 0.28);
  letter-spacing: 0.5px;
}

/* ── Done count chip ── */
.done-count-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 13px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 0.2px;
}

.done-count-chip__icon {
  font-size: 11px;
  opacity: 0.72;
}

/* ── Done button ── */
.done-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  color: rgba(255, 255, 255, 0.22);
  font-size: 13px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.done-btn:active {
  transform: scale(0.86);
  transition: transform 0.1s ease;
}

.done-btn--active {
  color: white;
  transform: scale(1.06);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28), 0 0 0 3px rgba(255, 255, 255, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}

/* ── Done button: light theme overrides ── */
:global(body.body--light .done-btn) {
  border-color: rgba(0, 0, 0, 0.18);
  background: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 1px 4px rgba(0, 0, 0, 0.08);
}

:global(body.body--light .done-btn--active) {
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.22);
}

/* ── Exercise image ── */
.exercise-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.9;
}

/* ── Inputs ── */
.workout-input :deep(.q-field__control) {
  background: rgba(128, 128, 128, 0.08);
  border-radius: 10px;
  padding: 0 10px;
  min-height: 40px;
}

.workout-input :deep(.q-field__label) {
  font-size: 11px;
}

.workout-input--note :deep(.q-field__control) {
  background: rgba(255, 211, 42, 0.07);
}

/* ── Finish button ── */
.finish-btn {
  width: 100%;
  padding: 18px 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.25);
  font-family: inherit;
}

.finish-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.finish-btn--partial {
  background: rgba(52, 211, 153, 0.15);
  border-color: rgba(52, 211, 153, 0.28);
  color: #6ee7b7;
}

.finish-btn--ready {
  background: linear-gradient(145deg, rgba(52, 211, 153, 0.88), rgba(16, 185, 129, 0.92));
  border-color: rgba(255, 255, 255, 0.18);
  color: white;
  animation: finish-glow 2.2s ease-in-out infinite;
}

.finish-btn:not(:disabled):active {
  transform: scale(0.97);
  transition: transform 0.1s ease;
}

.finish-btn__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

@keyframes finish-glow {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(52, 211, 153, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
  50% {
    box-shadow: 0 8px 42px rgba(52, 211, 153, 0.65), 0 0 0 5px rgba(52, 211, 153, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }
}

/* ── Info btn pulse ── */
@keyframes info-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.65; }
}

.info-btn {
  animation: info-pulse 2s ease-in-out infinite;
}
</style>
