<template>
  <q-page class="q-pa-md">
    <!-- Input de arquivo oculto -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onFileSelected"
    />

    <!-- Card de perfil -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-center no-wrap q-mb-md">
          <q-avatar size="64px" class="q-mr-md cursor-pointer avatar-wrapper" @click="fileInput.click()">
            <img v-if="profile?.avatar_url" :src="profile.avatar_url" style="object-fit: cover; width: 100%; height: 100%;" />
            <template v-else>
              <q-avatar color="primary" text-color="white" size="64px">
                {{ initials(profile?.full_name) }}
              </q-avatar>
            </template>
            <div class="avatar-overlay">
              <q-icon v-if="!uploadingAvatar" name="photo_camera" color="white" size="20px" />
              <q-spinner v-else color="white" size="20px" />
            </div>
          </q-avatar>
          <div class="col">
            <div class="text-h6 text-weight-bold">{{ profile?.full_name || 'Sem nome' }}</div>
            <div v-if="profile?.phone" class="text-caption text-grey-6">
              <q-icon name="phone" size="12px" class="q-mr-xs" />{{ profile.phone }}
            </div>
          </div>
        </div>

        <!-- Métricas -->
        <div v-if="hasMetrics" class="row q-gutter-xs flex-wrap q-mb-xs">
          <q-chip v-if="age !== null" dense size="sm" icon="cake" color="blue-1" text-color="blue-9">
            {{ age }} anos
          </q-chip>
          <q-chip v-if="profile?.height_cm" dense size="sm" icon="straighten" color="green-1" text-color="green-9">
            {{ profile.height_cm }} cm
          </q-chip>
          <q-chip v-if="profile?.weight_kg" dense size="sm" icon="monitor_weight" color="orange-1" text-color="orange-9">
            {{ profile.weight_kg }} kg
          </q-chip>
          <q-chip v-if="profile?.body_fat_pct" dense size="sm" icon="water_drop" color="purple-1" text-color="purple-9">
            {{ profile.body_fat_pct }}% gordura
          </q-chip>
        </div>

        <div v-if="bmi" class="text-caption text-grey-5">
          IMC {{ bmi }} · {{ bmiLabel }}
        </div>
      </q-card-section>

      <template v-if="profile?.goal || profile?.restrictions">
        <q-separator />
        <q-card-section class="q-pt-sm q-pb-sm q-gutter-sm">
          <div v-if="profile?.goal" class="row items-start no-wrap">
            <q-icon name="flag" color="primary" size="16px" class="q-mr-sm" style="margin-top:2px" />
            <div>
              <div class="text-caption text-grey-6">Meta</div>
              <div class="text-body2">{{ profile.goal }}</div>
            </div>
          </div>
          <div v-if="profile?.restrictions" class="row items-start no-wrap">
            <q-icon name="warning" color="orange-8" size="16px" class="q-mr-sm" style="margin-top:2px" />
            <div>
              <div class="text-caption text-grey-6">Restrições / Cirurgias</div>
              <div class="text-body2" style="white-space: pre-wrap;">{{ profile.restrictions }}</div>
            </div>
          </div>
        </q-card-section>
      </template>

      <template v-if="!hasProfileData">
        <q-separator />
        <q-card-section class="text-center text-caption text-grey-5 q-py-sm">
          Seu treinador ainda não preencheu seu perfil completo.
        </q-card-section>
      </template>
    </q-card>

    <!-- Estatísticas -->
    <q-card flat bordered>
      <q-card-section>
        <div class="text-caption text-grey-6 text-weight-bold q-mb-md">ESTATÍSTICAS</div>
        <div class="row items-center justify-around text-center">
          <div>
            <div class="text-h5 text-weight-bold text-primary">{{ totalSessions }}</div>
            <div class="text-caption text-grey-6">treinos</div>
          </div>
          <q-separator vertical style="height: 40px;" />
          <div>
            <div class="text-h5 text-weight-bold text-orange">{{ streak }}</div>
            <div class="row items-center justify-center q-gutter-xs">
              <q-icon name="local_fire_department" color="orange" size="14px" />
              <span class="text-caption text-grey-6">sequência</span>
            </div>
          </div>
          <q-separator vertical style="height: 40px;" />
          <div>
            <div class="text-h5 text-weight-bold text-positive">{{ achievementsCount }}</div>
            <div class="text-caption text-grey-6">conquistas</div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'
import { useSessionsStore } from 'src/stores/sessions'

const $q = useQuasar()
const authStore = useAuthStore()
const sessionsStore = useSessionsStore()

const profile = computed(() => authStore.profile)
const fileInput = ref(null)
const uploadingAvatar = ref(false)

async function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  uploadingAvatar.value = true
  const result = await authStore.uploadAvatar(file)
  uploadingAvatar.value = false

  if (result.success) {
    $q.notify({ type: 'positive', message: 'Foto atualizada!' })
  } else {
    $q.notify({ type: 'negative', message: result.error || 'Erro ao enviar foto.' })
  }
}

const hasMetrics = computed(() => {
  const p = profile.value
  return p?.birth_date || p?.height_cm || p?.weight_kg || p?.body_fat_pct
})

const hasProfileData = computed(() => {
  const p = profile.value
  return p?.birth_date || p?.height_cm || p?.weight_kg || p?.body_fat_pct || p?.goal || p?.restrictions || p?.phone
})

const age = computed(() => {
  if (!profile.value?.birth_date) return null
  const today = new Date()
  const birth = new Date(profile.value.birth_date + 'T00:00:00')
  let a = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--
  return a
})

const bmi = computed(() => {
  const p = profile.value
  if (!p?.height_cm || !p?.weight_kg) return null
  const h = p.height_cm / 100
  return (p.weight_kg / (h * h)).toFixed(1)
})

const bmiLabel = computed(() => {
  const b = parseFloat(bmi.value)
  if (!b) return ''
  if (b < 18.5) return 'Abaixo do peso'
  if (b < 25) return 'Peso normal'
  if (b < 30) return 'Sobrepeso'
  return 'Obesidade'
})

const totalSessions = computed(() => sessionsStore.sessions.filter(s => s.completed).length)
const streak = computed(() => sessionsStore.getStreak())
const achievementsCount = computed(() => sessionsStore.achievements.length)

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

onMounted(async () => {
  await authStore.fetchProfile()
})
</script>

<style scoped>
.avatar-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 50%;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 50%;
}

.avatar-wrapper:hover .avatar-overlay,
.avatar-wrapper:active .avatar-overlay {
  opacity: 1;
}
</style>
