<template>
  <div class="pending-view">
    <v-row>
      <v-col cols="12">
        <v-card color="primary" dark class="pa-4">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-h6 font-weight-bold">Pendientes</div>
              <div class="text-caption">Total pendientes: {{ pending.length }}</div>
            </div>
            <v-icon size="32" v-if="pending.length > 0">mdi-bell-ring</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </v-col>
    </v-row>

    <v-row v-else-if="pending.length === 0">
      <v-col cols="12">
        <v-card class="pa-8 text-center">
          <v-icon size="48" color="success">mdi-check-circle</v-icon>
          <div class="text-h6 mt-2">No hay aportaciones pendientes</div>
          <div class="text-muted">Todas las aportaciones han sido procesadas</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" v-for="d in pending" :key="d.id">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="warning" size="48" class="mr-3">
              <v-icon color="white">mdi-clock</v-icon>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-medium">{{ getMemberName(d.member_id) }}</div>
              <div class="text-caption text-muted">Periodo: {{ formatMonth(d.month) }}</div>
              <div class="text-caption text-muted">Ingresado por: {{ getRegisteredBy(d) }}</div>
              <div class="text-caption text-muted">Fecha: {{ formatDate(d.created_at) }}</div>
            </div>
            <div class="text-right">
              <div class="text-h5 font-weight-bold text-primary">${{ d.amount }}</div>
              <v-chip color="warning" size="small">Pendiente</v-chip>
            </div>
          </div>
          <div class="d-flex mt-3 gap-2">
            <v-btn color="error" variant="outlined" @click="openRejectDialog(d)" class="flex-grow-1">
              <v-icon start>mdi-close</v-icon>
              Rechazar
            </v-btn>
            <v-btn color="success" @click="approve(d)" :loading="approvingId === d.id" class="flex-grow-1">
              <v-icon start>mdi-check</v-icon>
              Aprobar
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="rejectDialog" max-width="350" persistent>
      <v-card>
        <v-card-title class="pa-4 font-weight-bold">
          Rechazar Donation
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <div class="mb-3">
            <strong>{{ getMemberName(rejectingDonation?.member_id) }}</strong> - ${{ rejectingDonation?.amount }}
          </div>
          <v-textarea
            v-model="rejectReason"
            label="Motivo (opcional)"
            rows="3"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="closeRejectDialog()">Cancelar</v-btn>
          <v-btn color="error" :loading="rejecting" @click="reject()">Rechazar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'
import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()

const pending = ref([])
const members = ref([])
const loading = ref(false)
const approvingId = ref(null)
const rejectDialog = ref(false)
const rejecting = ref(false)
const rejectingDonation = ref(null)
const rejectReason = ref('')

function formatMonth(month) {
  if (!month) return ''
  const [year, m] = month.split('-')
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  return `${months[parseInt(m) - 1]}-${year}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

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

async function loadPending() {
  loading.value = true
  try {
    const response = await api.donations.getAll({ status: 'pending' })
    const data = response.data
    pending.value = data.items || data || []
    
    const memberIds = [...new Set(pending.value.map(d => d.member_id))]
    for (const id of memberIds) {
      try {
        const memberRes = await api.members.getById(id)
        const member = memberRes.data
        if (member && !members.value.find(m => m.id === member.id)) {
          members.value.push(member)
        }
      } catch (e) {
        console.error('Error loading member:', id, e)
      }
    }
  } catch (e) {
    console.error('Error loading pending:', e)
    notifications.error('Error al cargar aportaciones pendientes')
  } finally {
    loading.value = false
  }
}

async function approve(donation) {
  approvingId.value = donation.id
  try {
    await api.donations.approve(donation.id)
    notifications.success('Aportación aprobada')
    loadPending()
  } catch (e) {
    console.error('Error approving:', e)
    notifications.error('Error al aprobar aportación')
  } finally {
    approvingId.value = null
  }
}

function openRejectDialog(donation) {
  rejectingDonation.value = donation
  rejectReason.value = ''
  rejectDialog.value = true
}

function closeRejectDialog() {
  rejectDialog.value = false
  rejectingDonation.value = null
  rejectReason.value = ''
}

async function reject() {
  if (!rejectingDonation.value) return
  
  rejecting.value = true
  try {
    const motivo = rejectReason.value || ''
    await api.donations.reject(rejectingDonation.value.id, motivo)
    notifications.success('Aportación rechazada')
    closeRejectDialog()
    loadPending()
  } catch (e) {
    console.error('Error rejecting:', e)
    notifications.error('Error al rechazar donation')
  } finally {
    rejecting.value = false
  }
}

onMounted(() => {
  loadPending()
})
</script>

<style scoped>
.pending-view {
  max-width: 600px;
  margin: 0 auto;
}

.gap-2 {
  display: flex;
  gap: 8px;
}
</style>