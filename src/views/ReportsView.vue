<template>
  <div class="reports-view">
    <v-row class="mb-3">
      <v-col cols="12">
        <v-select
          v-model="selectedMonth"
          :items="months"
          item-title="display"
          item-value="value"
          label="Período"
          hide-details
          density="compact"
          bg-color="white"
          class="filter-select"
          @update:model-value="onPeriodChange"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="6">
        <v-card class="pa-4 h-100">
          <div class="text-center">
            <v-icon size="24" color="primary" class="mb-2">mdi-cash</v-icon>
            <div class="text-caption text-muted mb-1">Total Acumulado</div>
            <div class="text-h5 font-weight-bold text-primary">${{ accumulated?.total_amount || 0 }}</div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card class="pa-4 h-100">
          <div class="text-center">
            <v-icon size="24" color="success" class="mb-2">mdi-account-check</v-icon>
            <div class="text-caption text-muted mb-1">Miembros</div>
            <div class="text-h5 font-weight-bold text-success">{{ stats?.total_members || 0 }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2 pb-8">
      <v-col cols="12">
        <v-card class="pa-4">
          <div class="text-h6 font-weight-medium mb-3">Historial (Últimos 6 meses)</div>
          <div v-if="chartData" style="height: 250px">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
          <div v-else class="text-center py-6 text-muted">
            <v-icon size="48" class="mb-2">mdi-chart-bar</v-icon>
            <div>No hay datos disponibles</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-2">
      <v-col cols="12">
        <v-card class="pa-4">
          <div class="d-flex justify-space-between align-center mb-3">
            <div class="text-h6 font-weight-medium">Detalle del Período</div>
            <v-btn
              color="primary"
              variant="outlined"
              density="compact"
              @click="exportToCsv"
            >
              Exportar
            </v-btn>
          </div>
          
          <v-data-table
            v-if="reportItems.length > 0"
            :headers="tableHeaders"
            :items="reportItems"
            density="compact"
            class="elevation-0"
            :items-per-page="10"
          >
            <template v-slot:item.amount="{ item }">
              ${{ item.amount }}
            </template>
            <template v-slot:item.month="{ item }">
              <v-chip size="small" variant="tonal" color="primary">
                {{ formatMonth(item.month) }}
              </v-chip>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
                label
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
            </template>
            <template v-slot:item.member="{ item }">
              {{ getMemberName(item.member_id) }}
            </template>
            <template v-slot:item.created_at="{ item }">
              <span class="text-no-wrap">{{ formatDate(item.created_at) }}</span>
            </template>
          </v-data-table>
          
          <div v-else class="text-center py-6 text-muted">
            <v-icon size="48" class="mb-2">mdi-file-table</v-icon>
            <div>No hay aportaciones en este período</div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import api from '@/api'
import { getYearMonths, getCurrentMonth, formatMonth } from '@/utils/date'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const selectedMonth = ref('')
const months = ref([])
const reportItems = ref([])
const accumulated = ref(null)
const stats = ref(null)
const members = ref([])
const periods = ref([])
const last6Months = ref(null)


const tableHeaders = [
  { title: 'Miembro', key: 'member', sortable: true },
  { title: 'Período', key: 'month', sortable: true },
  { title: 'Monto', key: 'amount', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Fecha (Registro)', key: 'created_at', sortable: true }
]

const chartData = computed(() => {
  if (!last6Months.value || last6Months.value.length === 0) return null
  const monthlyData = (last6Months.value || []).slice().reverse()
  return {
    labels: monthlyData.map(m => m.month_display || formatMonth(m.month)),
    datasets: [{
      label: 'Total Aportado',
      backgroundColor: '#1B5E20',
      data: monthlyData.map(m => m.total_amount || 0)
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: (value) => '$' + value
      }
    }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
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

function getMemberName(memberId) {
  const member = members.value.find(m => m.id === memberId)
  return member?.name || 'Miembro'
}

async function onPeriodChange() {
  await Promise.all([
    loadReport(),
    loadAccumulated(),
    loadStats()
  ])
}

async function loadReport() {
  try {
    const res = await api.donations.getAll({ 
      month: selectedMonth.value,
      page: 1,
      size: 100
    })
    const data = res.data
    reportItems.value = data.items || data || []
  } catch (e) {
    console.error('Error loading report:', e)
    reportItems.value = []
  }
}

async function loadAccumulated() {
  try {
    const res = await api.donations.getAccumulated(selectedMonth.value)
    accumulated.value = res.data || {}
  } catch (e) {
    console.error('Error loading accumulated:', e)
    accumulated.value = {}
  }
}

async function loadStats() {
  try {
    const res = await api.donations.getStats(selectedMonth.value)
    stats.value = res.data || {}
  } catch (e) {
    console.error('Error loading stats:', e)
    stats.value = {}
  }
}

async function loadLast6Months() {
  try {
    const res = await api.donations.getLast6Months()
    const data = res.data
    last6Months.value = data.periods || data || []
  } catch (e) {
    console.error("Error loading last 6 months:", e)
    last6Months.value = []
  }
}

async function loadPeriods() {
  try {
    const res = await api.periods.getAll()
    periods.value = res.data || []
    if (periods.value.length > 0) {
      const active = periods.value.find(p => p.is_active)
      selectedMonth.value = active ? active.month : periods.value[0].month
    }
  } catch (e) {
    console.error('Error loading periods:', e)
    periods.value = []
  }
}

async function loadMembers() {
  try {
    const res = await api.members.getAll({ page: 1, size: 100 })
    const data = res.data
    members.value = data.items || data || []
  } catch (e) {
    console.error('Error loading members:', e)
    members.value = []
  }
}

function exportToCsv() {
  const headers = ['Miembro', 'Monto', 'Estado', 'Fecha']
  const rows = reportItems.value.map(item => [
    getMemberName(item.member_id),
    item.amount,
    getStatusLabel(item.status),
    formatDate(item.created_at)
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `reportes_${selectedMonth.value}.csv`
  link.click()
}

onMounted(async () => {
  months.value = getYearMonths()
  await loadPeriods()
  await loadMembers()
  await loadLast6Months()
  await onPeriodChange()
})
</script>

<style scoped>
.reports-view {
  max-width: 600px;
  margin: 0 auto;
}

.filter-select {
  max-width: 200px;
}

@media (max-width: 600px) {
  .filter-select {
    max-width: 100%;
  }
}
</style>