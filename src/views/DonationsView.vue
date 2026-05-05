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
         <div class="text-caption text-muted mt-1 mb-2">
           Mostrando {{ donations.length }} de {{ total }} aportaciones | Monto: ${{ donationsTotal.toFixed(2) }}
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
       <v-col cols="12" class="text-center py-12">
         <v-progress-circular indeterminate color="primary" size="64" width="6" />
         <div class="text-caption text-muted mt-2">Cargando aportaciones...</div>
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
               <v-chip :color="getStatusColor(d.status)" size="small" class="mr-2">
                 {{ getStatusLabel(d.status) }}
               </v-chip>
               <v-menu offset-y>
                 <template v-slot:activator="{ props, on }">
                   <v-btn icon v-bind="props" v-on="on" variant="text" :disabled="updating">
                     <v-icon>mdi-dots-vertical</v-icon>
                   </v-btn>
                 </template>
                 <v-list style="width: 200px">
                   <v-list-item v-if="d.status === 'pending'" @click="changeStatus(d, 'approved')">
                     <template v-slot:prepend>
                       <v-icon size="small">mdi-check</v-icon>
                     </template>
                     <v-list-item-title>Aprobar</v-list-item-title>
                   </v-list-item>
                   <v-list-item v-if="d.status === 'pending'" @click="openRejectDialog(d)">
                     <template v-slot:prepend>
                       <v-icon size="small" color="error">mdi-close</v-icon>
                     </template>
                     <v-list-item-title>Rechazar</v-list-item-title>
                   </v-list-item>
                   <v-list-item v-if="d.status === 'approved'" @click="openRejectDialog(d)">
                     <template v-slot:prepend>
                       <v-icon size="small" color="error">mdi-close</v-icon>
                     </template>
                     <v-list-item-title>Rechazar</v-list-item-title>
                   </v-list-item>
                   <v-list-item v-if="d.status === 'rejected'" @click="changeStatus(d, 'approved')">
                     <template v-slot:prepend>
                       <v-icon size="small">mdi-check</v-icon>
                     </template>
                     <v-list-item-title>Aprobar</v-list-item-title>
                   </v-list-item>
                   <v-list-item v-if="d.status === 'rejected'" @click="changeStatus(d, 'pending')">
                     <template v-slot:prepend>
                       <v-icon size="small">mdi-clock</v-icon>
                     </template>
                     <v-list-item-title>Pendiente</v-list-item-title>
                   </v-list-item>
                 </v-list>
               </v-menu>
             </div>
           </div>
         </v-card>
       </v-col>
     </v-row>
     
     <!-- Load More Button -->
     <v-row v-if="hasMore && !loading" class="mt-3 mb-6">
       <v-col cols="12" class="text-center">
         <v-btn 
           color="primary" 
           variant="outlined"
           :loading="loadingMore"
           :disabled="loadingMore"
           @click="loadDonations(true)"
         >
           Cargar más ({{ total - donations.length }} restantes)
         </v-btn>
       </v-col>
     </v-row>
     
     <v-row v-if="loadingMore">
       <v-col cols="12" class="text-center py-4">
         <v-progress-circular indeterminate color="primary" size="32" width="4" />
         <div class="text-caption text-muted mt-1">Cargando más...</div>
       </v-col>
     </v-row>
    
    

     <v-dialog v-model="dialog" max-width="400" persistent>
       <v-card>
         <v-card-title class="pa-4 font-weight-bold">
           Registrar Aportación
         </v-card-title>
         <v-card-text class="pa-4 pt-0">
           <v-select
             v-model="formData.period"
             label="Período"
             :items="periods"
             item-title="display"
             item-value="value"
             :rules="[v => !!v || 'El período es requerido']"
             required
             class="mb-3"
           />
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
                  Guardar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
   </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
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
const rejectFormValid = ref(false)
const rejectForm = ref(null)
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
const donationsTotal = ref(0)
const activePeriod = ref(null)

const filters = reactive({
   month: null,
   status: null
})

const formData = ref({
   member_id: null,
   amount: null,
   period: null
})

const statusOptions = [
  { text: 'Aprobada', value: 'approved' },
  { text: 'Pendiente', value: 'pending' },
  { text: 'Rechazada', value: 'rejected' }
]

const periods = ref([])

// State for status change functionality
const rejectDialog = ref(false)
const updating = ref(false)
const selectedDonation = ref(null)
const rejectMotivo = ref('')

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
    // Only reload members on initial load, not on "load more"
    if (!loadMore) {
      await loadMembers()
    }
    
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

      donationsTotal.value = donations.value
      .reduce((sum, d) => sum + parseFloat(d.amount || 0), 0)
      
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



function openModal() {
   showNewMember.value = false
   newMemberName.value = ''
   formData.value = { 
     member_id: null, 
     amount: null, 
     period: activePeriod.value // Default to active period
   }
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

async function openRejectDialog(donation) {
   selectedDonation.value = donation
   rejectMotivo.value = ''
   rejectDialog.value = true
 }

async function closeRejectDialog() {
   rejectDialog.value = false
   selectedDonation.value = null
   rejectMotivo.value = ''
 }

async function confirmReject() {
   if (!selectedDonation.value) return
   
   try {
     updating.value = true
     await api.donations.updateStatus(selectedDonation.value.id, {
       status: 'rejected',
       motivo: rejectMotivo.value || null
     })
     
     // Update local state
     const index = donations.value.findIndex(d => d.id === selectedDonation.value.id)
     if (index !== -1) {
       donations.value[index].status = 'rejected'
       donations.value[index].motivo = rejectMotivo.value || null
     }
     
     closeRejectDialog()
     notifications.success('Aportación rechazada')
   } catch (e) {
     console.error('Error rejecting donation:', e)
     const message = e.response?.data?.detail || 'Error al rechazar aportación'
     notifications.error(message)
   } finally {
     updating.value = false
   }
 }

async function changeStatus(donation, newStatus) {
   try {
     updating.value = true
     await api.donations.updateStatus(donation.id, { status: newStatus })
     
     // Update local state
     const index = donations.value.findIndex(d => d.id === donation.id)
     if (index !== -1) {
       donations.value[index].status = newStatus
       // Clear motivo if changing to approved/pending
       if (newStatus === 'approved' || newStatus === 'pending') {
         donations.value[index].motivo = null
       }
     }
     
     let message = ''
     if (newStatus === 'approved') {
       message = 'Aportación aprobada'
     } else if (newStatus === 'rejected') {
       message = 'Aportación rechazada'
     } else if (newStatus === 'pending') {
       message = 'Aportación marcada como pendiente'
     }
     
     notifications.success(message)
   } catch (e) {
     console.error('Error changing donation status:', e)
     const message = e.response?.data?.detail || 'Error al cambiar estado de aportación'
     notifications.error(message)
   } finally {
     updating.value = false
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

      // Use selected period from form instead of current month
      const month = formData.value.period
      
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
     // Reload members to ensure we have the latest data
     loadMembers()
   } catch (e) {
     console.error('Error saving donation:', e)
     const message = e.response?.data?.detail || 'Error al registrar aportación'
     notifications.error(message)
   } finally {
     saving.value = false
   }
 }

onMounted(async () => {
    // Fetch all periods from API and find the active one
    try {
      const periodsResp = await api.periods.getAll()
      const periodsData = periodsResp.data.items || periodsResp.data || []
      
      // Find the active period
      const activePeriodData = periodsData.find(p => p.is_active === true)
      if (activePeriodData) {
        activePeriod.value = activePeriodData.month
      } else {
        // Fallback to first period or current month if none found
        activePeriod.value = periodsData.length > 0 ? periodsData[0].month : getCurrentMonth()
      }
    } catch (e) {
      console.warn('Could not fetch periods, falling back to current month')
      activePeriod.value = getCurrentMonth()
    }
    
    currentPeriod.value = activePeriod.value
    currentPeriodDisplay.value = formatMonth(currentPeriod.value)
    periods.value = getYearMonths()
    
    // Set the filters.month to the active period after it's loaded
    filters.month = activePeriod.value
    
    await loadMembers()
    await loadDonations()
    // No more setupObserver()
  })

onUnmounted(() => {
   // No observer to clean up anymore
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