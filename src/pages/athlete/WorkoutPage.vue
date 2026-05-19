<template>
  <q-page>
    <!-- Header colorido -->
    <div
      class="q-pa-md row items-center"
      :style="{ background: split?.color || '#1976d2' }"
    >
      <q-btn flat round dense icon="arrow_back" text-color="white" @click="$router.back()" class="q-mr-sm" />
      <div class="col">
        <div class="text-h6 text-weight-bold text-white">{{ split?.name || 'Treino' }}</div>
        <div class="text-caption" style="color: rgba(255,255,255,0.8)">{{ exercises.length }} exercícios</div>
      </div>
      <div class="text-caption text-white text-weight-bold q-mr-sm">{{ elapsedFormatted }}</div>
      <q-btn flat round dense icon="delete_outline" text-color="white" style="opacity:0.7" @click="confirmDiscard" />
    </div>

    <div class="q-pa-md">
    <!-- Progresso -->
    <q-linear-progress
      :value="progress"
      class="q-mb-md"
      rounded
      size="8px"
      :style="{ accentColor: split?.color }"
    />
    <div class="text-caption text-grey-6 text-right q-mb-md">
      {{ doneCount }}/{{ exercises.length }} concluídos
    </div>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- Info opcional -->
      <div class="row items-center q-mb-sm">
        <span class="text-caption text-grey-5">Carga, reps e séries são opcionais</span>
        <q-btn flat round dense size="xs" icon="info_outline" color="primary" class="q-ml-xs info-btn" @click="showInfoDialog" />
      </div>

      <template v-for="(group, gi) in exerciseGroups" :key="gi">
        <!-- Bi-set card -->
        <q-card
          v-if="group.superset"
          flat bordered
          class="q-mb-sm"
          :class="{ 'border-done': isGroupDone(group) }"
          style="border-left: 3px solid var(--q-accent);"
        >
          <div class="row items-center q-px-md q-pt-sm q-pb-none">
            <q-icon name="swap_vert" size="14px" color="orange" class="q-mr-xs" />
            <span class="text-caption text-orange text-weight-bold">BI-SET</span>
          </div>
          <template v-for="(se, si) in group.items" :key="se.id">
            <q-separator v-if="si > 0" inset />
            <q-card-section class="q-py-sm">
              <div class="row items-start no-wrap">
                <div class="text-weight-bold text-orange q-mr-xs q-mt-sm" style="min-width: 24px; font-size: 12px;">
                  {{ gi + 1 }}{{ 'ABCDEFGH'[si] }}
                </div>
                <q-checkbox
                  v-model="logMap[se.id].done"
                  color="orange"
                  class="q-mr-xs q-mt-xs"
                  @update:model-value="val => onToggleDone(se, val)"
                />
                <div class="col">
                  <div class="row items-center justify-between no-wrap">
                    <div class="text-weight-bold">{{ se.exercises?.name }}</div>
                    <img
                      v-if="se.exercises?.image_url"
                      :src="se.exercises.image_url"
                      class="exercise-thumb"
                      @click.stop="viewImage(se.exercises)"
                    />
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ se.sets }} séries · {{ se.reps }} reps
                    <span v-if="si === group.items.length - 1"> · {{ se.rest_seconds }}s descanso</span>
                  </div>
                  <div class="row q-gutter-sm q-mt-sm">
                    <q-input
                      v-model.number="logMap[se.id].weight_kg"
                      label="Carga (kg)"
                      outlined dense
                      type="number"
                      class="col"
                      @blur="saveLog(se)"
                    />
                    <q-input
                      v-model="logMap[se.id].reps_completed"
                      label="Reps feitas"
                      outlined dense
                      class="col"
                      @blur="saveLog(se)"
                    />
                    <q-input
                      v-model.number="logMap[se.id].sets_completed"
                      label="Séries"
                      outlined dense
                      type="number"
                      style="max-width: 72px"
                      @blur="saveLog(se)"
                    />
                  </div>
                  <q-input
                    v-if="se.notes"
                    readonly
                    :model-value="se.notes"
                    label="Obs. do treinador"
                    outlined dense
                    class="q-mt-xs"
                  />
                </div>
              </div>
            </q-card-section>
          </template>
        </q-card>

        <!-- Exercício normal -->
        <q-card
          v-else
          flat bordered
          class="q-mb-sm"
          :class="{ 'border-done': logMap[group.items[0].id]?.done }"
        >
          <q-card-section>
            <div class="row items-start no-wrap">
              <div class="text-weight-bold text-grey-5 q-mr-xs q-mt-sm" style="min-width: 24px; font-size: 12px;">
                {{ gi + 1 }}
              </div>
              <q-checkbox
                v-model="logMap[group.items[0].id].done"
                color="primary"
                class="q-mr-xs q-mt-xs"
                @update:model-value="val => onToggleDone(group.items[0], val)"
              />
              <div class="col">
                <div class="row items-center justify-between no-wrap">
                  <div class="text-weight-bold">{{ group.items[0].exercises?.name }}</div>
                  <img
                    v-if="group.items[0].exercises?.image_url"
                    :src="group.items[0].exercises.image_url"
                    class="exercise-thumb"
                    @click.stop="viewImage(group.items[0].exercises)"
                  />
                </div>
                <div class="text-caption text-grey-6">
                  {{ group.items[0].sets }} séries · {{ group.items[0].reps }} reps · {{ group.items[0].rest_seconds }}s descanso
                </div>
                <div class="row q-gutter-sm q-mt-sm">
                  <q-input
                    v-model.number="logMap[group.items[0].id].weight_kg"
                    label="Carga (kg)"
                    outlined dense
                    type="number"
                    class="col"
                    @blur="saveLog(group.items[0])"
                  />
                  <q-input
                    v-model="logMap[group.items[0].id].reps_completed"
                    label="Reps feitas"
                    outlined dense
                    class="col"
                    @blur="saveLog(group.items[0])"
                  />
                  <q-input
                    v-model.number="logMap[group.items[0].id].sets_completed"
                    label="Séries"
                    outlined dense
                    type="number"
                    style="max-width: 72px"
                    @blur="saveLog(group.items[0])"
                  />
                </div>
                <q-input
                  v-if="group.items[0].notes"
                  readonly
                  :model-value="group.items[0].notes"
                  label="Obs. do treinador"
                  outlined dense
                  class="q-mt-xs"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>

      <q-btn
        color="positive"
        label="Finalizar Treino"
        icon="check_circle"
        class="full-width q-mt-md"
        size="lg"
        unelevated
        :loading="finishing"
        :disable="doneCount === 0"
        @click="finishWorkout"
      />
    </template>
    </div>

    <!-- Dialog: visualização da imagem do exercício -->
    <q-dialog v-model="imageDialog">
      <q-card style="width: 92vw; max-width: 420px;">
        <q-card-section class="row items-center justify-between q-pb-xs">
          <div class="text-subtitle1 text-weight-bold">{{ imageExercise?.name }}</div>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <img :src="imageExercise?.image_url" style="width: 100%; border-radius: 8px; display: block;" />
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

const elapsedFormatted = computed(() => {
  const m = Math.floor(elapsed.value / 60)
  const s = elapsed.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const doneCount = computed(() => Object.values(logMap).filter(l => l.done).length)
const progress = computed(() => exercises.value.length ? doneCount.value / exercises.value.length : 0)

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
  return group.items.every(se => logMap[se.id]?.done)
}

async function onToggleDone(se, val) {
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
    title: 'Por que registar esses dados?',
    message: 'Carga, repetições e séries realizadas são opcionais. Ao preenchê-los, o seu treinador consegue acompanhar a sua evolução, ajustar o plano e personalizar os próximos treinos com muito mais precisão.',
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
      icon: 'emoji_events',
      message: `Conquista desbloqueada: ${newAchievements[0].description}`,
      timeout: 4000,
    })
  } else {
    $q.notify({ type: 'positive', message: 'Treino concluído! 💪' })
  }

  router.push('/athlete/home')
}

onMounted(async () => {
  // Encontra o split no programa ativo
  const splitId = route.params.splitId
  const program = sessionsStore.activeProgram

  if (program) {
    for (const phase of program.program_phases || []) {
      const found = (phase.training_splits || []).find(s => s.id === splitId)
      if (found) { split.value = found; break }
    }
  }

  if (!split.value) {
    // Reload se necessário
    await sessionsStore.fetchActiveProgram(authStore.user.id)
    const prog = sessionsStore.activeProgram
    for (const phase of prog?.program_phases || []) {
      const found = (phase.training_splits || []).find(s => s.id === splitId)
      if (found) { split.value = found; break }
    }
  }

  exercises.value = split.value?.split_exercises || []

  // Inicializa logMap com valores vazios
  for (const se of exercises.value) {
    logMap[se.id] = { done: false, weight_kg: null, reps_completed: '', sets_completed: null, notes: '' }
  }

  // Inicia sessão
  const { data, error } = await sessionsStore.startSession(authStore.user.id, splitId)
  if (!error) {
    sessionId.value = data?.id
    if (data?.started_at) {
      startTime = new Date(data.started_at).getTime()
      elapsed.value = Math.floor((Date.now() - startTime) / 1000)
    }
  }

  // Pré-preenche com logs existentes (sessão retomada) e/ou treino anterior
  if (sessionId.value) {
    const [{ data: existingLogs }, { data: prevLogs }] = await Promise.all([
      sessionsStore.fetchSessionLogs(sessionId.value),
      sessionsStore.fetchPreviousSessionLogs(authStore.user.id, splitId, sessionId.value),
    ])

    const existingMap = new Map((existingLogs || []).map(l => [l.split_exercise_id, l]))
    const prevMap = new Map((prevLogs || []).map(l => [l.split_exercise_id, l]))

    for (const se of exercises.value) {
      if (existingMap.has(se.id)) {
        // Sessão retomada: restaura o que já foi registado
        const log = existingMap.get(se.id)
        logMap[se.id].done = true
        logMap[se.id].weight_kg = log.weight_kg
        logMap[se.id].reps_completed = log.reps_completed || ''
        logMap[se.id].sets_completed = log.sets_completed || null
      } else if (prevMap.has(se.id)) {
        // Sugestão do treino anterior (apenas preenche, não marca como feito)
        const log = prevMap.get(se.id)
        if (log.weight_kg) logMap[se.id].weight_kg = log.weight_kg
        if (log.reps_completed) logMap[se.id].reps_completed = log.reps_completed
        if (log.sets_completed) logMap[se.id].sets_completed = log.sets_completed
      }
    }
  }

  loading.value = false

  // Cronômetro — cálculo absoluto para manter precisão ao retomar
  timer = setInterval(() => { elapsed.value = Math.floor((Date.now() - startTime) / 1000) }, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.border-done {
  border-color: var(--q-primary) !important;
}

.exercise-thumb {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

@keyframes info-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.65; }
}

.info-btn {
  animation: info-pulse 2s ease-in-out infinite;
  cursor: pointer;
}
</style>
