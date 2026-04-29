<template>
  <v-app>
    <router-view />
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
import { computed } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const notifications = useNotificationsStore()

const snackbarVisible = computed({
  get: () => notifications.show && notifications.message.length > 0,
  set: (val) => { if (!val) notifications.clear() }
})
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>