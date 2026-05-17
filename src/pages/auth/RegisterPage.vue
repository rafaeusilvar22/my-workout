<template>
  <q-page class="flex flex-center">
    <q-card class="register-card q-pa-lg bg-dark" style="border: 1px solid rgba(255,255,255,0.1);">
      <q-card-section class="text-center q-pb-sm">
        <q-icon name="fitness_center" size="48px" color="primary" />
        <div class="text-h5 text-weight-bold q-mt-sm">Criar Conta</div>
        <div class="text-caption text-grey-6">Bem-vindo ao My Workout</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleRegister" class="q-gutter-md">
          <q-input
            v-model="fullName"
            label="Nome completo"
            outlined
            dense
            :rules="[val => !!val || 'Campo obrigatório']"
          >
            <template #prepend><q-icon name="person" /></template>
          </q-input>

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
            :rules="[val => val && val.length >= 6 || 'Mínimo 6 caracteres']"
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

          <div>
            <div class="text-caption text-grey-7 q-mb-sm">Sou um(a):</div>
            <q-btn-toggle
              v-model="role"
              :options="[
                { label: 'Atleta', value: 'athlete', icon: 'directions_run' },
                { label: 'Treinador', value: 'trainer', icon: 'sports' },
              ]"
              spread
              unelevated
              color="dark"
              text-color="grey-5"
              toggle-color="primary"
              toggle-text-color="dark"
              class="full-width"
            />
          </div>

          <q-btn
            type="submit"
            label="Criar conta"
            color="primary"
            class="full-width"
            :loading="authStore.loading"
            unelevated
            size="md"
          />
        </q-form>
      </q-card-section>

      <q-card-section class="text-center q-pt-none">
        <span class="text-caption text-grey-6">Já tem conta? </span>
        <router-link to="/auth/login" class="text-primary text-caption text-weight-medium">
          Fazer login
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

const fullName = ref('')
const email = ref('')
const password = ref('')
const role = ref('athlete')
const showPass = ref(false)

async function handleRegister() {
  const result = await authStore.signUp(email.value, password.value, fullName.value, role.value)
  if (result.success) {
    const dest = authStore.isTrainer ? '/trainer/dashboard' : '/athlete/home'
    router.push(dest)
  } else {
    $q.notify({ type: 'negative', message: result.error || 'Erro ao criar conta' })
  }
}
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
}
</style>
