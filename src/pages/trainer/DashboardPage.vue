<template>
  <q-page class="q-pa-md">
    <div class="text-h6 text-weight-bold q-mb-md">Visão Geral</div>

    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <q-icon name="group" size="32px" color="primary" />
          <div class="text-h5 text-weight-bold q-mt-xs">{{ stats.athletes }}</div>
          <div class="text-caption text-grey-6">Alunos</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <q-icon name="assignment" size="32px" color="orange" />
          <div class="text-h5 text-weight-bold q-mt-xs">{{ stats.programs }}</div>
          <div class="text-caption text-grey-6">Programas</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <q-icon name="fitness_center" size="32px" color="green" />
          <div class="text-h5 text-weight-bold q-mt-xs">{{ stats.exercises }}</div>
          <div class="text-caption text-grey-6">Exercícios</div>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card flat bordered class="text-center q-pa-md">
          <q-icon name="check_circle" size="32px" color="teal" />
          <div class="text-h5 text-weight-bold q-mt-xs">{{ stats.sessionsToday }}</div>
          <div class="text-caption text-grey-6">Check-ins Hoje</div>
        </q-card>
      </div>
    </div>

    <div class="row items-center justify-between q-mb-sm">
      <div class="text-subtitle1 text-weight-medium">Alunos recentes</div>
      <q-btn flat dense label="Ver todos" to="/trainer/athletes" color="primary" />
    </div>

    <div v-if="loadingData" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <q-list v-else bordered separator rounded>
      <q-item
        v-for="athlete in recentAthletes"
        :key="athlete.id"
        clickable
        :to="`/trainer/athletes/${athlete.id}`"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">{{ initials(athlete.full_name) }}</q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ athlete.full_name || 'Sem nome' }}</q-item-label>
          <q-item-label caption>{{ athlete.email }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-5" />
        </q-item-section>
      </q-item>
      <q-item v-if="recentAthletes.length === 0">
        <q-item-section class="text-grey-5 text-center">Nenhum aluno cadastrado ainda</q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProgramsStore } from 'src/stores/programs'
import { useExercisesStore } from 'src/stores/exercises'
import { useAuthStore } from 'src/stores/auth'
import { supabase } from 'src/boot/supabase'

const programsStore = useProgramsStore()
const exercisesStore = useExercisesStore()
const authStore = useAuthStore()

const loadingData = ref(true)
const sessionsToday = ref(0)

const stats = computed(() => ({
  athletes: programsStore.athletes.length,
  programs: programsStore.programs.length,
  exercises: exercisesStore.exercises.length,
  sessionsToday: sessionsToday.value,
}))

const recentAthletes = computed(() => programsStore.athletes.slice(0, 5))

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

async function fetchSessionsToday() {
  const _d = new Date()
  const today = [_d.getFullYear(), String(_d.getMonth() + 1).padStart(2, '0'), String(_d.getDate()).padStart(2, '0')].join('-')
  const { count } = await supabase
    .from('workout_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('session_date', today)
    .eq('completed', true)
  sessionsToday.value = count || 0
}

onMounted(async () => {
  await Promise.all([
    programsStore.fetchAthletes(),
    programsStore.fetchTrainerPrograms(authStore.user.id),
    exercisesStore.fetchAll(),
    fetchSessionsToday(),
  ])
  loadingData.value = false
})
</script>
