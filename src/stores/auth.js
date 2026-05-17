import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(false)

  const isTrainer = computed(() => profile.value?.role === 'trainer')
  const isAthlete = computed(() => profile.value?.role === 'athlete')

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) profile.value = data
  }

  async function signIn(email, password) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      user.value = data.user
      await fetchProfile(data.user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function signUp(email, password, fullName, role) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
      // Atualiza o role (trigger cria com 'athlete' por padrão)
      if (data.user && role === 'trainer') {
        await supabase.from('profiles').update({ role, full_name: fullName }).eq('id', data.user.id)
      }
      user.value = data.user
      await fetchProfile(data.user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      user.value = data.session.user
      await fetchProfile(data.session.user.id)
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        user.value = session.user
        await fetchProfile(session.user.id)
      } else {
        user.value = null
        profile.value = null
      }
    })
  }

  return { user, profile, loading, isTrainer, isAthlete, signIn, signUp, signOut, init, fetchProfile }
})
