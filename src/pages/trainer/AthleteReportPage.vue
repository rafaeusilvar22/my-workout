<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.back()" class="q-mr-sm" />
      <div class="col">
        <div class="text-h6 text-weight-bold">Relatório do Aluno</div>
        <div class="text-caption text-grey-6">{{ athlete?.full_name }}</div>
      </div>
    </div>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- Seção 1: Progresso do Programa -->
      <q-card v-if="currentProgram" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-xs">Progresso do Programa</div>
          <div class="text-caption text-grey-6 q-mb-sm">{{ currentProgram.name }}</div>

          <div class="row q-gutter-xs q-mb-md flex-wrap">
            <q-chip dense size="sm" icon="today" color="primary" text-color="white">
              Semana {{ currentWeek }}/{{ totalWeeks }}
            </q-chip>
            <q-chip dense size="sm" icon="fitness_center" color="green-1" text-color="green-9">
              {{ completedCount }} sessões
            </q-chip>
            <q-chip dense size="sm" icon="schedule" color="orange-1" text-color="orange-9">
              {{ daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Programa encerrado' }}
            </q-chip>
          </div>

          <q-linear-progress
            :value="progressPct"
            color="primary"
            track-color="grey-3"
            size="10px"
            rounded
          />
          <div class="text-right text-caption text-grey-6 q-mt-xs">
            {{ Math.round(progressPct * 100) }}%
          </div>
        </q-card-section>
      </q-card>

      <!-- Seção 2: Medidas Corporais -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Medidas Corporais</div>

          <div v-if="measurementsStore.measurements.length === 0" class="text-center text-grey-5 q-py-lg">
            <q-icon name="monitor_weight" size="40px" />
            <div class="q-mt-sm text-caption">Sem medidas. Adicione a primeira medida abaixo.</div>
          </div>

          <apexchart
            v-else
            type="line"
            height="250"
            :options="measurementsChartOptions"
            :series="measurementsSeries"
          />
        </q-card-section>
      </q-card>

      <!-- Seção 3: Frequência Semanal -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Frequência Semanal</div>

          <div v-if="athleteSessions.length === 0" class="text-center text-grey-5 q-py-lg">
            <q-icon name="event_busy" size="40px" />
            <div class="q-mt-sm text-caption">Sem sessões registadas.</div>
          </div>

          <apexchart
            v-else
            type="bar"
            height="200"
            :options="frequencyChartOptions"
            :series="frequencySeries"
          />
        </q-card-section>
      </q-card>

      <!-- Seção 4: Evolução de Carga -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Evolução de Carga</div>

          <q-select
            v-model="selectedExercise"
            :options="exerciseOptions"
            label="Selecione um exercício"
            outlined dense clearable
            class="q-mb-md"
            @update:model-value="loadExerciseProgress"
          />

          <div v-if="!selectedExercise" class="text-center text-grey-5 q-py-md text-caption">
            Selecione um exercício para ver a evolução de carga.
          </div>

          <div v-else-if="loadingProgress" class="flex flex-center q-py-md">
            <q-spinner color="primary" size="30px" />
          </div>

          <div v-else-if="progressData.length === 0" class="text-center text-grey-5 q-py-md text-caption">
            Sem cargas registadas para este exercício.
          </div>

          <apexchart
            v-else
            type="line"
            height="220"
            :options="progressChartOptions"
            :series="progressSeries"
          />
        </q-card-section>
      </q-card>

      <!-- Seção 5: Histórico de Medidas -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle1 text-weight-bold">Histórico de Medidas</div>
            <q-btn color="primary" icon="add" label="Nova medida" unelevated size="sm" @click="openAddMeasurement" />
          </div>

          <q-table
            :rows="measurementsReversed"
            :columns="measurementColumns"
            row-key="id"
            flat dense
            hide-bottom
            :rows-per-page-options="[0]"
            no-data-label="Nenhuma medida registada"
          >
            <template #body-cell-measured_at="props">
              <q-td :props="props">{{ formatDate(props.row.measured_at) }}</q-td>
            </template>
            <template #body-cell-delete="props">
              <q-td :props="props">
                <q-btn flat round dense icon="delete" color="negative" size="sm"
                  @click="confirmDeleteMeasurement(props.row)" />
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </template>

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
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useProgramsStore } from 'src/stores/programs'
import { useSessionsStore } from 'src/stores/sessions'
import { useMeasurementsStore } from 'src/stores/measurements'
import { useAuthStore } from 'src/stores/auth'

const route = useRoute()
const $q = useQuasar()
const programsStore = useProgramsStore()
const sessionsStore = useSessionsStore()
const measurementsStore = useMeasurementsStore()
const authStore = useAuthStore()

const athleteId = route.params.id
const loading = ref(true)
const athleteSessions = ref([])
const selectedExercise = ref(null)
const loadingProgress = ref(false)
const progressData = ref([])
const addMeasurementDialog = ref(false)
const savingMeasurement = ref(false)
const measurementForm = ref({
  measured_at: new Date().toISOString().split('T')[0],
  weight_kg: null,
  body_fat_pct: null,
  muscle_mass_kg: null,
  notes: '',
})

const athlete = computed(() => programsStore.athletes.find(a => a.id === athleteId))

const currentProgram = computed(() =>
  programsStore.currentProgram?.athlete_id === athleteId ? programsStore.currentProgram : null
)

// Seção 1: Progresso do programa
const totalWeeks = computed(() => {
  const prog = currentProgram.value
  if (!prog?.program_phases?.length) return 0
  return Math.max(...prog.program_phases.map(p => p.week_end || 0))
})

const currentWeek = computed(() => {
  const prog = currentProgram.value
  if (!prog?.start_date || !totalWeeks.value) return 1
  const start = new Date(prog.start_date + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const week = Math.floor((today - start) / (7 * 86400000)) + 1
  return Math.max(1, Math.min(week, totalWeeks.value))
})

const progressPct = computed(() => {
  if (!totalWeeks.value) return 0
  return Math.min(currentWeek.value / totalWeeks.value, 1)
})

const daysRemaining = computed(() => {
  const prog = currentProgram.value
  if (!prog) return 0
  let endDate
  if (prog.end_date) {
    endDate = new Date(prog.end_date + 'T00:00:00')
  } else if (prog.start_date && totalWeeks.value) {
    endDate = new Date(prog.start_date + 'T00:00:00')
    endDate.setDate(endDate.getDate() + totalWeeks.value * 7)
  } else {
    return 0
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((endDate - today) / 86400000)
})

const completedCount = computed(() => {
  const prog = currentProgram.value
  const list = athleteSessions.value.filter(s => s.completed)
  if (!prog?.start_date) return list.length
  return list.filter(s => s.session_date >= prog.start_date).length
})

// Seção 2: Gráfico de medidas corporais
const measurementsSeries = computed(() => {
  const m = measurementsStore.measurements
  const ts = dateStr => new Date(dateStr + 'T12:00:00').getTime()
  return [
    {
      name: 'Peso (kg)',
      data: m.filter(r => r.weight_kg != null).map(r => [ts(r.measured_at), r.weight_kg]),
    },
    {
      name: 'Gordura (%)',
      data: m.filter(r => r.body_fat_pct != null).map(r => [ts(r.measured_at), r.body_fat_pct]),
    },
    {
      name: 'Massa muscular (kg)',
      data: m.filter(r => r.muscle_mass_kg != null).map(r => [ts(r.measured_at), r.muscle_mass_kg]),
    },
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

// Seção 3: Frequência semanal
function getISOWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay() === 0 ? 7 : d.getDay()
  const thu = new Date(d)
  thu.setDate(d.getDate() + 4 - day)
  const year = thu.getFullYear()
  const firstThu = new Date(year, 0, 4)
  const weekNum = Math.ceil(((thu - firstThu) / 86400000 + 1) / 7)
  return `${year}-${String(weekNum).padStart(2, '0')}`
}

const weeklyFrequency = computed(() => {
  const map = new Map()
  for (const s of athleteSessions.value.filter(s => s.completed)) {
    const key = getISOWeekKey(s.session_date)
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()].sort(([a], [b]) => a < b ? -1 : 1)
})

const frequencyChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', foreColor: 'rgba(255,255,255,0.7)' },
  theme: { mode: 'dark' },
  colors: ['#00E676'],
  xaxis: { categories: weeklyFrequency.value.map((_, i) => `Sem ${i + 1}`) },
  yaxis: { min: 0, decimalsInFloat: 0, title: { text: 'Sessões' } },
  grid: { borderColor: 'rgba(255,255,255,0.08)' },
  plotOptions: { bar: { borderRadius: 4 } },
  dataLabels: { enabled: false },
  tooltip: { theme: 'dark' },
}))

const frequencySeries = computed(() => ([
  { name: 'Sessões', data: weeklyFrequency.value.map(([, count]) => count) },
]))

// Seção 4: Evolução de carga
const exerciseOptions = computed(() => {
  const map = new Map()
  const prog = programsStore.currentProgram
  if (!prog) return []
  for (const phase of prog.program_phases || []) {
    for (const split of phase.training_splits || []) {
      for (const se of split.split_exercises || []) {
        if (se.exercises && !map.has(se.exercises.id)) {
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
  const { data } = await sessionsStore.fetchExerciseProgress(athleteId, exercise.value)
  progressData.value = data || []
  loadingProgress.value = false
}

// Seção 5: Tabela de medidas
const measurementsReversed = computed(() => measurementsStore.measurements.slice().reverse())

const measurementColumns = [
  { name: 'measured_at', label: 'Data', field: 'measured_at', align: 'left', sortable: true },
  { name: 'weight_kg', label: 'Peso (kg)', field: 'weight_kg', align: 'center' },
  { name: 'body_fat_pct', label: 'Gordura (%)', field: 'body_fat_pct', align: 'center' },
  { name: 'muscle_mass_kg', label: 'Massa (kg)', field: 'muscle_mass_kg', align: 'center' },
  { name: 'notes', label: 'Obs.', field: 'notes', align: 'left' },
  { name: 'delete', label: '', field: 'id', align: 'center' },
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function openAddMeasurement() {
  measurementForm.value = {
    measured_at: new Date().toISOString().split('T')[0],
    weight_kg: null,
    body_fat_pct: null,
    muscle_mass_kg: null,
    notes: '',
  }
  addMeasurementDialog.value = true
}

async function handleAddMeasurement() {
  if (!measurementForm.value.measured_at) return
  savingMeasurement.value = true
  const { error } = await measurementsStore.addMeasurement({
    athlete_id: athleteId,
    trainer_id: authStore.user.id,
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
    $q.notify({ type: 'positive', message: 'Medida adicionada!' })
  }
}

function confirmDeleteMeasurement(row) {
  $q.dialog({
    title: 'Remover medida',
    message: `Remover medida de ${formatDate(row.measured_at)}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const { error } = await measurementsStore.removeMeasurement(row.id)
    if (error) $q.notify({ type: 'negative', message: error.message })
    else $q.notify({ type: 'positive', message: 'Medida removida!' })
  })
}

onMounted(async () => {
  const trainerId = authStore.user.id
  await Promise.all([
    programsStore.fetchAthletes(),
    programsStore.fetchTrainerPrograms(trainerId),
    measurementsStore.fetchMeasurements(athleteId),
    sessionsStore.fetchAthleteSessionsForTrainer(athleteId).then(({ data }) => {
      athleteSessions.value = data || []
    }),
  ])

  const activeProgram = programsStore.programs.find(
    p => p.athlete_id === athleteId && p.active
  )
  if (activeProgram) {
    await programsStore.fetchProgramFull(activeProgram.id)
  }

  loading.value = false
})
</script>
