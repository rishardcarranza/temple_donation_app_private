<template>
  <div class="settings-view">
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold mb-4">Configuración General</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100">
          <div class="d-flex align-center mb-6">
            <v-avatar color="primary" variant="tonal" rounded class="mr-3">
              <v-icon>mdi-cog</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold mb-0">Datos del Sistema</h3>
              <p class="text-caption text-muted mb-0">Información pública y metas</p>
            </div>
          </div>

          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.ward_name"
              label="Nombre del Barrio"
              :rules="[v => !!v || 'El nombre es requerido']"
              class="mb-2"
            />

            <v-row>
              <v-col cols="12" sm="6" class="pb-0">
                <v-text-field
                  v-model.number="formData.default_donation_amount"
                  label="Monto por Defecto"
                  type="number"
                  prefix="$"
                  :rules="[v => !!v || 'Requerido', v => v > 0 || 'Mayor a 0']"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" sm="6" class="pb-0">
                <v-text-field
                  v-model.number="formData.donation_goal"
                  label="Meta Mensual"
                  type="number"
                  prefix="$"
                  :rules="[v => !!v || 'Requerida', v => v > 0 || 'Mayor a 0']"
                  class="mb-2"
                />
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>
            <p class="text-subtitle-2 font-weight-bold mb-3">Contactos de WhatsApp</p>

            <v-text-field
              v-model="formData.whatsapp_leader_phone"
              label="Líder General"
              placeholder="+1234567890"
              prepend-inner-icon="mdi-whatsapp"
              :rules="[v => !!v || 'Requerido']"
              class="mb-2"
            />

            <v-row>
              <v-col cols="12" sm="6" class="pb-0">
                <v-text-field
                  v-model="formData.whatsapp_socsoc_phone"
                  label="Sociedad de Socorro"
                  placeholder="+1234567890"
                  prepend-inner-icon="mdi-whatsapp"
                  :rules="[v => !!v || 'Requerido']"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" sm="6" class="pb-0">
                <v-text-field
                  v-model="formData.whatsapp_cuorum_phone"
                  label="Cuórum de Élderes"
                  placeholder="+1234567890"
                  prepend-inner-icon="mdi-whatsapp"
                  :rules="[v => !!v || 'Requerido']"
                  class="mb-2"
                />
              </v-col>
            </v-row>

            <v-btn
              color="primary"
              block
              size="large"
              class="mt-2 font-weight-bold"
              :loading="saving"
              :disabled="!formValid"
              @click="save"
            >
              Guardar Configuración
            </v-btn>
          </v-form>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-4 h-100">
          <div class="d-flex align-center mb-6">
            <v-avatar color="primary" variant="tonal" rounded class="mr-3">
              <v-icon>mdi-calendar-check</v-icon>
            </v-avatar>
            <div>
              <h3 class="text-h6 font-weight-bold mb-0">Gestión de Períodos</h3>
              <p class="text-caption text-muted mb-0">Selecciona el mes activo para el sistema</p>
            </div>
          </div>

          <div v-if="loadingPeriods" class="d-flex justify-center pa-8">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <v-list v-else bg-color="transparent" class="pa-0">
            <v-card
              v-for="p in periods"
              :key="p.month"
              variant="outlined"
              :color="p.is_active ? 'primary' : 'grey-lighten-1'"
              :style="p.is_active ? 'border-width: 2px; background-color: rgba(var(--v-theme-primary), 0.05);' : ''"
              class="mb-3"
            >
              <v-list-item class="pa-3">
                <template v-slot:prepend>
                  <v-icon size="x-large" :color="p.is_active ? 'primary' : 'grey'" class="mr-4">
                    {{ p.is_active ? 'mdi-check-circle' : 'mdi-calendar-blank' }}
                  </v-icon>
                </template>

                <v-list-item-title :class="['font-weight-bold', p.is_active ? 'text-primary' : '']">
                  {{ p.month_display }}
                </v-list-item-title>
                <v-list-item-subtitle :class="p.is_active ? 'text-primary' : ''" style="opacity: 0.8;">
                  {{ p.month }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-chip v-if="p.is_active" color="primary" variant="elevated" size="small" class="font-weight-bold elevation-0">
                    ACTIVO
                  </v-chip>
                  <v-btn
                    v-else
                    color="primary"
                    variant="tonal"
                    size="small"
                    class="font-weight-bold"
                    @click="activatePeriod(p.month)"
                  >
                    Activar
                  </v-btn>
                </template>
              </v-list-item>
            </v-card>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '@/api'
import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()
const form = ref(null)
const formValid = ref(false)
const saving = ref(false)
const periods = ref([])
const activePeriod = ref('')
const loadingPeriods = ref(false)

const formData = reactive({
  default_donation_amount: null,
  donation_goal: null,
  whatsapp_leader_phone: '',
  whatsapp_socsoc_phone: '',
  whatsapp_cuorum_phone: '',
  ward_name: ''
})

async function loadSettings() {
  try {
    const response = await api.settings.get()
    const data = response.data
    formData.default_donation_amount = data.default_donation_amount
    formData.donation_goal = data.donation_goal
    formData.whatsapp_leader_phone = data.whatsapp_leader_phone
    formData.whatsapp_socsoc_phone = data.whatsapp_socsoc_phone
    formData.whatsapp_cuorum_phone = data.whatsapp_cuorum_phone
    formData.ward_name = data.ward_name
  } catch (e) {
    console.error('Error loading settings:', e)
    notifications.error('Error al cargar configuración')
  }
}

async function loadPeriods() {
  loadingPeriods.value = true
  try {
    const response = await api.periods.getAll()
    periods.value = response.data || []
    const active = periods.value.find(p => p.is_active)
    if (active) {
      activePeriod.value = active.month
    }
  } catch (e) {
    console.error('Error loading periods:', e)
    notifications.error('Error al cargar períodos')
  } finally {
    loadingPeriods.value = false
  }
}

async function activatePeriod(month) {
  try {
    await api.periods.setActive(month)
    activePeriod.value = month
    notifications.success('Período activado exitosamente')
    await loadPeriods()
  } catch (e) {
    console.error('Error activating period:', e)
    const message = e.response?.data?.detail || 'Error al activar período'
    notifications.error(message)
  }
}

async function save() {
  if (!formValid.value) return

  saving.value = true
  try {
    await api.settings.update({
      default_donation_amount: formData.default_donation_amount,
      donation_goal: formData.donation_goal,
      whatsapp_leader_phone: formData.whatsapp_leader_phone,
      whatsapp_socsoc_phone: formData.whatsapp_socsoc_phone,
      whatsapp_cuorum_phone: formData.whatsapp_cuorum_phone,
      ward_name: formData.ward_name
    })
    notifications.success('Configuración guardada exitosamente')
  } catch (e) {
    console.error('Error saving settings:', e)
    const message = e.response?.data?.detail || 'Error al guardar configuración'
    notifications.error(message)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadPeriods()
})
</script>

<style scoped>
.settings-view {
  max-width: 800px;
  margin: 0 auto;
}
</style>
