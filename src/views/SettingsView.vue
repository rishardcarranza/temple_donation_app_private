<template>
  <div class="settings-view">
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 font-weight-bold mb-4">Configuración General</h2>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-4">
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.ward_name"
              label="Nombre del Barrio"
              :rules="[v => !!v || 'El nombre es requerido']"
              class="mb-3"
            />

            <v-text-field
              v-model.number="formData.default_donation_amount"
              label="Monto por Defecto (Donaciones Públicas)"
              type="number"
              prefix="$"
              :rules="[v => !!v || 'El monto es requerido', v => v > 0 || 'Monto mayor a 0']"
              class="mb-3"
            />

            <v-text-field
              v-model.number="formData.donation_goal"
              label="Meta de Donación Mensual"
              type="number"
              prefix="$"
              :rules="[v => !!v || 'La meta es requerida', v => v > 0 || 'Meta mayor a 0']"
              class="mb-3"
            />

            <v-text-field
              v-model="formData.whatsapp_leader_phone"
              label="WhatsApp Líder General"
              placeholder="+1234567890"
              :rules="[v => !!v || 'El número es requerido']"
              class="mb-3"
            />

            <v-text-field
              v-model="formData.whatsapp_socsoc_phone"
              label="WhatsApp Sociedad de Socorros"
              placeholder="+1234567890"
              :rules="[v => !!v || 'El número es requerido']"
              class="mb-3"
            />

            <v-text-field
              v-model="formData.whatsapp_cuorum_phone"
              label="WhatsApp Cuórum de Élderes"
              placeholder="+1234567890"
              :rules="[v => !!v || 'El número es requerido']"
              class="mb-3"
            />

            <v-btn
              color="primary"
              block
              :loading="saving"
              :disabled="!formValid"
              @click="save"
            >
              Guardar Configuración
            </v-btn>
          </v-form>
        </v-card>
      </v-col>
      <v-col cols="12" md="8" lg="6" class="mt-4">
        <v-card class="pa-4">
          <h3 class="text-h6 font-weight-bold mb-3">Período Activo</h3>
          <v-select
            v-model="activePeriod"
            label="Seleccionar Período Activo"
            :items="periods"
            item-title="month_display"
            item-value="month"
            :loading="loadingPeriods"
            class="mb-3"
            @update:model-value="activatePeriod"
          />
          <v-list density="compact" v-if="periods.length > 0">
            <v-list-item v-for="p in periods" :key="p.month">
              <template v-slot:prepend>
                <v-icon :color="p.is_active ? 'success' : 'grey'">
                  {{ p.is_active ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ p.month_display }}</v-list-item-title>
              <v-list-item-subtitle>{{ p.month }}</v-list-item-subtitle>
              <template v-slot:append v-if="p.is_active">
                <v-chip color="success" size="small">Activo</v-chip>
              </template>
            </v-list-item>
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
