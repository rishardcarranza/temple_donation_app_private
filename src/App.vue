<template>
  <v-app>
    <router-view />
    <v-snackbar
      v-model="needRefresh"
      :timeout="-1"
      color="primary"
      location="bottom"
    >
      Nueva actualización disponible.
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="updateSW()">
          Actualizar
        </v-btn>
        <v-btn color="white" variant="text" @click="needRefresh = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { registerSW } from 'virtual:pwa-register'

const needRefresh = ref(false)
let updateSW = () => {}

onMounted(() => {
  try {
    const update = registerSW({
      onNeedRefresh() {
        needRefresh.value = true
      }
    })
    updateSW = () => {
      if (update) update(true)
    }
  } catch (error) {
    console.warn('PWA registration failed:', error)
  }
})
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>