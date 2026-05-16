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
                  v-model="username"
                  label="Usuario"
                  prepend-inner-icon="mdi-account-outline"
                  type="text"
                  :error-messages="usernameErrors"
                  class="mb-2"
                  bg-color="surface"
                  required
                />
                <div class="password-input-wrapper mb-2">
                  <v-text-field
                    v-model="password"
                    label="Contraseña"
                    prepend-inner-icon="mdi-lock-outline"
                    :type="showPassword ? 'text' : 'password'"
                    :error-messages="passwordErrors"
                    bg-color="surface"
                    required
                    hide-details
                  />
                  <v-btn
                    icon
                    variant="text"
                    size="small"
                    class="password-toggle"
                    @click="showPassword = !showPassword"
                  >
                    <v-icon>{{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}</v-icon>
                  </v-btn>
                </div>
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

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const usernameErrors = computed(() => {
  if (!username.value) return []
  return username.value.length >= 3 ? [] : ['Usuario muy corto']
})

const passwordErrors = computed(() => {
  if (!password.value) return []
  return password.value.length >= 4 ? [] : ['Contraseña muy corta']
})

async function handleLogin() {
  if (!username.value || !password.value) return
  
  loading.value = true
  try {
    await auth.login(username.value, password.value)
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

.password-input-wrapper {
  position: relative;
}

.password-input-wrapper :deep(.v-field) {
  padding-right: 44px !important;
}

.password-toggle {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  margin-top: 2px;
}

.password-toggle .v-icon {
  opacity: 0.6;
}

.password-toggle:hover .v-icon {
  opacity: 1;
}
</style>