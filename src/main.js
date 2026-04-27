import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#0A3D1F',
          secondary: '#0F6E56',
          accent: '#F4C430',
          success: '#1D9E75',
          error: '#E24B4A',
          warning: '#F4C430',
          background: '#FFFFFF',
          surface: '#F5F7FA',
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-background': '#1A1A2E',
          'on-surface': '#1A1A2E',
        }
      }
    }
  },
  defaults: {
    VCard: {
      rounded: 'lg',
    },
    VBtn: {
      rounded: 'lg',
      height: 48,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
    },
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')