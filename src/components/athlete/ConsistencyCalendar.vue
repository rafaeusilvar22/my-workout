<template>
  <div class="glass-card q-pa-lg">
    <!-- Navegação de semana -->
    <div class="row items-center q-mb-lg">
      <q-btn flat round dense icon="fas fa-chevron-left" color="grey-5" @click="prevWeek" />
      <div class="col text-center">
        <div class="text-weight-bold" style="font-size: 17px; letter-spacing: -0.3px;">{{ weekLabel }}</div>
        <div v-if="activePhase" class="text-caption text-grey-5 q-mt-xs">
          {{ activePhase.name }} · sem. {{ activePhase.week_start }}–{{ activePhase.week_end }}
        </div>
      </div>
      <q-btn flat round dense icon="fas fa-chevron-right" color="grey-5" :disable="isCurrentWeek" @click="nextWeek" />
    </div>

    <!-- Dias da semana -->
    <div class="week-row">
      <div v-for="day in weekDays" :key="day.key" class="week-col">
        <div class="day-label text-grey-5 text-center q-mb-xs">{{ day.abbr }}</div>
        <div
          class="cal-day"
          :class="{
            'cal-day--today': day.isToday && !day.session,
            'cal-day--future': day.isFuture,
            'cal-day--closed': day.isClosed && !day.session,
            'cursor-pointer': !!day.session,
          }"
          :style="dayStyle(day)"
          @click="day.session ? $emit('day-click', day) : null"
        >
          <span>{{ day.date ? day.date.getDate() : '' }}</span>
        </div>
      </div>
    </div>

    <!-- Legenda -->
    <div v-if="legendSplits.length" class="row q-mt-lg q-gutter-xs">
      <div
        v-for="s in legendSplits"
        :key="s.id"
        class="legend-chip"
        :style="{ background: hexToFaded(s.color), color: s.color, borderColor: s.color + '40' }"
      >
        {{ s.name }}
      </div>
    </div>
  </div>
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

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

const currentWeekStart = ref(getWeekStart(new Date()))

const isCurrentWeek = computed(() =>
  currentWeekStart.value.getTime() === getWeekStart(new Date()).getTime()
)

const weekLabel = computed(() => {
  const start = currentWeekStart.value
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
  return `${fmt(start)} – ${fmt(end)}`
})

function prevWeek() {
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() - 7)
  currentWeekStart.value = d
}

function nextWeek() {
  if (isCurrentWeek.value) return
  const d = new Date(currentWeekStart.value)
  d.setDate(d.getDate() + 7)
  currentWeekStart.value = d
}

function toDateStr(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function isDateClosed(dateStr, date) {
  const ex = props.gymExceptions.find(e => e.exception_date === dateStr)
  if (ex !== undefined) return !ex.is_open
  if (!props.gymSchedule) return false
  return props.gymSchedule[DAY_KEYS[date.getDay()]] === false
}

const sessionByDate = computed(() => {
  const map = {}
  props.sessions.filter(s => s.completed).forEach(s => { map[s.session_date] = s })
  return map
})

function hexToFaded(hex) {
  if (!hex || hex.length < 7) return 'rgba(0,0,0,0.08)'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},0.12)`
}

function dayStyle(day) {
  if (day.session) {
    const color = day.session.training_splits?.color || '#43a047'
    return { background: color, color: '#fff', boxShadow: `0 0 10px ${color}55` }
  }
  if (day.isToday) {
    return {
      background: 'rgba(0,230,118,0.15)',
      outline: '2px solid var(--q-primary)',
      outlineOffset: '-2px',
      color: 'var(--q-primary)',
      fontWeight: '700',
    }
  }
  return {}
}

const weekDays = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    const dateStr = toDateStr(date)
    return {
      key: dateStr, date, dateStr,
      abbr: DAY_ABBR[i],
      session: sessionByDate.value[dateStr] || null,
      isToday: date.getTime() === today.getTime(),
      isFuture: date > today,
      isClosed: isDateClosed(dateStr, date),
    }
  })
})

const activePhase = computed(() => {
  if (!props.program?.start_date || !props.program?.program_phases) return null
  const programStart = new Date(props.program.start_date + 'T00:00:00')
  const mid = new Date(currentWeekStart.value)
  mid.setDate(mid.getDate() + 3)
  const week = Math.floor((mid - programStart) / (86400000 * 7)) + 1
  return props.program.program_phases.find(ph =>
    ph.week_start && ph.week_end && week >= ph.week_start && week <= ph.week_end
  ) || null
})

const legendSplits = computed(() => {
  const seen = new Map()
  weekDays.value.filter(d => d.session).forEach(d => {
    if (!seen.has(d.session.split_id)) {
      seen.set(d.session.split_id, {
        id: d.session.split_id,
        name: d.session.training_splits?.name || '',
        color: d.session.training_splits?.color || '#43a047',
      })
    }
  })
  return [...seen.values()]
})
</script>

<style scoped>
.week-row {
  display: flex;
  justify-content: space-between;
  gap: 4px;
}
.week-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.day-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.cal-day {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
  user-select: none;
}
.cal-day--today  { outline: 2px solid var(--q-primary); outline-offset: -2px; color: var(--q-primary); font-weight: 700; }
.cal-day--future { opacity: 0.25; }
.cal-day--closed { background: rgba(255,71,87,0.12); color: rgba(255,71,87,0.7); }
.legend-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  border: 1px solid;
  letter-spacing: 0.2px;
}
</style>
