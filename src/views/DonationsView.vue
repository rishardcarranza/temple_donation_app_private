<template>
  <div class="donations-view">
    <v-row class="mb-3">
      <v-col cols="12">
        <div class="filters">
          <v-select
            v-model="filters.month"
            label="Período"
            :items="periods"
            item-title="display"
            item-value="value"
            clearable
            hide-details
            density="comfortable"
            bg-color="white"
            class="filter-select"
          />
          <v-select
            v-model="filters.status"
            label="Estado"
            :items="statusOptions"
            item-title="text"
            item-value="value"
            clearable
            hide-details
            density="comfortable"
            bg-color="white"
            class="filter-select"
          />
          <v-btn color="primary" @click="loadDonations()" :loading="loading">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </div>
        <div class="text-caption text-muted mt-1">
          Total: {{ total }} aportaciones
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" class="pa-0">
        <v-btn
          color="primary"
          icon
          size="large"
          style="position: fixed; bottom: 80px; right: 16px; z-index: 100;"
          @click="openModal()"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <v-row v-else-if="donations.length === 0">
      <v-col cols="12">
        <v-card class="pa-8 text-center">
          <v-icon size="48" color="grey">mdi-cash-multiple</v-icon>
          <div class="text-h6 mt-2">No hay aportaciones</div>
          <div class="text-muted">Registra la primera aportación</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" v-for="d in donations" :key="d.id">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar :color="getStatusColor(d.status)" size="48" class="mr-3">
              <v-icon color="white">{{ getStatusIcon(d.status) }}</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-medium">{{ getMemberName(d.member_id) }}</div>
              <div class="text-caption text-muted">{{ formatMonth(d.month) }}</div>
              <div class="text-caption text-muted">
                Ingresado por: {{ getRegisteredBy(d) }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-h5 font-weight-bold text-primary">${{ d.amount }}</div>
              <v-chip :color="getStatusColor(d.status)" size="small">
                {{ getStatusLabel(d.status) }}
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="loadingMore">
      <v-col cols="12" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="small" />
      </v-col>
    </v-row>
    
    <div ref="sentinel" style="height: 1px;"></div>

    <v-dialog v-model="dialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="pa-4 font-weight-bold">
          Registrar Aportación
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <div class="text-caption text-muted mb-3">
            Período: {{ currentPeriodDisplay }}
          </div>
          <v-form ref="form" v-model="formValid">
            <v-autocomplete
              v-model="formData.member_id"
              label="Miembro"
              :items="members"
              :item-title="m => m.name"
              :item-value="m => m.id"
              :rules="[v => !!v || showNewMember || 'El miembro es requerido']"
              clearable
              class="mb-2"
              @click:append-inner="toggleNewMember"
              @update:model-value="onMemberChange"
            >
              <template v-slot:append-inner>
                <v-btn variant="text" size="small" @click.stop="toggleNewMember">
                  + Nuevo
                </v-btn>
              </template>
            </v-autocomplete>

            <v-text-field
              v-if="showNewMember"
              v-model="newMemberName"
              label="Nombre del nuevo miembro *"
              :rules="[v => !!v || 'El nombre es requerido']"
              ref="newMemberInput"
              class="mb-2"
              autofocus
            />

            <v-text-field
              v-model="formData.amount"
              label="Monto *"
              type="number"
              prefix="$"
              :rules="[v => !!v || 'El monto es requerido', v => v > 0 || 'Monto mayor a 0']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeModal()">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" :disabled="!formValid" @click="save()">
            Registrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onUnmounted } from 'vue'
import api from '@/api'
import { useNotificationsStore } from '@/stores/notifications'
import { getCurrentMonth, formatMonth, getYearMonths } from '@/utils/date'

const notifications = useNotificationsStore()

const donations = ref([])
const members = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const dialog = ref(false)
const saving = ref(false)
const formValid = ref(false)
const form = ref(null)
const showNewMember = ref(false)
const newMemberName = ref('')
const newMemberInput = ref(null)
const currentPeriod = ref('')
const currentPeriodDisplay = ref('')

const page = ref(1)
const size = 10
const hasMore = ref(true)
const sentinel = ref(null)
const total = ref(0)
let observer = null

const filters = reactive({
  month: null,
  status: null
})

const formData = ref({
  member_id: null,
  amount: null
})

const statusOptions = [
  { text: 'Aprobada', value: 'approved' },
  { text: 'Pendiente', value: 'pending' },
  { text: 'Rechazada', value: 'rejected' }
]

const periods = ref([])

function getMemberName(memberId) {
  const member = members.value.find(m => m.id === memberId)
  return member?.name || 'Miembro'
}

function getRegisteredBy(donation) {
  if (donation.source === 'lider') {
    return donation.registered_by || 'Líder'
  }
  return 'Miembro'
}

function getStatusColor(status) {
  if (status === 'approved') return '#1D9E75'
  if (status === 'rejected') return '#E24B4A'
  return '#F4C430'
}

function getStatusIcon(status) {
  if (status === 'approved') return 'mdi-check'
  if (status === 'rejected') return 'mdi-close'
  return 'mdi-clock'
}

function getStatusLabel(status) {
  if (status === 'approved') return 'Aprobada'
  if (status === 'rejected') return 'Rechazada'
  return 'Pendiente'
}

async function loadDonations(loadMore = false) {
  if (loadMore) {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    page.value++
  } else {
    loading.value = true
    page.value = 1
    donations.value = []
    hasMore.value = true
  }
  
  try {
    const skip = (page.value - 1) * size
    const params = { skip, limit: size }
    if (filters.month) params.month = filters.month
    if (filters.status) params.status = filters.status
    
    const response = await api.donations.getAll(params)
    const data = response.data
    const items = data.items || []
    total.value = data.total || 0
    
    if (loadMore) {
      donations.value.push(...items)
    } else {
      donations.value = items
    }
    
    if (!items || items.length === 0 || donations.value.length >= total.value) {
      hasMore.value = false
    }
  } catch (e) {
    console.error('Error loading donations:', e)
    notifications.error('Error al cargar aportaciones')
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMembers() {
  try {
    const response = await api.members.getAll({ skip: 0, limit: 100 })
    const data = response.data
    members.value = data.items || data || []
  } catch (e) {
    console.error('Error loading members:', e)
  }
}

function setupObserver() {
  if (observer) observer.disconnect()
  
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loadingMore.value && !loading.value && !filters.month && !filters.status) {
      loadDonations(true)
    }
  }, { rootMargin: '100px' })
  
  nextTick(() => {
    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  })
}

function openModal() {
  showNewMember.value = false
  newMemberName.value = ''
  formData.value = { member_id: null, amount: null }
  dialog.value = true
}

function closeModal() {
  dialog.value = false
  showNewMember.value = false
  newMemberName.value = ''
}

function toggleNewMember() {
  showNewMember.value = !showNewMember.value
  if (showNewMember.value) {
    formData.value.member_id = null
    nextTick(() => {
      newMemberInput.value?.focus()
    })
  }
}

function onMemberChange() {
  if (formData.value.member_id) {
    showNewMember.value = false
  }
}

async function save() {
  if (!formValid.value) return
  
  saving.value = true
  try {
    let memberId = formData.value.member_id
    
    if (showNewMember.value && newMemberName.value) {
      const memberResponse = await api.members.create({ name: newMemberName.value })
      memberId = memberResponse.data.id
      const newMember = memberResponse.data
      members.value.unshift(newMember)
    }

    const currentMonth = new Date()
    const month = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
    
    const response = await api.donations.create({
      member_id: memberId,
      amount: parseFloat(formData.value.amount),
      month: month
    })
    
    if (response.data?.alert) {
      notifications.warning(response.data.alert)
    } else {
      notifications.success('Aportación registrada')
    }
    closeModal()
    loadDonations()
  } catch (e) {
    console.error('Error saving donation:', e)
    const message = e.response?.data?.detail || 'Error al registrar aportación'
    notifications.error(message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  currentPeriod.value = getCurrentMonth()
  currentPeriodDisplay.value = formatMonth(currentPeriod.value)
  periods.value = getYearMonths()
  
  await loadMembers()
  await loadDonations()
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.donations-view {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 100px;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  flex: 1;
}

@media (max-width: 600px) {
  .filters {
    flex-wrap: wrap;
  }
  
  .filter-select {
    flex: 1 1 45%;
  }
}
</style>