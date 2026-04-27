<template>
  <div class="dashboard">
    <v-row>
      <v-col cols="12">
        <v-card color="primary" class="pa-3">
          <v-select
            v-model="selectedPeriod"
            :items="periodOptions"
            item-title="title"
            item-value="value"
            hide-details
            density="compact"
            variant="solo-filled"
            bg-color="white"
            color="primary"
            class="period-select"
            prepend-inner-icon="mdi-calendar-clock"
            @update:model-value="loadProgress"
          >
            <template v-slot:label>
              <span class="text-white font-weight-medium" style="display: block;">Periodo</span>
            </template>
          </v-select>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <v-card class="pa-4 h-100">
          <div class="text-center">
            <v-icon size="24" color="primary" class="mb-2">mdi-target</v-icon>
            <div class="text-caption text-muted mb-1">Meta del Mes</div>
            <div class="text-h5 font-weight-bold text-primary">${{ progress?.goal || 0 }}</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card class="pa-4 h-100">
          <div class="text-center">
            <v-icon size="24" color="success" class="mb-2">mdi-cash-multiple</v-icon>
            <div class="text-caption text-muted mb-1">Total Recaudado</div>
            <div class="text-h5 font-weight-bold text-success">${{ progress?.current_amount || 0 }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between mb-2">
            <span class="font-weight-medium">Progreso</span>
            <span class="font-weight-bold" :style="{ color: progressColor }">{{ progress?.percentage || 0 }}%</span>
          </div>
          <v-progress-linear
            :model-value="progress?.percentage || 0"
            :color="progressColor"
            height="12"
            rounded
            class="mb-2"
          />
          <div class="text-caption text-muted text-center">
            ${{ progress?.current_amount || 0 }} de ${{ progress?.goal || 0 }} meta
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card 
          to="/pending" 
          :disabled="pendingCount === 0" 
          link 
          class="pa-4"
          :class="{ 'cursor-pointer': pendingCount > 0 }"
        >
          <div class="d-flex align-center">
            <v-avatar color="accent" size="48" class="mr-3">
              <v-icon color="white">mdi-clock-alert</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-medium">Aportaciones Pendientes</div>
            </div>
            <v-spacer />
            <v-badge 
              :content="pendingCount" 
              color="accent"
              v-if="pendingCount > 0"
            />
            <v-icon v-else color="success">mdi-check-circle</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center mb-3">
            <h3 class="text-h6 font-weight-medium">Últimas Aportaciones</h3>
            <v-btn variant="text" color="primary" size="small" to="/donations">
              Ver todas
              <v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
          <v-list v-if="recentDonations.length > 0" class="pa-0">
            <v-list-item 
              v-for="d in recentDonations" 
              :key="d.id" 
              class="px-0 py-2"
            >
              <template v-slot:prepend>
                <v-avatar :color="getAvatarColor(d.status)" size="40" class="mr-3">
                  <span class="text-white font-weight-bold">{{ getInitials(d) }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ getMemberName(d) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                ${{ d.amount }} • {{ formatMonth(d.month) }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip
                  :color="getStatusColor(d.status)"
                  size="small"
                  label
                >
                  {{ getStatusLabel(d.status) }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-6 text-muted">
            <v-icon size="48" class="mb-2">mdi-cash-off</v-icon>
            <div>No hay aportaciones recientes</div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api'
import { getCurrentMonth, formatMonth } from '@/utils/date'

const progress = ref(null)
const pendingCount = ref(0)
const recentDonations = ref([])
const members = ref([])
const periods = ref([])
const selectedPeriod = ref('')

const periodOptions = computed(() => {
  return periods.value.map(p => ({
    title: p.month_display || formatMonth(p.month),
    value: p.month
  }))
})

async function loadPeriods() {
  try {
    const res = await api.periods.getAll()
    periods.value = res.data.periods || []
    if (periods.value.length > 0) {
      const current = getCurrentMonth()
      const found = periods.value.find(p => p.month === current)
      selectedPeriod.value = found ? current : periods.value[0].month
    }
  } catch (e) {
    console.error('Error loading periods:', e)
  }
}

async function loadProgress() {
  try {
    const res = await api.donations.getProgress(selectedPeriod.value || undefined)
    progress.value = res.data
  } catch (e) {
    console.error('Error loading progress:', e)
  }
}

const progressColor = computed(() => {
  const pct = progress.value?.percentage || 0
  if (pct >= 50) return '#1D9E75'
  if (pct >= 25) return '#F4C430'
  return '#E24B4A'
})

function getMemberName(donation) {
  const member = members.value.find(m => m.id === donation.member_id)
  return member?.name || 'Miembro'
}

function getInitials(donation) {
  const name = getMemberName(donation)
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getAvatarColor(status) {
  if (status === 'approved') return '#1D9E75'
  if (status === 'rejected') return '#E24B4A'
  return '#F4C430'
}

function getStatusColor(status) {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'warning'
}

function getStatusLabel(status) {
  if (status === 'approved') return 'Aprobada'
  if (status === 'rejected') return 'Rechazada'
  return 'Pendiente'
}

async function loadData() {
  try {
    const [donationsRes, pendingRes, membersRes] = await Promise.all([
      api.donations.getAll({ page: 1, size: 20 }),
      api.donations.getAll({ status: 'pending' }),
      api.members.getAll({ skip: 0, limit: 100 })
    ])
    
    const donationsData = donationsRes.data
    const allDonations = donationsData.items || donationsData || []
    const approvedDonations = allDonations.filter(d => d.status === 'approved')
    recentDonations.value = approvedDonations.slice(0, 5)
    
    const pendingData = pendingRes.data
    pendingCount.value = pendingData.total || pendingData.items?.length || 0
    
    const membersData = membersRes.data
    members.value = membersData.items || membersData || []
  } catch (e) {
    console.error('Error loading dashboard data:', e)
  }
}

onMounted(async () => {
  await loadPeriods()
  await loadProgress()
  await loadData()
})
</script>

<style scoped>
.period-select {
  width: 100%;
}

.period-select:deep(.v-field) {
  background: rgba(255,255,255,0.15) !important;
  border-radius: 8px;
}

.period-select:deep(.v-label) {
  color: rgba(255,255,255,0.9) !important;
  font-size: 1.1rem;
}

.period-select:deep(.v-field__input) {
  color: white !important;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 8px;
}

.period-select:deep(.v-icon) {
  color: white !important;
  font-size: 1.3rem;
}

.period-select:deep(.v-field__wrapper) {
  padding-top: 0 !important;
}
</style>