<template>
  <div class="login-page">
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <div class="login-header text-center mb-6">
            <img src="/icons/icon-192.png" alt="Admin Templo" width="72" height="72" class="mb-2" style="border-radius: 12px;" />
            <h1 class="text-h5 font-weight-bold">Admin Templo</h1>
            <p class="text-muted mt-1">Panel de Administración</p>
          </div>
          <v-card class="pa-6">
            <v-card-text>
              <v-form @submit.prevent="handleLogin">
                <v-text-field
                  v-model="email"
                  label="Email"
                  prepend-inner-icon="mdi-email-outline"
                  type="email"
                  :error-messages="emailErrors"
                  class="mb-2"
                  bg-color="surface"
                  required
                />
                <v-text-field
                  v-model="password"
                  label="Contraseña"
                  prepend-inner-icon="mdi-lock-outline"
                  :type="showPassword ? 'text' : 'password'"
                  :append-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                  @click:append="showPassword = !showPassword"
                  :error-messages="passwordErrors"
                  bg-color="surface"
                  required
                />
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  class="mt-4"
                  :loading="loading"
                  size="large"
                >
                  Ingresar
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'

const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationsStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const emailErrors = computed(() => {
  if (!email.value) return []
  return email.value.includes('@') ? [] : ['Email inválido']
})

const passwordErrors = computed(() => {
  if (!password.value) return []
  return password.value.length >= 4 ? [] : ['Contraseña muy corta']
})

async function handleLogin() {
  if (!email.value || !password.value) return
  
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    notifications.success('Bienvenido')
    await nextTick()
    router.push('/dashboard')
  } catch (error) {
    console.error('Error login:', error)
    const message = error.response?.data?.detail || error.message || 'Error al iniciar sesión'
    notifications.error(message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  background-color: var(--color-surface-alt);
  min-height: 100vh;
}

.login-header h1 {
  color: var(--color-primary);
}

.login-header p {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.v-btn {
  font-weight: 600;
}
</style>