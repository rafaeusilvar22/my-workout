import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useScheduleStore = defineStore('schedule', () => {
  const schedule = ref(null)
  const exceptions = ref([])

  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

  async function fetchSchedule(trainerId) {
    const { data, error } = await supabase
      .from('gym_schedule')
      .select('*')
      .eq('trainer_id', trainerId)
      .maybeSingle()
    if (!error) schedule.value = data
    return { data, error }
  }

  async function upsertSchedule(trainerId, days) {
    const { data, error } = await supabase
      .from('gym_schedule')
      .upsert({ trainer_id: trainerId, ...days }, { onConflict: 'trainer_id' })
      .select()
      .single()
    if (!error) schedule.value = data
    return { data, error }
  }

  async function fetchExceptions(trainerId) {
    const { data, error } = await supabase
      .from('gym_exceptions')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('exception_date')
    if (!error) exceptions.value = data || []
    return { data, error }
  }

  async function addException(payload) {
    const { data, error } = await supabase
      .from('gym_exceptions')
      .upsert(payload, { onConflict: 'trainer_id,exception_date' })
      .select()
      .single()
    if (!error) {
      const idx = exceptions.value.findIndex(e => e.exception_date === payload.exception_date)
      if (idx !== -1) exceptions.value[idx] = data
      else exceptions.value.push(data)
      exceptions.value.sort((a, b) => a.exception_date < b.exception_date ? -1 : 1)
    }
    return { data, error }
  }

  async function removeException(id) {
    const { error } = await supabase.from('gym_exceptions').delete().eq('id', id)
    if (!error) exceptions.value = exceptions.value.filter(e => e.id !== id)
    return { error }
  }

  // Retorna true se a academia está aberta nessa data (string YYYY-MM-DD)
  function isGymOpen(dateStr) {
    const exception = exceptions.value.find(e => e.exception_date === dateStr)
    if (exception !== undefined) return exception.is_open
    if (!schedule.value) return true
    const date = new Date(dateStr + 'T00:00:00')
    return schedule.value[DAY_KEYS[date.getDay()]] !== false
  }

  return {
    schedule, exceptions,
    fetchSchedule, upsertSchedule,
    fetchExceptions, addException, removeException,
    isGymOpen,
  }
})
