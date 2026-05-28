<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold">Alunos</div>
    </div>

    <q-input v-model="search" outlined dense placeholder="Buscar aluno..." class="q-mb-md" clearable>
      <template #prepend><q-icon name="fas fa-magnifying-glass" /></template>
    </q-input>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="filtered.length === 0" class="text-center text-grey-5 q-py-xl">
      <q-icon name="fas fa-users-slash" size="48px" />
      <div class="q-mt-sm">Nenhum aluno encontrado</div>
    </div>

    <q-list v-else bordered separator rounded>
      <q-item
        v-for="athlete in filtered"
        :key="athlete.id"
        clickable
        :to="`/trainer/athletes/${athlete.id}`"
      >
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">{{ initials(athlete.full_name) }}</q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ athlete.full_name || 'Sem nome' }}</q-item-label>
          <q-item-label caption>
            {{ [athlete.goal, athlete.phone].filter(Boolean).join(' · ') || 'Sem informações' }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" color="grey-5" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProgramsStore } from 'src/stores/programs'

const programsStore = useProgramsStore()
const search = ref('')
const loading = ref(true)

const filtered = computed(() => {
  const q = search.value?.toLowerCase() || ''
  return programsStore.athletes.filter(a =>
    (a.full_name || '').toLowerCase().includes(q)
  )
})

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

onMounted(async () => {
  await programsStore.fetchAthletes()
  loading.value = false
})
</script>
