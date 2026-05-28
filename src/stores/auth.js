import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from 'src/boot/supabase'

const PROFILE_CACHE_KEY = 'mw_profile'

function saveProfileCache(data) {
  const { id, full_name, avatar_url, role } = data
  localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ id, full_name, avatar_url, role }))
}

function loadProfileCache() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(loadProfileCache()) // inicia com cache imediato
  const loading = ref(false)

  const isTrainer = computed(() => profile.value?.role === 'trainer')
  const isAthlete = computed(() => profile.value?.role === 'athlete')

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!error) {
      profile.value = data
      saveProfileCache(data)
    }
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
    localStorage.removeItem(PROFILE_CACHE_KEY)
  }

  async function init() {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      user.value = data.session.user
      await fetchProfile(data.session.user.id)
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
      } else if (session?.user) {
        user.value = session.user
        fetchProfile(session.user.id)
      }
    })
  }

  async function uploadAvatar(file) {
    const userId = user.value?.id
    if (!userId) return { success: false, error: 'Não autenticado' }

    const ext = file.name.split('.').pop()
    const path = `${userId}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (uploadError) return { success: false, error: uploadError.message }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)

    if (updateError) return { success: false, error: updateError.message }

    profile.value = { ...profile.value, avatar_url: avatarUrl }
    saveProfileCache(profile.value)
    return { success: true }
  }

  return { user, profile, loading, isTrainer, isAthlete, signIn, signUp, signOut, init, fetchProfile, uploadAvatar }
})
