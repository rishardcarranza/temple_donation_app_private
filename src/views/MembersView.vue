<template>
  <div class="members-view">
    <v-row class="mb-3">
      <v-col cols="12">
        <div class="d-flex gap-2 align-center">
          <v-text-field
            v-model="search"
            label="Buscar miembro"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            density="comfortable"
            bg-color="white"
            @keyup.enter="loadMembers()"
          />
          <v-btn color="primary" @click="loadMembers()" :loading="loading">
            <v-icon>mdi-magnify</v-icon>
          </v-btn>
        </div>
        <div class="text-caption text-muted mt-1">
          Total: {{ total }} miembros
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

    <v-row v-else-if="members.length === 0">
      <v-col cols="12">
        <v-card class="pa-8 text-center">
          <v-icon size="48" color="grey">mdi-account-group</v-icon>
          <div class="text-h6 mt-2">No hay miembros</div>
          <div class="text-muted">Agrega el primer miembro</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12" v-for="member in members" :key="member.id">
        <v-card class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="48" class="mr-3">
              <span class="text-white font-weight-bold">{{ getInitials(member.name) }}</span>
            </v-avatar>
            <div class="flex-grow-1">
              <div class="text-h6 font-weight-medium">{{ member.name }}</div>
              <div class="text-caption text-muted">{{ member.code }}</div>
              <div class="text-caption text-muted" v-if="member.phone">
                <v-icon size="small">mdi-phone</v-icon> {{ member.phone }}
              </div>
            </div>
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn icon v-bind="props" variant="text">
                  <v-icon>mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item @click="openModal(member)">
                  <template v-slot:prepend>
                    <v-icon size="small">mdi-pencil</v-icon>
                  </template>
                  <v-list-item-title>Editar</v-list-item-title>
                </v-list-item>
                <v-list-item @click="confirmDelete(member)" class="text-error">
                  <template v-slot:prepend>
                    <v-icon size="small" color="error">mdi-delete</v-icon>
                  </template>
                  <v-list-item-title>Eliminar</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
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
          {{ editingMember ? 'Editar Miembro' : 'Nuevo Miembro' }}
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.name"
              label="Nombre *"
              :rules="[v => !!v || 'El nombre es requerido', v => v.length >= 2 || 'Mínimo 2 caracteres']"
              required
              class="mb-2"
            />
            <v-text-field
              v-model="formData.phone"
              label="Teléfono"
              type="tel"
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

    <v-dialog v-model="deleteDialog" max-width="350">
      <v-card>
        <v-card-title class="pa-4 font-weight-bold">
          Eliminar a {{ deletingMember?.name }}?
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          Esta acción no se puede deshacer.
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteMember()">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import api from '@/api'
import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()

const members = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const saving = ref(false)
const deleting = ref(false)
const formValid = ref(false)
const form = ref(null)

const page = ref(1)
const size = 10
const hasMore = ref(true)
const sentinel = ref(null)
const total = ref(0)
let observer = null

const editingMember = ref(null)
const deletingMember = ref(null)

const formData = ref({
  name: '',
  phone: ''
})

function getInitials(name) {
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

async function loadMembers(loadMore = false) {
  if (loadMore) {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    page.value++
  } else {
    loading.value = true
    page.value = 1
    members.value = []
    hasMore.value = true
  }
  
  try {
    const skip = (page.value - 1) * size
    const params = { skip, limit: size }
    if (search.value) params.name = search.value
    
    const response = await api.members.getAll(params)
    const data = response.data
    const items = data.items || []
    total.value = data.total || 0
    
    if (loadMore) {
      members.value.push(...items)
    } else {
      members.value = items
    }
    
    if (!items || items.length === 0 || members.value.length >= total.value) {
      hasMore.value = false
    }
  } catch (e) {
    notifications.error('Error al cargar miembros')
    hasMore.value = false
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function setupObserver() {
  if (observer) observer.disconnect()
  
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore.value && !loadingMore.value && !loading.value) {
      loadMembers(true)
    }
  }, { rootMargin: '100px' })
  
  nextTick(() => {
    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  })
}

function openModal(member = null) {
  editingMember.value = member
  if (member) {
    formData.value = { name: member.name, phone: member.phone || '' }
  } else {
    formData.value = { name: '', phone: '' }
  }
  dialog.value = true
}

function closeModal() {
  dialog.value = false
  editingMember.value = null
  formData.value = { name: '', phone: '' }
}

async function save() {
  if (!formValid.value) return
  
  saving.value = true
  try {
    if (editingMember.value) {
      await api.members.update(editingMember.value.id, formData.value)
      notifications.success('Miembro actualizado')
    } else {
      await api.members.create(formData.value)
      notifications.success('Miembro creado')
    }
    closeModal()
    loadMembers()
  } catch (e) {
    console.error('Error saving member:', e)
    const message = e.response?.data?.detail || 'Error al guardar miembro'
    notifications.error(message)
  } finally {
    saving.value = false
  }
}

function confirmDelete(member) {
  deletingMember.value = member
  deleteDialog.value = true
}

async function deleteMember() {
  if (!deletingMember.value) return
  
  deleting.value = true
  try {
    await api.members.delete(deletingMember.value.id)
    notifications.success('Miembro eliminado')
    deleteDialog.value = false
    deletingMember.value = null
    loadMembers()
  } catch (e) {
    console.error('Error deleting member:', e)
    const message = e.response?.data?.detail || 'Error al eliminar miembro'
    notifications.error(message)
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  loadMembers()
  setupObserver()
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.members-view {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 100px;
}

.gap-2 {
  display: flex;
  gap: 8px;
  align-items: center;
}

.gap-2 .v-text-field {
  flex: 1;
}
</style>