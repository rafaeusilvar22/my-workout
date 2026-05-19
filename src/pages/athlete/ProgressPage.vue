<template>
  <q-page>
    <q-tabs v-model="activeTab" align="justify" dense class="shadow-1">
      <q-tab name="achievements" icon="emoji_events" label="Conquistas" />
      <q-tab name="evolution" icon="trending_up" label="Evolução" />
      <q-tab name="measures" icon="straighten" label="Medidas" />
    </q-tabs>

    <q-separator />

    <q-tab-panels v-model="activeTab" animated keep-alive>
      <!-- ─── Aba 1: Conquistas ─── -->
      <q-tab-panel name="achievements" class="q-pa-md">
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

        <!-- Desafios da Semana -->
        <div class="text-subtitle1 text-weight-medium q-mb-sm q-mt-md">Desafios da Semana</div>
        <div class="column q-gutter-sm q-mb-lg">
          <q-card
            v-for="challenge in weeklyChallenges"
            :key="challenge.id"
            flat bordered
            :class="challenge.progress >= 1 ? 'border-done' : ''"
          >
            <q-card-section class="q-py-sm">
              <div class="row items-center no-wrap q-gutter-sm">
                <q-icon :name="challenge.icon" :color="challenge.progress >= 1 ? challenge.color : 'grey-6'" size="28px" />
                <div class="col">
                  <div class="row items-center justify-between">
                    <span class="text-weight-bold text-body2">{{ challenge.label }}</span>
                    <q-chip
                      v-if="challenge.progress >= 1"
                      dense size="sm"
                      icon="check"
                      color="positive"
                      text-color="white"
                      class="q-ml-sm"
                    >Concluído</q-chip>
                    <span v-else class="text-caption text-grey-6">{{ challenge.current }}/{{ challenge.target }}</span>
                  </div>
                  <div class="text-caption text-grey-6 q-mb-xs">{{ challenge.description }}</div>
                  <q-linear-progress
                    :value="challenge.progress"
                    :color="challenge.progress >= 1 ? 'positive' : challenge.color"
                    rounded size="6px"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="text-subtitle1 text-weight-medium q-mb-sm">Em progresso</div>
        <div class="row q-col-gutter-sm">
          <div v-for="badge in lockedBadges" :key="badge.type" class="col-6">
            <q-card flat bordered class="text-center q-pa-md opacity-50">
              <q-icon :name="badge.icon" color="grey-5" size="36px" />
              <div class="text-weight-bold q-mt-xs text-body2 text-grey-6">{{ badge.label }}</div>
              <q-linear-progress :value="badge.progress" color="primary" class="q-mt-sm" rounded />
              <div class="text-caption text-grey-5 q-mt-xs">{{ badge.hint }}</div>
            </q-card>
          </div>
        </div>
      </q-tab-panel>

      <!-- ─── Aba 2: Evolução de Carga ─── -->
      <q-tab-panel name="evolution" class="q-pa-md">
        <div class="text-h6 text-weight-bold q-mb-md">Evolução de Carga</div>

        <div v-if="!sessionsStore.activeProgram" class="text-center text-grey-5 q-py-xl">
          <q-icon name="fitness_center" size="48px" />
          <div class="q-mt-sm">Você não possui um programa ativo.</div>
        </div>

        <template v-else>
          <q-select
            v-model="selectedExercise"
            :options="exerciseOptions"
            label="Selecione um exercício"
            outlined dense clearable
            class="q-mb-md"
            @update:model-value="loadExerciseProgress"
          />

          <div v-if="!selectedExercise" class="text-center text-grey-5 q-py-lg text-caption">
            Selecione um exercício para ver a evolução de carga.
          </div>

          <div v-else-if="loadingProgress" class="flex flex-center q-py-lg">
            <q-spinner color="primary" size="30px" />
          </div>

          <div v-else-if="progressData.length === 0" class="text-center text-grey-5 q-py-lg text-caption">
            Faça ao menos um treino com este exercício para ver a evolução.
          </div>

          <apexchart
            v-else
            type="line"
            height="250"
            :options="progressChartOptions"
            :series="progressSeries"
          />
        </template>
      </q-tab-panel>

      <!-- ─── Aba 3: Medidas Corporais ─── -->
      <q-tab-panel name="measures" class="q-pa-md">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold">Medidas Corporais</div>
          <q-btn unelevated color="primary" icon="add" label="Registrar" size="sm" @click="openAddMeasurement" />
        </div>

        <div v-if="loadingMeasures" class="flex flex-center q-py-xl">
          <q-spinner color="primary" size="40px" />
        </div>

        <div v-else-if="measurementsStore.measurements.length === 0" class="text-center text-grey-5 q-py-xl">
          <q-icon name="monitor_weight" size="48px" />
          <div class="q-mt-sm q-mb-md">Nenhuma medida registrada ainda.</div>
          <q-btn unelevated color="primary" icon="add" label="Registrar primeira medida" @click="openAddMeasurement" />
        </div>

        <template v-else>
          <apexchart
            type="line"
            height="280"
            :options="measurementsChartOptions"
            :series="measurementsSeries"
          />

          <q-card flat bordered class="q-mt-md">
            <q-card-section>
              <div class="text-subtitle2 text-weight-bold q-mb-sm">Última medida</div>
              <div class="row q-gutter-sm">
                <q-chip v-if="lastMeasurement.weight_kg != null" icon="monitor_weight" color="green-9" text-color="white" dense>
                  {{ lastMeasurement.weight_kg }} kg
                </q-chip>
                <q-chip v-if="lastMeasurement.body_fat_pct != null" icon="water_drop" color="cyan-9" text-color="white" dense>
                  {{ lastMeasurement.body_fat_pct }}% gordura
                </q-chip>
                <q-chip v-if="lastMeasurement.muscle_mass_kg != null" icon="fitness_center" color="orange-9" text-color="white" dense>
                  {{ lastMeasurement.muscle_mass_kg }} kg músculo
                </q-chip>
              </div>
              <div class="text-caption text-grey-6 q-mt-xs">{{ formatMeasureDate(lastMeasurement.measured_at) }}</div>
            </q-card-section>
          </q-card>
        </template>
      </q-tab-panel>
    </q-tab-panels>

    <!-- Dialog: Nova Medida -->
    <q-dialog v-model="addMeasurementDialog" persistent>
      <q-card style="min-width: 320px; width: 90vw; max-width: 460px;">
        <q-card-section>
          <div class="text-h6">Nova Medida</div>
        </q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <q-input v-model="measurementForm.measured_at" label="Data *" type="date" outlined dense />
          <div class="row q-gutter-sm">
            <q-input
              v-model.number="measurementForm.weight_kg"
              label="Peso (kg)" type="number" step="0.1"
              outlined dense class="col"
            />
            <q-input
              v-model.number="measurementForm.body_fat_pct"
              label="Gordura (%)" type="number" step="0.1"
              outlined dense class="col"
            />
          </div>
          <q-input
            v-model.number="measurementForm.muscle_mass_kg"
            label="Massa muscular (kg)" type="number" step="0.1"
            outlined dense
          />
          <q-input v-model="measurementForm.notes" label="Observações" type="textarea" rows="2" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="addMeasurementDialog = false" />
          <q-btn
            color="primary" label="Salvar" unelevated
            :loading="savingMeasurement"
            @click="handleAddMeasurement"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'
import { useMeasurementsStore } from 'src/stores/measurements'

function localDateStr(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

function weekStart() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return localDateStr(d)
}

function monthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const $q = useQuasar()
const authStore = useAuthStore()
const sessionsStore = useSessionsStore()
const measurementsStore = useMeasurementsStore()

const activeTab = ref('achievements')
const loading = ref(true)
const loadingProgress = ref(false)
const loadingMeasures = ref(true)
const selectedExercise = ref(null)
const progressData = ref([])
const addMeasurementDialog = ref(false)
const savingMeasurement = ref(false)
const measurementForm = ref({
  measured_at: localDateStr(),
  weight_kg: null,
  body_fat_pct: null,
  muscle_mass_kg: null,
  notes: '',
})

// ── Conquistas ──────────────────────────────────────────────────────────

const streak = computed(() => sessionsStore.getStreak())
const completedCount = computed(() => sessionsStore.sessions.filter(s => s.completed).length)
const earnedTypes = computed(() => new Set(sessionsStore.achievements.map(a => a.type)))

const allBadges = [
  { type: 'first_session', icon: 'star',                  color: 'amber',       label: 'Primeira Sessão',     target: 1   },
  { type: '10_sessions',   icon: 'military_tech',          color: 'blue',        label: '10 Sessões',          target: 10  },
  { type: '25_sessions',   icon: 'workspace_premium',      color: 'teal',        label: '25 Sessões',          target: 25  },
  { type: '50_sessions',   icon: 'diamond',                color: 'purple',      label: '50 Sessões',          target: 50  },
  { type: '100_sessions',  icon: 'emoji_events',           color: 'deep-orange', label: '100 Sessões',         target: 100 },
  { type: 'streak_7',      icon: 'local_fire_department',  color: 'orange',      label: '7 Dias Seguidos',     target: 7   },
  { type: 'streak_14',     icon: 'whatshot',               color: 'red',         label: '14 Dias Seguidos',    target: 14  },
  { type: 'streak_30',     icon: 'bolt',                   color: 'yellow',      label: '30 Dias Seguidos',    target: 30  },
]

const lockedBadges = computed(() =>
  allBadges
    .filter(b => !earnedTypes.value.has(b.type))
    .map(b => ({ ...b, progress: badgeProgress(b), hint: badgeHint(b) }))
)

function badgeProgress(badge) {
  if (badge.type.includes('streak')) return Math.min(streak.value / badge.target, 1)
  return Math.min(completedCount.value / badge.target, 1)
}

function badgeHint(badge) {
  if (badge.type.includes('streak')) return `${Math.min(streak.value, badge.target)}/${badge.target} dias`
  return `${Math.min(completedCount.value, badge.target)}/${badge.target} sessões`
}

// ── Desafios Semanais ────────────────────────────────────────────────────

const weekSessions = computed(() =>
  sessionsStore.sessions.filter(s => s.completed && s.session_date >= weekStart())
)

const monthSessions = computed(() =>
  sessionsStore.sessions.filter(s => s.completed && s.session_date >= monthStart())
)

const weeklyChallenges = computed(() => {
  const ws = weekSessions.value.length
  const ms = monthSessions.value.length
  const st = streak.value
  return [
    {
      id: 'week_4_sessions',
      icon: 'fitness_center',
      color: 'primary',
      label: '4 Treinos na Semana',
      description: 'Complete 4 treinos nesta semana',
      current: ws,
      target: 4,
      progress: Math.min(ws / 4, 1),
    },
    {
      id: 'streak_3',
      icon: 'local_fire_department',
      color: 'orange',
      label: '3 Dias Seguidos',
      description: 'Mantenha uma sequência de 3 dias',
      current: Math.min(st, 3),
      target: 3,
      progress: Math.min(st / 3, 1),
    },
    {
      id: 'month_12_sessions',
      icon: 'calendar_month',
      color: 'deep-purple',
      label: 'Meta do Mês',
      description: 'Complete 12 treinos neste mês',
      current: ms,
      target: 12,
      progress: Math.min(ms / 12, 1),
    },
  ]
})

function achIcon(type) { return allBadges.find(b => b.type === type)?.icon || 'emoji_events' }
function achColor(type) { return allBadges.find(b => b.type === type)?.color || 'amber' }
function achLabel(type) { return allBadges.find(b => b.type === type)?.label || type }

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Evolução de Carga ────────────────────────────────────────────────────

const exerciseOptions = computed(() => {
  const map = new Map()
  for (const phase of sessionsStore.activeProgram?.program_phases || []) {
    for (const split of phase.training_splits || []) {
      for (const se of split.split_exercises || []) {
        if (se.exercises?.id && !map.has(se.exercises.id)) {
          map.set(se.exercises.id, { label: se.exercises.name, value: se.exercises.id })
        }
      }
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
})

const progressChartOptions = {
  chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent', foreColor: 'rgba(255,255,255,0.7)' },
  theme: { mode: 'dark' },
  stroke: { curve: 'smooth', width: 2 },
  colors: ['#00E676'],
  xaxis: { type: 'datetime' },
  yaxis: { title: { text: 'kg' }, decimalsInFloat: 1 },
  grid: { borderColor: 'rgba(255,255,255,0.08)' },
  tooltip: { x: { format: 'dd/MM/yy' }, theme: 'dark' },
  markers: { size: 4 },
}

const progressSeries = computed(() => ([
  {
    name: 'Carga máx. (kg)',
    data: progressData.value.map(d => [new Date(d.date + 'T12:00:00').getTime(), d.weight_kg]),
  },
]))

async function loadExerciseProgress(exercise) {
  if (!exercise) { progressData.value = []; return }
  loadingProgress.value = true
  const { data } = await sessionsStore.fetchExerciseProgress(authStore.user.id, exercise.value)
  progressData.value = data || []
  loadingProgress.value = false
}

// ── Medidas Corporais ────────────────────────────────────────────────────

const lastMeasurement = computed(() => {
  const list = measurementsStore.measurements
  return list.length ? list[list.length - 1] : {}
})

const measurementsSeries = computed(() => {
  const m = measurementsStore.measurements
  const ts = dateStr => new Date(dateStr + 'T12:00:00').getTime()
  return [
    { name: 'Peso (kg)', data: m.filter(r => r.weight_kg != null).map(r => [ts(r.measured_at), r.weight_kg]) },
    { name: 'Gordura (%)', data: m.filter(r => r.body_fat_pct != null).map(r => [ts(r.measured_at), r.body_fat_pct]) },
    { name: 'Massa (kg)', data: m.filter(r => r.muscle_mass_kg != null).map(r => [ts(r.measured_at), r.muscle_mass_kg]) },
  ]
})

const measurementsChartOptions = {
  chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false }, background: 'transparent', foreColor: 'rgba(255,255,255,0.7)' },
  theme: { mode: 'dark' },
  stroke: { curve: 'smooth', width: 2 },
  colors: ['#00E676', '#00D4FF', '#FF6B00'],
  xaxis: { type: 'datetime' },
  yaxis: [
    { title: { text: 'kg' }, decimalsInFloat: 1 },
    { opposite: true, title: { text: '%' }, decimalsInFloat: 1 },
    { show: false },
  ],
  grid: { borderColor: 'rgba(255,255,255,0.08)' },
  tooltip: { x: { format: 'dd/MM/yy' }, theme: 'dark' },
  legend: { position: 'top' },
}

function formatMeasureDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function openAddMeasurement() {
  measurementForm.value = { measured_at: localDateStr(), weight_kg: null, body_fat_pct: null, muscle_mass_kg: null, notes: '' }
  addMeasurementDialog.value = true
}

async function handleAddMeasurement() {
  if (!measurementForm.value.measured_at) {
    $q.notify({ type: 'warning', message: 'Informe a data da medida.' })
    return
  }
  savingMeasurement.value = true
  const { error } = await measurementsStore.addMeasurement({
    athlete_id: authStore.user.id,
    measured_at: measurementForm.value.measured_at,
    weight_kg: measurementForm.value.weight_kg || null,
    body_fat_pct: measurementForm.value.body_fat_pct || null,
    muscle_mass_kg: measurementForm.value.muscle_mass_kg || null,
    notes: measurementForm.value.notes || null,
  })
  savingMeasurement.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    addMeasurementDialog.value = false
    $q.notify({ type: 'positive', message: 'Medida registrada!' })
  }
}

// ── Mount ────────────────────────────────────────────────────────────────

onMounted(async () => {
  const userId = authStore.user.id
  const fetches = [
    sessionsStore.fetchSessions(userId),
    sessionsStore.fetchAchievements(userId),
    measurementsStore.fetchMeasurements(userId),
  ]
  if (!sessionsStore.activeProgram) {
    fetches.push(sessionsStore.fetchActiveProgram(userId))
  }
  await Promise.all(fetches)
  loading.value = false
  loadingMeasures.value = false
})
</script>

<style scoped>
.border-done {
  border-color: var(--q-positive) !important;
}
</style>
