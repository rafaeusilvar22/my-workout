import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useSessionsStore = defineStore('sessions', () => {
  const sessions = ref([])
  const activeProgram = ref(null)
  const achievements = ref([])
  const loading = ref(false)

  async function fetchActiveProgram(athleteId) {
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
      .eq('athlete_id', athleteId)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!error) activeProgram.value = data
    return { data, error }
  }

  async function fetchSessions(athleteId) {
    loading.value = true
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, training_splits(name, color)')
      .eq('athlete_id', athleteId)
      .order('session_date', { ascending: false })
      .limit(60)
    if (!error) sessions.value = data
    loading.value = false
    return { error }
  }

  async function startSession(athleteId, splitId) {
    const today = new Date().toISOString().split('T')[0]
    // Evita duplicar sessão do mesmo dia/split
    const existing = sessions.value.find(s => s.session_date === today && s.split_id === splitId)
    if (existing) return { data: existing, error: null }

    const { data, error } = await supabase
      .from('workout_sessions')
      .insert({ athlete_id: athleteId, split_id: splitId, session_date: today, completed: false })
      .select()
      .single()
    if (!error) await fetchSessions(athleteId)
    return { data: data || sessions.value.find(s => s.session_date === today && s.split_id === splitId), error }
  }

  async function logExercise(sessionId, splitExerciseId, payload) {
    // Upsert: se já logou esse exercício nessa sessão, atualiza
    const existing = await supabase
      .from('exercise_logs')
      .select('id')
      .eq('session_id', sessionId)
      .eq('split_exercise_id', splitExerciseId)
      .maybeSingle()

    if (existing.data) {
      return supabase
        .from('exercise_logs')
        .update(payload)
        .eq('id', existing.data.id)
        .select()
        .single()
    }
    return supabase
      .from('exercise_logs')
      .insert({ session_id: sessionId, split_exercise_id: splitExerciseId, ...payload })
      .select()
      .single()
  }

  async function completeSession(sessionId, durationMinutes) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .update({ completed: true, duration_minutes: durationMinutes })
      .eq('id', sessionId)
      .select()
      .single()
    if (!error) {
      const idx = sessions.value.findIndex(s => s.id === sessionId)
      if (idx !== -1) sessions.value[idx] = data
    }
    return { data, error }
  }

  async function fetchAchievements(athleteId) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('earned_at', { ascending: false })
    if (!error) achievements.value = data
    return { error }
  }

  async function checkAndGrantAchievements(athleteId) {
    const existingTypes = achievements.value.map(a => a.type)
    const toGrant = []

    // first_session
    if (!existingTypes.includes('first_session')) {
      const completed = sessions.value.filter(s => s.completed)
      if (completed.length >= 1) {
        toGrant.push({ athlete_id: athleteId, type: 'first_session', description: 'Primeira sessão concluída!' })
      }
    }

    // streak_7: 7 dias únicos de sessões completadas nos últimos 7 dias
    if (!existingTypes.includes('streak_7')) {
      const streak = computeStreak(sessions.value)
      if (streak >= 7) {
        toGrant.push({ athlete_id: athleteId, type: 'streak_7', description: '7 dias seguidos de treino!' })
      }
    }

    // 10_sessions
    if (!existingTypes.includes('10_sessions')) {
      const completed = sessions.value.filter(s => s.completed)
      if (completed.length >= 10) {
        toGrant.push({ athlete_id: athleteId, type: '10_sessions', description: '10 sessões concluídas!' })
      }
    }

    if (toGrant.length > 0) {
      const { data, error } = await supabase.from('achievements').insert(toGrant).select()
      if (!error) achievements.value = [...data, ...achievements.value]
      return data || []
    }
    return []
  }

  function computeStreak(sessionsList) {
    const completedDates = [
      ...new Set(
        sessionsList
          .filter(s => s.completed)
          .map(s => s.session_date)
      ),
    ].sort((a, b) => (a > b ? -1 : 1))

    if (completedDates.length === 0) return 0

    let streak = 0
    let cursor = new Date()
    cursor.setHours(0, 0, 0, 0)

    for (const dateStr of completedDates) {
      const d = new Date(dateStr + 'T00:00:00')
      const diff = Math.round((cursor - d) / 86400000)
      if (diff === 0 || diff === 1) {
        streak++
        cursor = d
      } else {
        break
      }
    }
    return streak
  }

  function getStreak() {
    return computeStreak(sessions.value)
  }

  // Retorna o próximo split na rotação baseado na última sessão concluída.
  // Splits com day_of_week definido são ignorados aqui (modo fixo por dia).
  function getNextSplit(program) {
    if (!program) return null

    const rotatingSplits = []
    for (const phase of [...(program.program_phases || [])].sort((a, b) => a.order_index - b.order_index)) {
      for (const split of phase.training_splits || []) {
        if (split.day_of_week === null || split.day_of_week === undefined) {
          rotatingSplits.push(split)
        }
      }
    }

    if (rotatingSplits.length === 0) return null

    const splitIds = new Set(rotatingSplits.map(s => s.id))
    const lastCompleted = sessions.value
      .filter(s => s.completed && splitIds.has(s.split_id))
      .sort((a, b) => {
        if (a.session_date !== b.session_date) return a.session_date < b.session_date ? 1 : -1
        return new Date(b.created_at) - new Date(a.created_at)
      })[0]

    if (!lastCompleted) return rotatingSplits[0]

    const lastIdx = rotatingSplits.findIndex(s => s.id === lastCompleted.split_id)
    return rotatingSplits[(lastIdx + 1) % rotatingSplits.length]
  }

  // Retorna o split da sessão já concluída hoje (se houver)
  function getTodayCompletedSplit(program) {
    if (!program) return null
    const today = new Date().toISOString().split('T')[0]
    const todayDone = sessions.value.find(s => s.completed && s.session_date === today)
    if (!todayDone) return null

    for (const phase of program.program_phases || []) {
      const found = (phase.training_splits || []).find(s => s.id === todayDone.split_id)
      if (found) return found
    }
    return null
  }

  async function fetchPreviousSessionLogs(athleteId, splitId, excludeSessionId) {
    const { data: prev } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('athlete_id', athleteId)
      .eq('split_id', splitId)
      .eq('completed', true)
      .neq('id', excludeSessionId)
      .order('session_date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!prev) return { data: [], error: null }

    const { data, error } = await supabase
      .from('exercise_logs')
      .select('split_exercise_id, weight_kg, reps_completed, sets_completed')
      .eq('session_id', prev.id)

    return { data: data || [], error }
  }

  async function fetchSessionLogs(sessionId) {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('*, split_exercises(sets, reps, exercises(name))')
      .eq('session_id', sessionId)
      .order('created_at')
    return { data: data || [], error }
  }

  async function fetchAthleteSessionsForTrainer(athleteId) {
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, training_splits(name, color)')
      .eq('athlete_id', athleteId)
      .order('session_date', { ascending: true })
      .limit(200)
    return { data: data || [], error }
  }

  async function fetchExerciseProgress(athleteId, exerciseId) {
    const { data: splitExercises, error: seError } = await supabase
      .from('split_exercises')
      .select('id')
      .eq('exercise_id', exerciseId)
    if (seError || !splitExercises?.length) return { data: [], error: seError }

    const ids = splitExercises.map(se => se.id)
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('weight_kg, session_id, workout_sessions!inner(session_date, athlete_id, completed)')
      .in('split_exercise_id', ids)
      .eq('workout_sessions.athlete_id', athleteId)
      .eq('workout_sessions.completed', true)
      .not('weight_kg', 'is', null)
      .order('workout_sessions.session_date')
    if (error) return { data: [], error }

    // Agrupa por data — máximo por dia
    const byDate = {}
    for (const log of data) {
      const date = log.workout_sessions.session_date
      if (!byDate[date] || log.weight_kg > byDate[date]) byDate[date] = log.weight_kg
    }
    const result = Object.entries(byDate)
      .sort(([a], [b]) => a < b ? -1 : 1)
      .map(([date, weight_kg]) => ({ date, weight_kg }))
    return { data: result, error: null }
  }

  return {
    sessions, activeProgram, achievements, loading,
    fetchActiveProgram, fetchSessions, startSession,
    logExercise, completeSession,
    fetchAchievements, checkAndGrantAchievements,
    getStreak, getNextSplit, getTodayCompletedSplit,
    fetchSessionLogs, fetchPreviousSessionLogs, fetchAthleteSessionsForTrainer, fetchExerciseProgress,
  }
})
