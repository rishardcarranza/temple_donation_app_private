<template>
  <v-app>
    <router-view />
  </v-app>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(async () => {
  if (!auth.token && auth.refreshToken) {
    await auth.refresh()
  }
})
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>