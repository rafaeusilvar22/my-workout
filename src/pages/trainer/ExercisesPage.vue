<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6 text-weight-bold">Catálogo de Exercícios</div>
      <q-btn color="primary" icon="add" label="Novo" unelevated @click="openDialog()" />
    </div>

    <q-input
      v-model="search"
      outlined dense
      placeholder="Buscar exercício..."
      class="q-mb-md"
      clearable
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>

    <div v-if="exercisesStore.loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="filtered.length === 0" class="text-center text-grey-5 q-py-xl">
      <q-icon name="fitness_center" size="48px" />
      <div class="q-mt-sm">Nenhum exercício encontrado</div>
    </div>

    <q-list v-else bordered separator rounded>
      <q-item v-for="ex in filtered" :key="ex.id" clickable @click="openDialog(ex)">
        <q-item-section avatar>
          <q-avatar size="40px" v-if="ex.image_url">
            <img :src="ex.image_url" style="object-fit: cover;" />
          </q-avatar>
          <q-avatar v-else color="primary" text-color="white" size="40px">
            <q-icon name="fitness_center" size="20px" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ ex.name }}</q-item-label>
          <q-item-label caption>
            {{ (ex.muscle_groups || []).join(', ') || 'Sem grupo muscular' }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn flat round dense icon="delete" color="negative" @click.stop="confirmDelete(ex)" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Dialog criar/editar -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 340px; width: 92vw; max-width: 500px;">
        <q-card-section>
          <div class="text-h6">{{ editing ? 'Editar' : 'Novo' }} Exercício</div>
        </q-card-section>

        <q-card-section class="q-gutter-md q-pt-none" style="max-height: 70vh; overflow-y: auto;">
          <q-input v-model="form.name" label="Nome *" outlined dense />
          <q-input v-model="form.description" label="Descrição" outlined dense type="textarea" rows="2" />
          <q-select
            v-model="form.muscle_groups"
            :options="muscleOptions"
            label="Grupos musculares"
            outlined dense multiple use-chips
          />
          <q-input v-model="form.equipment" label="Equipamento" outlined dense />
          <q-input v-model="form.video_url" label="URL do vídeo" outlined dense />

          <!-- Imagem / GIF -->
          <div>
            <div class="text-caption text-grey-6 q-mb-sm">Imagem / GIF demonstrativo</div>
            <div class="row items-center q-gutter-sm">
              <div
                v-if="previewUrl || editing?.image_url"
                class="image-preview"
                @click="$refs.fileInput.click()"
              >
                <img :src="previewUrl || editing?.image_url" />
                <div class="image-preview__overlay">
                  <q-icon name="edit" color="white" size="20px" />
                </div>
              </div>

              <div class="col">
                <q-btn
                  v-if="!previewUrl && !editing?.image_url"
                  outline color="primary" icon="upload" label="Enviar imagem"
                  size="sm" :loading="uploadingImage"
                  @click="$refs.fileInput.click()"
                />
                <template v-else>
                  <q-btn
                    outline color="primary" icon="upload" label="Trocar"
                    size="sm" :loading="uploadingImage"
                    @click="$refs.fileInput.click()"
                  />
                  <q-btn
                    flat color="negative" icon="delete" label="Remover"
                    size="sm" class="q-ml-xs"
                    @click="handleRemoveImage"
                  />
                </template>
                <div class="text-caption text-grey-5 q-mt-xs">JPG, PNG ou GIF (max 5 MB)</div>
              </div>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileSelected"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="closeDialog" />
          <q-btn
            color="primary"
            :label="editing ? 'Salvar' : 'Criar'"
            unelevated
            :loading="saving"
            @click="handleSave"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useExercisesStore } from 'src/stores/exercises'
import { useAuthStore } from 'src/stores/auth'

const $q = useQuasar()
const exercisesStore = useExercisesStore()
const authStore = useAuthStore()

const search = ref('')
const dialog = ref(false)
const editing = ref(null)
const saving = ref(false)
const uploadingImage = ref(false)
const previewUrl = ref(null)
const pendingFile = ref(null)
const fileInput = ref(null)

const muscleOptions = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps',
  'Abdômen', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha',
]

const defaultForm = () => ({ name: '', description: '', muscle_groups: [], equipment: '', video_url: '' })
const form = ref(defaultForm())

const filtered = computed(() => {
  const q = search.value?.toLowerCase() || ''
  return exercisesStore.exercises.filter(e => e.name.toLowerCase().includes(q))
})

function openDialog(ex = null) {
  editing.value = ex
  previewUrl.value = null
  pendingFile.value = null
  form.value = ex
    ? { name: ex.name, description: ex.description || '', muscle_groups: ex.muscle_groups || [], equipment: ex.equipment || '', video_url: ex.video_url || '' }
    : defaultForm()
  dialog.value = true
}

function closeDialog() {
  previewUrl.value = null
  pendingFile.value = null
  dialog.value = false
}

async function handleFileSelected(event) {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  if (file.size > 5 * 1024 * 1024) {
    $q.notify({ type: 'negative', message: 'Arquivo muito grande (máx. 5 MB)' })
    return
  }

  if (editing.value) {
    // Upload imediato ao editar
    uploadingImage.value = true
    const { error } = await exercisesStore.uploadImage(editing.value.id, file)
    uploadingImage.value = false
    if (error) {
      $q.notify({ type: 'negative', message: 'Erro no upload: ' + error.message })
    } else {
      editing.value = exercisesStore.exercises.find(e => e.id === editing.value.id)
      $q.notify({ type: 'positive', message: 'Imagem atualizada!' })
    }
  } else {
    // Guarda para upload após criação
    pendingFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

async function handleRemoveImage() {
  if (editing.value) {
    uploadingImage.value = true
    await exercisesStore.removeImage(editing.value.id)
    uploadingImage.value = false
    editing.value = exercisesStore.exercises.find(e => e.id === editing.value.id)
  } else {
    pendingFile.value = null
    previewUrl.value = null
  }
}

async function handleSave() {
  if (!form.value.name) return
  saving.value = true
  const payload = { ...form.value, created_by: authStore.user.id }

  if (editing.value) {
    const { error } = await exercisesStore.update(editing.value.id, payload)
    saving.value = false
    if (error) { $q.notify({ type: 'negative', message: error.message }); return }
    closeDialog()
    $q.notify({ type: 'positive', message: 'Exercício atualizado' })
    return
  }

  // Criar novo exercício
  const { data, error } = await exercisesStore.create(payload)
  if (error) {
    saving.value = false
    $q.notify({ type: 'negative', message: error.message })
    return
  }

  // Upload da imagem pendente (se houver)
  if (pendingFile.value && data?.id) {
    const { error: uploadError } = await exercisesStore.uploadImage(data.id, pendingFile.value)
    if (uploadError) {
      $q.notify({ type: 'warning', message: `Exercício criado, mas falha no upload: ${uploadError.message}` })
    }
  }

  saving.value = false
  closeDialog()
  $q.notify({ type: 'positive', message: 'Exercício criado!' })
}

function confirmDelete(ex) {
  $q.dialog({
    title: 'Remover exercício',
    message: `Deseja remover "${ex.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const { error } = await exercisesStore.remove(ex.id)
    if (error) $q.notify({ type: 'negative', message: error.message })
    else $q.notify({ type: 'positive', message: 'Exercício removido' })
  })
}

import { onMounted } from 'vue'
onMounted(() => exercisesStore.fetchAll())
</script>

<style scoped>
.image-preview {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-preview__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.image-preview:hover .image-preview__overlay {
  opacity: 1;
}
</style>
