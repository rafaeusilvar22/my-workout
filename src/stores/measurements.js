import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useMeasurementsStore = defineStore('measurements', () => {
  const measurements = ref([])

  async function fetchMeasurements(athleteId) {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('measured_at', { ascending: true })
    if (!error) measurements.value = data || []
    return { data, error }
  }

  async function addMeasurement(payload) {
    const { data, error } = await supabase
      .from('body_measurements')
      .insert(payload)
      .select()
      .single()
    if (!error) await fetchMeasurements(payload.athlete_id)
    return { data, error }
  }

  async function removeMeasurement(id) {
    const m = measurements.value.find(m => m.id === id)
    const { error } = await supabase.from('body_measurements').delete().eq('id', id)
    if (!error && m) await fetchMeasurements(m.athlete_id)
    return { error }
  }

  return { measurements, fetchMeasurements, addMeasurement, removeMeasurement }
})
