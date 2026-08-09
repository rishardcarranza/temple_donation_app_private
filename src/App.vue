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
        <v-btn color="white" variant="text" @click="updateServiceWorker()">
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
import { useRegisterSW } from 'virtual:pwa-register/vue'

const {
  needRefresh,
  updateServiceWorker,
} = useRegisterSW()
</script>

<style>
html {
  overflow-y: auto !important;
}
</style>