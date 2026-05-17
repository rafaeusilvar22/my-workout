<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <q-btn flat round dense icon="arrow_back" @click="$router.back()" class="q-mr-sm" />
      <div>
        <div class="text-h6 text-weight-bold">{{ program?.name || 'Carregando...' }}</div>
        <div class="text-caption text-grey-6">Montar programa de treino</div>
      </div>
    </div>

    <div v-if="loading" class="flex flex-center q-py-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <!-- Fases -->
      <div
        v-for="phase in phases"
        :key="phase.id"
        class="q-mb-lg"
      >
        <div class="row items-center justify-between q-mb-sm">
          <div>
            <div class="text-subtitle1 text-weight-bold">{{ phase.name }}</div>
            <div class="text-caption text-grey-6" v-if="phase.week_start">
              Semanas {{ phase.week_start }}–{{ phase.week_end }}
            </div>
          </div>
          <div class="row q-gutter-xs">
            <q-btn flat round dense icon="add" color="primary" @click="openAddSplit(phase)" />
            <q-btn flat round dense icon="delete" color="negative" @click="handleDeletePhase(phase)" />
          </div>
        </div>

        <!-- Splits da fase (draggable) -->
        <draggable
          :list="phase.training_splits"
          item-key="id"
          handle=".split-drag-handle"
          ghost-class="drag-ghost"
          @end="handleSplitsReorder(phase)"
        >
          <template #item="{ element: split }">
            <q-expansion-item
              expand-separator
              header-class="bg-grey-1"
              class="q-mb-sm rounded-borders split-expansion"
              :style="{ borderLeft: `4px solid ${split.color || '#1976d2'}` }"
            >
              <template #header>
                <q-item-section side style="min-width: 24px; padding-right: 4px;">
                  <q-icon name="drag_indicator" class="split-drag-handle cursor-grab" color="grey-4" size="20px" />
                </q-item-section>
                <q-item-section avatar>
                  <q-btn
                    round unelevated dense size="sm"
                    :style="{ background: split.color || '#1976d2' }"
                    icon="palette"
                    text-color="white"
                    @click.stop="openEditSplitColor(split)"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ split.name }}</q-item-label>
                  <q-item-label caption>{{ split.description }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn flat round dense icon="delete" size="xs" color="negative"
                    @click.stop="handleDeleteSplit(split)" />
                </q-item-section>
              </template>

              <q-card flat>
                <q-card-section class="q-pa-sm">
                  <q-list>
                    <draggable
                      :list="exerciseGroupsMap[split.id] || []"
                      item-key="key"
                      handle=".ex-drag-handle"
                      ghost-class="drag-ghost"
                      @end="handleGroupsReorder(split)"
                    >
                      <template #item="{ element: group }">
                        <div>
                          <div v-if="group.superset" class="row items-center q-px-xs q-pt-xs q-pb-none">
                            <q-icon name="swap_vert" size="11px" color="orange" class="q-mr-xs" />
                            <span class="text-caption text-orange text-weight-bold" style="font-size: 10px;">BI-SET</span>
                          </div>
                          <q-item
                            v-for="(se, si) in group.items"
                            :key="se.id"
                            dense class="q-pa-xs"
                            :class="[
                              group.superset ? 'biset-item' : '',
                              group.superset && si === group.items.length - 1 ? 'biset-item--last' : ''
                            ]"
                          >
                            <q-item-section side style="min-width: 20px; padding-right: 4px;">
                              <q-icon
                                v-if="si === 0"
                                name="drag_indicator"
                                class="ex-drag-handle cursor-grab"
                                color="grey-4"
                                size="16px"
                              />
                              <div v-else style="width: 16px;" />
                            </q-item-section>
                            <q-item-section>
                              <q-item-label class="text-weight-medium text-body2">{{ se.exercises?.name }}</q-item-label>
                              <q-item-label caption>{{ se.sets }}x{{ se.reps }} · {{ se.rest_seconds }}s descanso</q-item-label>
                            </q-item-section>
                            <q-item-section side>
                              <div class="row q-gutter-xs">
                                <q-btn flat round dense icon="edit" size="xs" color="grey-6" @click="openEditExercise(se)" />
                                <q-btn flat round dense icon="close" size="xs" color="negative" @click="handleRemoveExercise(se)" />
                              </div>
                            </q-item-section>
                          </q-item>
                        </div>
                      </template>
                    </draggable>
                  </q-list>

                  <q-btn
                    flat color="primary" icon="add" label="Adicionar exercício"
                    size="sm" class="q-mt-sm"
                    @click="openAddExercise(split, phase)"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </template>
        </draggable>

        <q-btn
          v-if="phase.training_splits?.length === 0"
          flat color="grey-5" icon="add" label="Adicionar split"
          class="full-width"
          @click="openAddSplit(phase)"
        />
      </div>

      <!-- Adicionar fase -->
      <q-btn
        color="primary" icon="add" label="Nova Fase"
        unelevated class="full-width q-mt-md"
        @click="addPhaseDialog = true"
      />
    </template>

    <!-- Dialog nova fase -->
    <q-dialog v-model="addPhaseDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Nova Fase</div></q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <q-input v-model="phaseForm.name" label="Nome da fase *" outlined dense placeholder="ex: Fase 1 – Adaptação" />
          <div class="row q-gutter-sm">
            <q-input v-model.number="phaseForm.week_start" label="Semana início" outlined dense type="number" class="col" />
            <q-input v-model.number="phaseForm.week_end" label="Semana fim" outlined dense type="number" class="col" />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="addPhaseDialog = false" />
          <q-btn color="primary" label="Criar" unelevated :loading="savingPhase" @click="handleAddPhase" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog novo split -->
    <q-dialog v-model="addSplitDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section><div class="text-h6">Novo Split</div></q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <q-input v-model="splitForm.name" label="Nome *" outlined dense placeholder="ex: Treino A – Peito e Tríceps" />
          <q-input v-model="splitForm.description" label="Descrição" outlined dense />

          <div>
            <div class="text-caption text-grey-7 q-mb-sm">Cor do treino</div>
            <div class="row q-gutter-sm">
              <div
                v-for="c in colorOptions"
                :key="c"
                class="color-swatch cursor-pointer"
                :style="{ background: c }"
                :class="{ 'color-swatch--selected': splitForm.color === c }"
                @click="splitForm.color = c"
              />
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="addSplitDialog = false" />
          <q-btn
            label="Criar"
            unelevated
            :loading="savingSplit"
            :style="{ background: splitForm.color, color: '#fff' }"
            @click="handleAddSplit"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog adicionar exercício -->
    <q-dialog v-model="addExerciseDialog" persistent>
      <q-card style="min-width: 340px">
        <q-card-section><div class="text-h6">Adicionar Exercício</div></q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <q-select
            v-model="exerciseForm.exercise"
            :options="exerciseOptions"
            option-label="name"
            option-value="id"
            label="Exercício *"
            outlined dense use-input
            input-debounce="200"
            @filter="filterExercises"
          />
          <div class="row q-gutter-sm">
            <q-input v-model.number="exerciseForm.sets" label="Séries" outlined dense type="number" class="col" />
            <q-input v-model="exerciseForm.reps" label="Reps/Duração" outlined dense class="col" placeholder="8-12" />
          </div>
          <q-input v-model.number="exerciseForm.rest_seconds" label="Descanso (seg)" outlined dense type="number" />
          <q-input v-model="exerciseForm.notes" label="Observações" outlined dense />
          <q-input
            v-model="exerciseForm.superset_group"
            label="Grupo bi-set (opcional)"
            outlined dense
            placeholder="ex: 1"
            hint="Exercícios com o mesmo número serão agrupados como bi-set"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="addExerciseDialog = false" />
          <q-btn color="primary" label="Adicionar" unelevated :loading="savingExercise" @click="handleAddExercise" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog editar exercício -->
    <q-dialog v-model="editExerciseDialog" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Editar Exercício</div>
          <div class="text-caption text-grey-6">{{ editingExercise?.exercises?.name }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md q-pt-none">
          <div class="row q-gutter-sm">
            <q-input
              v-model.number="editExerciseForm.sets"
              label="Séries"
              outlined dense type="number"
              class="col"
            />
            <q-input
              v-model="editExerciseForm.reps"
              label="Repetições"
              outlined dense
              class="col"
              placeholder="8-12"
            />
          </div>
          <q-input
            v-model.number="editExerciseForm.rest_seconds"
            label="Descanso (segundos)"
            outlined dense type="number"
          />
          <q-input
            v-model="editExerciseForm.notes"
            label="Observações para o aluno"
            outlined dense
            type="textarea"
            rows="2"
          />
          <q-input
            v-model="editExerciseForm.superset_group"
            label="Grupo bi-set (opcional)"
            outlined dense
            placeholder="ex: 1"
            hint="Exercícios com o mesmo número serão agrupados como bi-set"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="editExerciseDialog = false" />
          <q-btn color="primary" label="Salvar" unelevated :loading="savingEditExercise" @click="handleSaveExercise" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialog editar cor do split -->
    <q-dialog v-model="editSplitColorDialog">
      <q-card style="min-width: 280px">
        <q-card-section>
          <div class="text-h6">Cor do Treino</div>
          <div class="text-caption text-grey-6">{{ editingSplit?.name }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-gutter-sm justify-center">
            <div
              v-for="c in colorOptions"
              :key="c"
              class="color-swatch cursor-pointer"
              :style="{ background: c }"
              :class="{ 'color-swatch--selected': editingSplitColor === c }"
              @click="editingSplitColor = c"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancelar" @click="editSplitColorDialog = false" />
          <q-btn
            label="Salvar"
            unelevated
            :loading="savingSplitColor"
            :style="{ background: editingSplitColor, color: '#fff' }"
            @click="handleSaveSplitColor"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import draggable from 'vuedraggable'
import { useProgramsStore } from 'src/stores/programs'
import { useExercisesStore } from 'src/stores/exercises'

const route = useRoute()
const $q = useQuasar()
const programsStore = useProgramsStore()
const exercisesStore = useExercisesStore()

const loading = ref(true)
const program = computed(() => programsStore.currentProgram)
const phases = computed(() => programsStore.currentProgram?.program_phases || [])

// Phase
const addPhaseDialog = ref(false)
const savingPhase = ref(false)
const phaseForm = ref({ name: '', week_start: null, week_end: null })

// Split
const addSplitDialog = ref(false)
const savingSplit = ref(false)
const selectedPhase = ref(null)
const splitForm = ref({ name: '', description: '', color: '#1976d2' })

const colorOptions = [
  '#1976d2', '#43a047', '#e53935', '#fb8c00',
  '#8e24aa', '#00897b', '#d81b60', '#6d4c41',
]

// Edit exercise inline
const editExerciseDialog = ref(false)
const savingEditExercise = ref(false)
const editingExercise = ref(null)
const editExerciseForm = ref({ sets: 3, reps: '8-12', rest_seconds: 60, notes: '', superset_group: '' })

// Edit split color
const editSplitColorDialog = ref(false)
const savingSplitColor = ref(false)
const editingSplit = ref(null)
const editingSplitColor = ref('#1976d2')

// Exercise (add)
const addExerciseDialog = ref(false)
const savingExercise = ref(false)
const selectedSplit = ref(null)
const exerciseForm = ref({ exercise: null, sets: 3, reps: '8-12', rest_seconds: 60, notes: '', superset_group: '' })
const exerciseOptions = ref([])

function usedExerciseIds() {
  return new Set((selectedSplit.value?.split_exercises || []).map(se => se.exercise_id))
}

function withDisabled(list) {
  const used = usedExerciseIds()
  return list.map(e => used.has(e.id) ? { ...e, disable: true } : e)
}

function filterExercises(val, update) {
  const q = val.toLowerCase()
  update(() => {
    exerciseOptions.value = withDisabled(
      exercisesStore.exercises.filter(e => e.name.toLowerCase().includes(q))
    )
  })
}

// exerciseGroupsMap: splitId → groups[], rebuilt whenever currentProgram changes
const exerciseGroupsMap = ref({})

function buildGroupsForSplit(split) {
  const sorted = [...(split.split_exercises || [])].sort((a, b) => a.order_index - b.order_index)
  const groups = []
  const seen = new Map()
  for (const se of sorted) {
    if (se.superset_group) {
      if (seen.has(se.superset_group)) {
        groups[seen.get(se.superset_group)].items.push(se)
      } else {
        seen.set(se.superset_group, groups.length)
        groups.push({ superset: true, key: `ss-${se.superset_group}-${split.id}`, items: [se] })
      }
    } else {
      groups.push({ superset: false, key: `ex-${se.id}`, items: [se] })
    }
  }
  return groups
}

watch(
  () => programsStore.currentProgram,
  (program) => {
    if (!program) return
    const map = {}
    for (const phase of program.program_phases || []) {
      for (const split of phase.training_splits || []) {
        map[split.id] = buildGroupsForSplit(split)
      }
    }
    exerciseGroupsMap.value = map
  },
  { immediate: true, deep: true }
)

async function handleSplitsReorder(phase) {
  const updates = phase.training_splits.map((s, idx) => ({ id: s.id, order_index: idx }))
  const { error } = await programsStore.updateSplitOrders(updates)
  if (error) $q.notify({ type: 'negative', message: error.message })
}

async function handleGroupsReorder(split) {
  const groups = exerciseGroupsMap.value[split.id] || []
  const updates = []
  let idx = 0
  for (const group of groups) {
    for (const se of group.items) {
      updates.push({ id: se.id, order_index: idx++ })
    }
  }
  const { error } = await programsStore.updateExerciseOrders(updates)
  if (error) $q.notify({ type: 'negative', message: error.message })
}

function openAddSplit(phase) {
  selectedPhase.value = phase
  splitForm.value = { name: '', description: '', color: '#1976d2' }
  addSplitDialog.value = true
}

function openAddExercise(split, phase) {
  selectedSplit.value = split
  selectedPhase.value = phase
  exerciseForm.value = { exercise: null, sets: 3, reps: '8-12', rest_seconds: 60, notes: '', superset_group: '' }
  exerciseOptions.value = withDisabled(exercisesStore.exercises)
  addExerciseDialog.value = true
}

function openEditExercise(se) {
  editingExercise.value = se
  editExerciseForm.value = {
    sets: se.sets,
    reps: se.reps,
    rest_seconds: se.rest_seconds,
    notes: se.notes || '',
    superset_group: se.superset_group || '',
  }
  editExerciseDialog.value = true
}

async function handleSaveExercise() {
  savingEditExercise.value = true
  const { error } = await programsStore.updateSplitExercise(editingExercise.value.id, {
    sets: editExerciseForm.value.sets,
    reps: editExerciseForm.value.reps,
    rest_seconds: editExerciseForm.value.rest_seconds,
    notes: editExerciseForm.value.notes,
    superset_group: editExerciseForm.value.superset_group || null,
  })
  savingEditExercise.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    editExerciseDialog.value = false
    await programsStore.fetchProgramFull(route.params.id)
    $q.notify({ type: 'positive', message: 'Exercício atualizado!' })
  }
}

function openEditSplitColor(split) {
  editingSplit.value = split
  editingSplitColor.value = split.color || '#1976d2'
  editSplitColorDialog.value = true
}

async function handleSaveSplitColor() {
  savingSplitColor.value = true
  const { error } = await programsStore.updateSplit(editingSplit.value.id, {
    color: editingSplitColor.value,
  })
  savingSplitColor.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    editSplitColorDialog.value = false
    await programsStore.fetchProgramFull(route.params.id)
    $q.notify({ type: 'positive', message: 'Cor atualizada!' })
  }
}

function handleDeleteSplit(split) {
  $q.dialog({ title: 'Remover Split', message: `Remover "${split.name}"?`, cancel: true }).onOk(async () => {
    const { error } = await programsStore.deleteSplit(split.id)
    if (error) {
      $q.notify({ type: 'negative', message: error.message })
    } else {
      await programsStore.fetchProgramFull(route.params.id)
      $q.notify({ type: 'positive', message: 'Split removido' })
    }
  })
}

async function handleAddPhase() {
  if (!phaseForm.value.name) return
  savingPhase.value = true
  const { error } = await programsStore.createPhase({
    program_id: route.params.id,
    name: phaseForm.value.name,
    week_start: phaseForm.value.week_start,
    week_end: phaseForm.value.week_end,
    order_index: phases.value.length,
  })
  savingPhase.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    addPhaseDialog.value = false
    await programsStore.fetchProgramFull(route.params.id)
    $q.notify({ type: 'positive', message: 'Fase criada!' })
  }
}

async function handleAddSplit() {
  if (!splitForm.value.name) return
  savingSplit.value = true
  const { error } = await programsStore.createSplit({
    phase_id: selectedPhase.value.id,
    name: splitForm.value.name,
    description: splitForm.value.description,
    color: splitForm.value.color,
    order_index: selectedPhase.value.training_splits?.length || 0,
  })
  savingSplit.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    addSplitDialog.value = false
    await programsStore.fetchProgramFull(route.params.id)
    $q.notify({ type: 'positive', message: 'Split criado!' })
  }
}

async function handleAddExercise() {
  if (!exerciseForm.value.exercise) return
  savingExercise.value = true
  const { error } = await programsStore.addExerciseToSplit({
    split_id: selectedSplit.value.id,
    exercise_id: exerciseForm.value.exercise.id,
    sets: exerciseForm.value.sets,
    reps: exerciseForm.value.reps,
    rest_seconds: exerciseForm.value.rest_seconds,
    notes: exerciseForm.value.notes,
    order_index: selectedSplit.value.split_exercises?.length || 0,
    superset_group: exerciseForm.value.superset_group || null,
  })
  savingExercise.value = false
  if (error) {
    $q.notify({ type: 'negative', message: error.message })
  } else {
    addExerciseDialog.value = false
    await programsStore.fetchProgramFull(route.params.id)
    $q.notify({ type: 'positive', message: 'Exercício adicionado!' })
  }
}

async function handleRemoveExercise(se) {
  $q.dialog({ title: 'Remover', message: `Remover "${se.exercises?.name}"?`, cancel: true }).onOk(async () => {
    const { error } = await programsStore.removeExerciseFromSplit(se.id)
    if (error) {
      $q.notify({ type: 'negative', message: error.message })
    } else {
      await programsStore.fetchProgramFull(route.params.id)
      $q.notify({ type: 'positive', message: 'Removido' })
    }
  })
}

async function handleDeletePhase(phase) {
  $q.dialog({ title: 'Remover Fase', message: `Remover fase "${phase.name}" e todos seus splits?`, cancel: true }).onOk(async () => {
    const { error } = await programsStore.deletePhase(phase.id)
    if (error) {
      $q.notify({ type: 'negative', message: error.message })
    } else {
      await programsStore.fetchProgramFull(route.params.id)
      $q.notify({ type: 'positive', message: 'Fase removida' })
    }
  })
}

onMounted(async () => {
  await Promise.all([
    programsStore.fetchProgramFull(route.params.id),
    exercisesStore.fetchAll(),
  ])
  loading.value = false
})
</script>

<style scoped>
.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  transition: transform 0.15s;
}
.color-swatch:hover {
  transform: scale(1.15);
}
.color-swatch--selected {
  border-color: #000;
  transform: scale(1.15);
}
.split-expansion {
  border-radius: 8px;
  overflow: hidden;
}
.biset-item {
  border-left: 3px solid #fb8c00;
  border-radius: 0 4px 4px 0;
  padding-left: 8px !important;
  margin-bottom: 1px;
}
.biset-item--last {
  margin-bottom: 4px;
}
.drag-ghost {
  opacity: 0.4;
  background: #e3f2fd;
}
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}
</style>
