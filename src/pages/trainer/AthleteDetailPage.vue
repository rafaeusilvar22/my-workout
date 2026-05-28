<template>
  <q-page class="q-pa-md">
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="onFileSelected"
    />

    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="fas fa-arrow-left" @click="$router.back()" class="q-mr-sm" />
      <div class="text-h6 text-weight-bold">{{ athlete?.full_name || 'Aluno' }}</div>
    </div>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- Card de perfil -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center no-wrap q-mb-sm">
            <q-avatar size="56px" class="q-mr-md cursor-pointer avatar-wrapper" @click="fileInput.click()">
              <img v-if="athlete?.avatar_url" :src="athlete.avatar_url" style="object-fit: cover; width: 100%; height: 100%;" />
              <template v-else>
                <q-avatar color="primary" text-color="white" size="56px">
                  {{ initials(athlete?.full_name) }}
                </q-avatar>
              </template>
              <div class="avatar-overlay">
                <q-icon v-if="!uploadingAvatar" name="fas fa-camera" color="white" size="18px" />
                <q-spinner v-else color="white" size="18px" />
              </div>
            </q-avatar>
            <div class="col">
              <div class="text-weight-bold text-body1">{{ athlete?.full_name || 'Sem nome' }}</div>
              <div v-if="athlete?.phone" class="text-caption text-grey-6">
                <q-icon name="fas fa-phone" size="12px" class="q-mr-xs" />{{ athlete.phone }}
              </div>
            </div>
            <q-btn flat round dense icon="fas fa-pen" color="grey-6" @click="openEditProfile" />
          </div>

          <!-- Chips de métricas -->
          <div class="row q-gutter-xs flex-wrap">
            <q-chip v-if="athleteAge !== null" dense size="sm" icon="fas fa-cake-candles" color="blue-1" text-color="blue-9">
              {{ athleteAge }} anos
            </q-chip>
            <q-chip v-if="athlete?.height_cm" dense size="sm" icon="fas fa-ruler" color="green-1" text-color="green-9">
              {{ athlete.height_cm }} cm
            </q-chip>
            <q-chip v-if="athlete?.weight_kg" dense size="sm" icon="fas fa-weight-scale" color="orange-1" text-color="orange-9">
              {{ athlete.weight_kg }} kg
            </q-chip>
            <q-chip v-if="athlete?.body_fat_pct" dense size="sm" icon="fas fa-droplet" color="purple-1" text-color="purple-9">
              {{ athlete.body_fat_pct }}% gordura
            </q-chip>
          </div>

          <div v-if="bmi" class="text-caption text-grey-5 q-mt-xs">
            IMC {{ bmi }} · {{ bmiLabel }}
          </div>
        </q-card-section>

        <template v-if="athlete?.goal || athlete?.restrictions">
          <q-separator />
          <q-card-section class="q-pt-sm q-pb-sm q-gutter-sm">
            <div v-if="athlete?.goal" class="row items-start no-wrap">
              <q-icon name="fas fa-flag" color="primary" size="16px" class="q-mr-sm" style="margin-top:2px" />
              <div>
                <div class="text-caption text-grey-6">Meta</div>
                <div class="text-body2">{{ athlete.goal }}</div>
              </div>
            </div>
            <div v-if="athlete?.restrictions" class="row items-start no-wrap">
              <q-icon name="fas fa-triangle-exclamation" color="orange-8" size="16px" class="q-mr-sm" style="margin-top:2px" />
              <div>
                <div class="text-caption text-grey-6">Restrições / Cirurgias</div>
                <div class="text-body2" style="white-space: pre-wrap;">{{ athlete.restrictions }}</div>
              </div>
            </div>
          </q-card-section>
        </template>
      </q-card>

      <!-- Programas do aluno -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">Programas</div>
        <div class="row q-gutter-xs">
          <q-btn outline color="primary" icon="fas fa-chart-bar" label="Relatório" size="sm"
            :to="`/trainer/athletes/${route.params.id}/report`" />
          <q-btn color="primary" icon="fas fa-plus" label="Novo Programa" unelevated size="sm" @click="openNewProgram" />
        </div>
      </div>

      <div v-if="athletePrograms.length === 0" class="text-center text-grey-5 q-py-md">
        <q-icon name="fas fa-clipboard-question" size="40px" />
        <div class="q-mt-sm text-caption">Nenhum programa criado</div>
      </div>

      <q-list v-else bordered separator rounded class="q-mb-md">
        <q-item
          v-for="prog in athletePrograms"
          :key="prog.id"
          clickable
          :to="`/trainer/programs/${prog.id}`"
        >
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ prog.name }}</q-item-label>
            <q-item-label caption>
              {{ prog.start_date || 'Sem data de início' }}
              <q-badge :color="prog.active ? 'positive' : 'grey'" class="q-ml-sm">
                {{ prog.active ? 'Ativo' : 'Inativo' }}
              </q-badge>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="grey-5" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Dialog editar perfil -->
    <q-dialog v-model="editProfileDialog" persistent>
      <q-card style="min-width: 340px; width: 90vw; max-width: 500px;">
        <q-card-section>
          <div class="text-h6">Perfil do Aluno</div>
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-none" style="max-height: 65vh; overflow-y: auto;">
          <q-input
            v-model="profileForm.full_name"
            label="Nome completo *"
            outlined dense
          />
          <div class="row q-gutter-sm">
            <q-input
              v-model="profileForm.birth_date"
              label="Data de nascimento"
              outlined dense
              type="date"
              class="col"
            />
            <q-input
              v-model="profileForm.phone"
              label="Telefone"
              outlined dense
              class="col"
              placeholder="(11) 99999-9999"
            />
          </div>
          <div class="row q-gutter-sm">
            <q-input
              v-model.number="profileForm.height_cm"
              label="Altura (cm)"
              outlined dense
              type="number"
              class="col"
              placeholder="175"
            />
            <q-input
              v-model.number="profileForm.weight_kg"
              label="Peso (kg)"
              outlined dense
              type="number"
              step="0.1"
              class="col"
              placeholder="80"
            />
          </div>
          <q-input
            v-model.number="profileForm.body_fat_pct"
            label="% Gordura corporal"
            outlined dense
            type="number"
            step="0.1"
            placeholder="18"
          />
          <q-select
            v-model="profileForm.goal"
            :options="goalOptions"
            label="Meta principal"
            outlined dense
            clearable
          />
          <q-input
            v-model="profileForm.restrictions"
            label="Restrições / Cirurgias"
            outlined dense
            type="textarea"
            rows="3"
            placeholder="Ex: Hérnia lombar, cirurgia no joelho em 2022..."
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="editProfileDialog = false" />
          <q-btn
            color="primary"
            label="Salvar"
            unelevated
            :loading="savingProfile"
            @click="handleSaveProfile"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog novo programa -->
    <q-dialog v-model="newProgramDialog" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Novo Programa</div>
        </q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <q-input v-model="programForm.name" label="Nome do programa *" outlined dense />
          <q-input v-model="programForm.start_date" label="Data de início" outlined dense type="date" />
          <q-input v-model="programForm.end_date" label="Data de término" outlined dense type="date" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="newProgramDialog = false" />
          <q-btn color="primary" label="Criar" unelevated :loading="saving" @click="handleCreateProgram" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useProgramsStore } from 'src/stores/programs'
import { useAuthStore } from 'src/stores/auth'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const programsStore = useProgramsStore()
const authStore = useAuthStore()

const loading = ref(true)
const fileInput = ref(null)
const uploadingAvatar = ref(false)
const newProgramDialog = ref(false)
const saving = ref(false)
const programForm = ref({ name: '', start_date: '', end_date: '' })

const editProfileDialog = ref(false)
const savingProfile = ref(false)
const profileForm = ref({
  full_name: '',
  birth_date: '',
  phone: '',
  height_cm: null,
  weight_kg: null,
  body_fat_pct: null,
  goal: '',
  restrictions: '',
})

const goalOptions = [
  'Hipertrofia',
  'Emagrecimento',
  'Resistência',
  'Força',
  'Condicionamento',
  'Reabilitação',
  'Saúde geral',
]

const athlete = computed(() => programsStore.athletes.find(a => a.id === route.params.id))
const athletePrograms = computed(() =>
  programsStore.programs.filter(p => p.athlete_id === route.params.id)
)

const athleteAge = computed(() => {
  if (!athlete.value?.birth_date) return null
  const today = new Date()
  const birth = new Date(athlete.value.birth_date + 'T00:00:00')
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
})

const bmi = computed(() => {
  const a = athlete.value
  if (!a?.height_cm || !a?.weight_kg) return null
  const h = a.height_cm / 100
  return (a.weight_kg / (h * h)).toFixed(1)
})

const bmiLabel = computed(() => {
  const b = parseFloat(bmi.value)
  if (!b) return ''
  if (b < 18.5) return 'Abaixo do peso'
  if (b < 25) return 'Peso normal'
  if (b < 30) return 'Sobrepeso'
  return 'Obesidade'
})

function initials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

async function onFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  uploadingAvatar.value = true
  const result = await programsStore.uploadAthleteAvatar(route.params.id, file)
  uploadingAvatar.value = false

  if (result.success) {
    $q.notify({ type: 'positive', message: 'Foto atualizada!' })
  } else {
    $q.notify({ type: 'negative', message: result.error || 'Erro ao enviar foto.' })
  }
}

function openEditProfile() {
  const a = athlete.value || {}
  profileForm.value = {
    full_name: a.full_name || '',
    birth_date: a.birth_date || '',
    phone: a.phone || '',
    height_cm: a.height_cm ?? null,
    weight_kg: a.weight_kg ?? null,
    body_fat_pct: a.body_fat_pct ?? null,
    goal: a.goal || '',
    restrictions: a.restrictions || '',
  }
  editProfileDialog.value = true
}

async function handleSaveProfile() {
  if (!profileForm.value.full_name) return
  savingProfile.value = true
  const { error } = await programsStore.updateAthleteProfile(route.params.id, {
    full_name: profileForm.value.full_name,
    birth_date: profileForm.value.birth_date || null,
    phone: profileForm.value.phone || null,
    height_cm: profileForm.value.height_cm || null,
    weight_kg: profileForm.value.weight_kg || null,
    body_fat_pct: profileForm.value.body_fat_pct || null,
    goal: profileForm.value.goal || null,
    restrictions: profileForm.value.restrictions || null,
  })
  savingProfile.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    editProfileDialog.value = false
    $q.notify({ type: 'positive', message: 'Perfil atualizado!' })
  }
}

function openNewProgram() {
  programForm.value = { name: '', start_date: '', end_date: '' }
  newProgramDialog.value = true
}

async function handleCreateProgram() {
  if (!programForm.value.name) return
  saving.value = true
  const { data, error } = await programsStore.createProgram({
    trainer_id: authStore.user.id,
    athlete_id: route.params.id,
    name: programForm.value.name,
    start_date: programForm.value.start_date || null,
    end_date: programForm.value.end_date || null,
    active: true,
  })
  saving.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    newProgramDialog.value = false
    $q.notify({ type: 'positive', message: 'Programa criado!' })
    router.push(`/trainer/programs/${data.id}`)
  }
}

onMounted(async () => {
  await Promise.all([
    programsStore.fetchAthletes(),
    programsStore.fetchTrainerPrograms(authStore.user.id),
  ])
  loading.value = false
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
