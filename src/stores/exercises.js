import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useExercisesStore = defineStore('exercises', () => {
  const exercises = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name')
    if (!error) exercises.value = data
    loading.value = false
    return { error }
  }

  async function create(payload) {
    const { data, error } = await supabase
      .from('exercises')
      .insert(payload)
      .select()
      .single()
    if (!error) await fetchAll()
    return { data, error }
  }

  async function update(id, payload) {
    const { data, error } = await supabase
      .from('exercises')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (!error) await fetchAll()
    return { data, error }
  }

  async function uploadImage(exerciseId, file) {
    const ext = file.name.split('.').pop().toLowerCase()
    const path = `${exerciseId}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('exercise-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) return { error: uploadError }
    const { data: { publicUrl } } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(path)
    return update(exerciseId, { image_url: publicUrl })
  }

  async function removeImage(exerciseId) {
    const ex = exercises.value.find(e => e.id === exerciseId)
    if (ex?.image_url) {
      const filename = ex.image_url.split('/').pop()
      await supabase.storage.from('exercise-images').remove([filename])
    }
    return update(exerciseId, { image_url: null })
  }

  async function remove(id) {
    const ex = exercises.value.find(e => e.id === id)
    if (ex?.image_url) {
      const filename = ex.image_url.split('/').pop()
      await supabase.storage.from('exercise-images').remove([filename])
    }
    const { error } = await supabase.from('exercises').delete().eq('id', id)
    if (!error) await fetchAll()
    return { error }
  }

  return { exercises, loading, fetchAll, create, update, remove, uploadImage, removeImage }
})
