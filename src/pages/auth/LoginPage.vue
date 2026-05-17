<template>
  <q-page class="flex flex-center bg-grey-1">
    <q-card class="login-card q-pa-lg shadow-4">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="fitness_center" size="48px" color="primary" />
        <div class="text-h5 text-weight-bold q-mt-sm">My Workout</div>
        <div class="text-caption text-grey-6">Faça login na sua conta</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            type="email"
            label="E-mail"
            outlined
            dense
            :rules="[val => !!val || 'Campo obrigatório']"
          >
            <template #prepend><q-icon name="email" /></template>
          </q-input>

          <q-input
            v-model="password"
            :type="showPass ? 'text' : 'password'"
            label="Senha"
            outlined
            dense
            :rules="[val => !!val || 'Campo obrigatório']"
          >
            <template #prepend><q-icon name="lock" /></template>
            <template #append>
              <q-icon
                :name="showPass ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPass = !showPass"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Entrar"
            color="primary"
            class="full-width"
            :loading="authStore.loading"
            unelevated
            size="md"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <span class="text-caption text-grey-6">Não tem conta? </span>
        <router-link to="/auth/register" class="text-primary text-caption text-weight-medium">
          Criar conta
        </router-link>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPass = ref(false)

async function handleLogin() {
  const result = await authStore.signIn(email.value, password.value)
  if (result.success) {
    const dest = authStore.isTrainer ? '/trainer/dashboard' : '/athlete/home'
    router.push(dest)
  } else {
    $q.notify({ type: 'negative', message: result.error || 'Erro ao fazer login' })
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
}
</style>
