<template>
  <q-page class="q-pa-md">
    <div class="text-h6 text-weight-bold q-mb-md">Histórico</div>

    <div v-if="sessionsStore.loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="sessionsStore.sessions.length === 0" class="text-center text-grey-5 q-py-xl">
      <q-icon name="history" size="48px" />
      <div class="q-mt-sm">Nenhuma sessão registrada ainda</div>
    </div>

    <q-list v-else bordered separator rounded>
      <q-item v-for="session in sessionsStore.sessions" :key="session.id">
        <q-item-section avatar>
          <q-avatar
            :color="session.completed ? 'positive' : 'grey-4'"
            :text-color="session.completed ? 'white' : 'grey-7'"
          >
            <q-icon :name="session.completed ? 'check' : 'close'" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">
            {{ session.training_splits?.name || 'Treino livre' }}
          </q-item-label>
          <q-item-label caption>
            {{ formatDate(session.session_date) }}
            <span v-if="session.duration_minutes"> · {{ session.duration_minutes }} min</span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-badge :color="session.completed ? 'positive' : 'grey'">
            {{ session.completed ? 'Concluído' : 'Incompleto' }}
          </q-badge>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'

const authStore = useAuthStore()
const sessionsStore = useSessionsStore()

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

onMounted(() => sessionsStore.fetchSessions(authStore.user.id))
</script>
