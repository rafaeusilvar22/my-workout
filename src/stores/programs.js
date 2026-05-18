import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useProgramsStore = defineStore('programs', () => {
  const athletes = ref([])
  const programs = ref([])
  const currentProgram = ref(null)
  const loading = ref(false)

  async function fetchAthletes() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'athlete')
      .order('full_name')
    if (!error) athletes.value = data
    return { error }
  }

  async function fetchTrainerPrograms(trainerId) {
    loading.value = true
    const { data, error } = await supabase
      .from('programs')
      .select('*, profiles!programs_athlete_id_fkey(full_name)')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: false })
    if (!error) programs.value = data
    loading.value = false
    return { error }
  }

  async function fetchProgramFull(programId) {
    loading.value = true
    const { data, error } = await supabase
      .from('programs')
      .select(`
        *,
        program_phases (
          *,
          training_splits (
            *,
            split_exercises (
              *,
              exercises (*)
            )
          )
        )
      `)
      .eq('id', programId)
      .single()
    if (!error && data) {
      data.program_phases?.sort((a, b) => a.order_index - b.order_index)
      for (const phase of data.program_phases || []) {
        phase.training_splits?.sort((a, b) => a.order_index - b.order_index)
        for (const split of phase.training_splits || []) {
          split.split_exercises?.sort((a, b) => a.order_index - b.order_index)
        }
      }
      currentProgram.value = data
    }
    loading.value = false
    return { data, error }
  }

  async function createProgram(payload) {
    const { data, error } = await supabase
      .from('programs')
      .insert(payload)
      .select()
      .single()
    if (!error) programs.value.unshift(data)
    return { data, error }
  }

  async function createPhase(payload) {
    const { data, error } = await supabase
      .from('program_phases')
      .insert(payload)
      .select()
      .single()
    return { data, error }
  }

  async function createSplit(payload) {
    const { data, error } = await supabase
      .from('training_splits')
      .insert(payload)
      .select()
      .single()
    return { data, error }
  }

  async function addExerciseToSplit(payload) {
    const { data, error } = await supabase
      .from('split_exercises')
      .insert(payload)
      .select('*, exercises(*)')
      .single()
    return { data, error }
  }

  async function removeExerciseFromSplit(id) {
    const { error } = await supabase.from('split_exercises').delete().eq('id', id)
    return { error }
  }

  async function updateSplitExercise(id, payload) {
    const { data, error } = await supabase
      .from('split_exercises')
      .update(payload)
      .eq('id', id)
      .select('*, exercises(*)')
      .single()
    return { data, error }
  }

  async function updateSplitOrders(updates) {
    const results = await Promise.all(
      updates.map(({ id, order_index }) =>
        supabase.from('training_splits').update({ order_index }).eq('id', id)
      )
    )
    const error = results.find(r => r.error)?.error || null
    return { error }
  }

  async function updateExerciseOrders(updates) {
    const results = await Promise.all(
      updates.map(({ id, order_index }) =>
        supabase.from('split_exercises').update({ order_index }).eq('id', id)
      )
    )
    const error = results.find(r => r.error)?.error || null
    return { error }
  }

  async function updateSplit(id, payload) {
    const { data, error } = await supabase
      .from('training_splits')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  }

  async function deleteSplit(id) {
    const { error } = await supabase.from('training_splits').delete().eq('id', id)
    return { error }
  }

  async function deletePhase(id) {
    const { error } = await supabase.from('program_phases').delete().eq('id', id)
    return { error }
  }

  async function uploadAthleteAvatar(athleteId, file) {
    const ext = file.name.split('.').pop()
    const path = `${athleteId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) return { success: false, error: uploadError.message }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

    const result = await updateAthleteProfile(athleteId, { avatar_url: avatarUrl })
    if (result.error) return { success: false, error: result.error.message }

    return { success: true }
  }

  async function updateAthleteProfile(athleteId, payload) {
    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', athleteId)
      .select()
      .single()
    if (!error) {
      const idx = athletes.value.findIndex(a => a.id === athleteId)
      if (idx !== -1) athletes.value[idx] = { ...athletes.value[idx], ...data }
    }
    return { data, error }
  }

  return {
    athletes, programs, currentProgram, loading,
    fetchAthletes, fetchTrainerPrograms, fetchProgramFull,
    createProgram, createPhase, createSplit,
    addExerciseToSplit, removeExerciseFromSplit,
    updateSplitExercise, updateSplit, updateSplitOrders, updateExerciseOrders,
    deleteSplit, deletePhase, updateAthleteProfile, uploadAthleteAvatar,
  }
})
