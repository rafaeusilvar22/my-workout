<template>
  <q-card flat bordered class="q-pa-md">
    <!-- Navegação de mês -->
    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="chevron_left" @click="prevMonth" />
      <div class="col text-center text-weight-bold text-body1">{{ monthLabel }}</div>
      <q-btn flat round dense icon="chevron_right" @click="nextMonth" :disable="isCurrentMonth" />
    </div>

    <!-- Legenda de fases -->
    <div v-if="activePhase" class="row items-center q-mb-sm q-gutter-xs">
      <q-icon name="schedule" size="14px" color="grey-5" />
      <span class="text-caption text-grey-5">{{ activePhase.name }} · semanas {{ activePhase.week_start }}–{{ activePhase.week_end }}</span>
    </div>

    <!-- Cabeçalho dias da semana -->
    <div class="cal-grid q-mb-xs">
      <div v-for="d in weekDays" :key="d" class="cal-header text-caption text-grey-5 text-center">
        {{ d }}
      </div>
    </div>

    <!-- Grid de dias -->
    <div class="cal-grid">
      <div
        v-for="day in calendarDays"
        :key="day.key"
        class="cal-day"
        :class="{
          'cal-day--empty': !day.date,
          'cal-day--today': day.isToday,
          'cal-day--future': day.isFuture,
          'cal-day--done': !!day.session,
          'cal-day--closed': day.isClosed && !day.session,
          'cursor-pointer': !!day.session,
        }"
        :style="day.session ? { background: day.session.training_splits?.color || '#43a047' } : {}"
        @click="day.session ? $emit('day-click', day) : null"
      >
        <span v-if="day.date" :style="day.session ? { color: '#fff' } : {}">
          {{ day.date.getDate() }}
        </span>
      </div>
    </div>

    <!-- Legenda cores -->
    <div v-if="legendSplits.length" class="row q-mt-md q-gutter-sm">
      <div
        v-for="s in legendSplits"
        :key="s.id"
        class="row items-center q-gutter-xs"
      >
        <div class="legend-dot" :style="{ background: s.color || '#43a047' }" />
        <span class="text-caption text-grey-6">{{ s.name }}</span>
      </div>
    </div>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  sessions: { type: Array, default: () => [] },
  program: { type: Object, default: null },
  gymSchedule: { type: Object, default: null },
  gymExceptions: { type: Array, default: () => [] },
})

defineEmits(['day-click'])

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const now = new Date()
const currentDate = ref(new Date(now.getFullYear(), now.getMonth(), 1))

const isCurrentMonth = computed(() => {
  return currentDate.value.getFullYear() === now.getFullYear() &&
    currentDate.value.getMonth() === now.getMonth()
})

const monthLabel = computed(() =>
  currentDate.value.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase())
)

function prevMonth() {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
}

function nextMonth() {
  if (isCurrentMonth.value) return
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function isDateClosed(dateStr, date) {
  const exception = props.gymExceptions.find(e => e.exception_date === dateStr)
  if (exception !== undefined) return !exception.is_open
  if (!props.gymSchedule) return false
  return props.gymSchedule[DAY_KEYS[date.getDay()]] === false
}

// Mapeia data -> sessão concluída
const sessionByDate = computed(() => {
  const map = {}
  props.sessions
    .filter(s => s.completed)
    .forEach(s => { map[s.session_date] = s })
  return map
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDow = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days = []

  for (let i = 0; i < firstDow; i++) {
    days.push({ key: `pad-${i}`, date: null })
  }

  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(year, month, d)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    days.push({
      key: dateStr,
      date,
      dateStr,
      session: sessionByDate.value[dateStr] || null,
      isToday: date.getTime() === today.getTime(),
      isFuture: date > today,
      isClosed: isDateClosed(dateStr, date),
    })
  }

  return days
})

// Fase ativa no mês atual exibido
const activePhase = computed(() => {
  if (!props.program?.start_date || !props.program?.program_phases) return null
  const programStart = new Date(props.program.start_date + 'T00:00:00')
  const monthStart = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  const diffDays = Math.floor((monthStart - programStart) / 86400000)
  const weekOfProgram = Math.floor(diffDays / 7) + 1

  return props.program.program_phases.find(ph =>
    ph.week_start && ph.week_end &&
    weekOfProgram >= ph.week_start && weekOfProgram <= ph.week_end
  ) || null
})

// Splits únicos com sessão no mês exibido para a legenda
const legendSplits = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const seen = new Map()
  props.sessions
    .filter(s => {
      const d = new Date(s.session_date + 'T00:00:00')
      return s.completed && d.getFullYear() === year && d.getMonth() === month
    })
    .forEach(s => {
      const id = s.split_id
      if (!seen.has(id)) {
        seen.set(id, {
          id,
          name: s.training_splits?.name || '',
          color: s.training_splits?.color || '#43a047',
        })
      }
    })
  return [...seen.values()]
})
</script>

<style scoped>
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.cal-header {
  padding: 2px 0;
  font-weight: 600;
}
.cal-day {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  background: #f0f0f0;
  transition: opacity 0.15s;
  user-select: none;
}
.cal-day--empty {
  background: transparent;
}
.cal-day--future {
  opacity: 0.35;
}
.cal-day--today {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
  color: var(--q-primary);
  font-weight: 700;
}
.cal-day--done:hover {
  opacity: 0.85;
}
.cal-day--closed {
  background: #fce8e8;
  color: #e57373;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
</style>
