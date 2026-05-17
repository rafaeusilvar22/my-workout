<template>
  <q-page class="q-pa-md">
    <div class="text-h6 text-weight-bold q-mb-md">Horário da Academia</div>

    <!-- Dias regulares -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 text-weight-bold q-mb-xs">Dias de funcionamento</div>
        <div class="text-caption text-grey-6 q-mb-md">Toque para ativar ou desativar um dia</div>

        <div class="row justify-between q-gutter-xs">
          <div
            v-for="(label, key) in DAY_CONFIG"
            :key="key"
            class="day-btn cursor-pointer text-center"
            :class="weekDays[key] ? 'day-btn--active' : 'day-btn--inactive'"
            @click="weekDays[key] = !weekDays[key]"
          >
            <div class="text-caption text-weight-bold">{{ label }}</div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          color="primary"
          label="Salvar horário"
          unelevated
          :loading="savingSchedule"
          @click="handleSaveSchedule"
        />
      </q-card-actions>
    </q-card>

    <!-- Exceções -->
    <q-card flat bordered>
      <q-card-section class="row items-center q-pb-sm">
        <div class="col">
          <div class="text-subtitle2 text-weight-bold">Exceções</div>
          <div class="text-caption text-grey-6">Feriados, manutenção, horários especiais</div>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Adicionar"
          unelevated
          size="sm"
          @click="openAddException"
        />
      </q-card-section>

      <div v-if="scheduleStore.exceptions.length === 0" class="text-center text-grey-5 q-py-md">
        <q-icon name="event_available" size="36px" />
        <div class="text-caption q-mt-xs">Nenhuma exceção cadastrada</div>
      </div>

      <q-list v-else separator>
        <q-item v-for="ex in scheduleStore.exceptions" :key="ex.id" class="q-py-sm">
          <q-item-section avatar>
            <q-avatar
              :color="ex.is_open ? 'green-1' : 'red-1'"
              size="36px"
            >
              <q-icon
                :name="ex.is_open ? 'event_available' : 'event_busy'"
                :color="ex.is_open ? 'positive' : 'negative'"
                size="18px"
              />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ formatDate(ex.exception_date) }}</q-item-label>
            <q-item-label caption>
              <span :class="ex.is_open ? 'text-positive' : 'text-negative'" class="text-weight-medium">
                {{ ex.is_open ? 'Aberto' : 'Fechado' }}
              </span>
              <span v-if="ex.reason"> · {{ ex.reason }}</span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat round dense
              icon="delete"
              size="xs"
              color="negative"
              @click="handleRemoveException(ex.id)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Dialog nova exceção -->
    <q-dialog v-model="addExceptionDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Nova Exceção</div>
        </q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <q-input
            v-model="exceptionForm.date"
            label="Data *"
            outlined dense
            type="date"
          />

          <div>
            <div class="text-caption text-grey-7 q-mb-sm">Status neste dia</div>
            <div class="row q-gutter-sm">
              <q-btn
                :unelevated="!exceptionForm.is_open"
                :outline="exceptionForm.is_open"
                color="negative"
                label="Fechado"
                icon="event_busy"
                size="sm"
                @click="exceptionForm.is_open = false"
              />
              <q-btn
                :unelevated="exceptionForm.is_open"
                :outline="!exceptionForm.is_open"
                color="positive"
                label="Aberto"
                icon="event_available"
                size="sm"
                @click="exceptionForm.is_open = true"
              />
            </div>
          </div>

          <q-input
            v-model="exceptionForm.reason"
            label="Motivo (opcional)"
            outlined dense
            placeholder="ex: Feriado nacional, Manutenção..."
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="addExceptionDialog = false" />
          <q-btn
            color="primary"
            label="Adicionar"
            unelevated
            :loading="savingException"
            @click="handleAddException"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useScheduleStore } from 'src/stores/schedule'

const $q = useQuasar()
const authStore = useAuthStore()
const scheduleStore = useScheduleStore()
const { schedule } = storeToRefs(scheduleStore)

const DAY_CONFIG = {
  sun: 'Dom',
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
}

const weekDays = ref({ sun: false, mon: true, tue: true, wed: true, thu: true, fri: true, sat: true })

watch(schedule, (s) => {
  if (s) weekDays.value = { sun: s.sun ?? false, mon: s.mon ?? true, tue: s.tue ?? true, wed: s.wed ?? true, thu: s.thu ?? true, fri: s.fri ?? true, sat: s.sat ?? false }
}, { immediate: true })
const savingSchedule = ref(false)
const addExceptionDialog = ref(false)
const savingException = ref(false)
const exceptionForm = ref({ date: '', is_open: false, reason: '' })

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function openAddException() {
  exceptionForm.value = { date: '', is_open: false, reason: '' }
  addExceptionDialog.value = true
}

async function handleSaveSchedule() {
  savingSchedule.value = true
  const { error } = await scheduleStore.upsertSchedule(authStore.user.id, { ...weekDays.value })
  savingSchedule.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    $q.notify({ type: 'positive', message: 'Horário salvo!' })
  }
}

async function handleAddException() {
  if (!exceptionForm.value.date) return
  savingException.value = true
  const { error } = await scheduleStore.addException({
    trainer_id: authStore.user.id,
    exception_date: exceptionForm.value.date,
    is_open: exceptionForm.value.is_open,
    reason: exceptionForm.value.reason || null,
  })
  savingException.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    addExceptionDialog.value = false
    $q.notify({ type: 'positive', message: 'Exceção adicionada!' })
  }
}

async function handleRemoveException(id) {
  $q.dialog({ title: 'Remover', message: 'Remover esta exceção?', cancel: true }).onOk(async () => {
    const { error } = await scheduleStore.removeException(id)
    if (error) $q.notify({ type: 'negative', message: error.message })
  })
}

onMounted(async () => {
  await Promise.all([
    scheduleStore.fetchSchedule(authStore.user.id),
    scheduleStore.fetchExceptions(authStore.user.id),
  ])
})
</script>

<style scoped>
.day-btn {
  flex: 1;
  min-width: 36px;
  max-width: 48px;
  padding: 10px 4px;
  border-radius: 10px;
  font-size: 12px;
  transition: all 0.2s;
  user-select: none;
}
.day-btn--active {
  background: var(--q-primary);
  color: #0C0C14;
}
.day-btn--inactive {
  background: #1A1A2C;
  color: rgba(255, 255, 255, 0.3);
}
</style>
