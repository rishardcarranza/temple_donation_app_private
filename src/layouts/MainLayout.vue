<template>
  <v-app>
    <v-app-bar app color="primary" flat elevation="0">
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-lg-none" />
      <v-toolbar-title class="font-weight-bold">{{ title }}</v-toolbar-title>
      <v-spacer />
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="mr-2">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list density="compact" class="py-0">
          <v-list-item @click="handleLogout" class="text-error">
            <template v-slot:prepend>
              <v-icon size="small">mdi-logout</v-icon>
            </template>
            <v-list-item-title>Cerrar sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" app class="d-lg-none" color="primary">
      <v-list class="py-4">
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard">
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>
        <v-list-item to="/members" prepend-icon="mdi-account-group">
          <v-list-item-title>Miembros</v-list-item-title>
        </v-list-item>
        <v-list-item to="/donations" prepend-icon="mdi-cash-multiple">
          <v-list-item-title>Aportaciones</v-list-item-title>
        </v-list-item>
        <v-list-item to="/pending" prepend-icon="mdi-clock-alert">
          <v-list-item-title>Pendientes</v-list-item-title>
        </v-list-item>
        <v-list-item to="/reports" prepend-icon="mdi-chart-bar">
          <v-list-item-title>Reportes</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="bg-surface-alt" :style="{ paddingBottom: '72px' }">
      <v-container fluid class="pa-4 pb-12">
        <router-view />
      </v-container>
    </v-main>

    <v-bottom-navigation v-model="activeNav" grow class="d-lg-none bg-white fixed-bottom" elevation="4">
      <v-btn to="/dashboard" value="dashboard" color="primary">
        <v-icon>mdi-home</v-icon>
        <span class="text-caption mt-1">Home</span>
      </v-btn>
      <v-btn to="/donations" value="donations" color="primary">
        <v-icon>mdi-cash-multiple</v-icon>
        <span class="text-caption mt-1">Aportaciones</span>
      </v-btn>
      <v-btn to="/pending" value="pending" color="primary">
        <v-badge :content="pendingCount" color="accent" :model-value="pendingCount > 0">
          <v-icon>mdi-clock-alert</v-icon>
        </v-badge>
        <span class="text-caption mt-1">Pendientes</span>
      </v-btn>
      <v-btn to="/reports" value="reports" color="primary">
        <v-icon>mdi-chart-bar</v-icon>
        <span class="text-caption mt-1">Reportes</span>
      </v-btn>
      <v-btn to="/members" value="members" color="primary">
        <v-icon>mdi-account-group</v-icon>
        <span class="text-caption mt-1">Miembros</span>
      </v-btn>
    </v-bottom-navigation>

    <v-snackbar
      v-model="snackbarVisible"
      :color="notifications.type"
      :timeout="3000"
      location="top"
    >
      {{ notifications.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationsStore } from '@/stores/notifications'
import api from '@/api'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const notifications = useNotificationsStore()

const drawer = ref(false)
const activeNav = ref('dashboard')
const pendingCount = ref(0)
const title = import.meta.env.VITE_APP_TITLE || 'Admin Templo'

const snackbarVisible = computed({
  get: () => notifications.show && notifications.message.length > 0,
  set: (val) => { if (!val) notifications.clear() }
})

const navItems = ['Dashboard', 'Donations', 'Pending', 'Reports', 'Members']

watch(() => route.name, (name) => {
  if (navItems.includes(name)) {
    activeNav.value = name.toLowerCase()
  }
}, { immediate: true })

async function loadPendingCount() {
  try {
    const response = await api.donations.getAll({ status: 'pending' })
    pendingCount.value = response.data.length
  } catch (e) {
    console.error('Error loading pending count:', e)
  }
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  loadPendingCount()
})
</script>

<style scoped>
.bg-surface-alt {
  background-color: var(--color-surface-alt) !important;
}

.fixed-bottom {
  position: fixed !important;
  bottom: 0 !important;
  width: 100% !important;
  z-index: 100 !important;
}

.v-bottom-navigation {
  border-top: 0.5px solid #E5E7EB !important;
}

.v-app-bar {
  border-bottom: 0.5px solid #E5E7EB !important;
}

.v-main {
  min-height: 100vh;
}
</style>