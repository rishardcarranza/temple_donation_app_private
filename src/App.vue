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
:root {
  --color-primary: #0A3D1F;
  --color-primary-light: #0F6E56;
  --color-surface-soft: #E1F5EE;
  --color-accent: #F4C430;
  --color-success: #1D9E75;
  --color-danger: #E24B4A;
  --color-background: #FFFFFF;
  --color-surface-alt: #F5F7FA;
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #6B7280;
  --border-radius-sm: 8px;
  --border-radius-lg: 12px;
  --border-subtle: 0.5px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family);
  background-color: var(--color-background);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.v-application {
  font-family: var(--font-family) !important;
}

.v-card {
  border: var(--border-subtle) solid #E5E7EB !important;
  border-radius: var(--border-radius-lg) !important;
}

.v-btn {
  min-height: 48px !important;
  text-transform: none !important;
  font-weight: 500 !important;
  letter-spacing: 0 !important;
}

.v-text-field .v-field {
  border-radius: var(--border-radius-sm) !important;
}

.v-chip {
  font-weight: 500 !important;
}

.text-muted {
  color: var(--color-text-secondary) !important;
}
</style>