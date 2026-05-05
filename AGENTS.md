# 🔐 AGENTS.md — App Privada: Aportaciones Templo Admin

## Descripción
Panel de administración PWA para el líder de la iglesia. Permite gestionar miembros, registrar aportaciones manualmente, aprobar o rechazar aportaciones enviadas por el público, configurar el periodo activo y consultar reportes mensuales. Acceso con autenticación JWT. Diseño Mobile First, instalable como PWA (funciona correctamente en iOS Safari).

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Vue 3 (Composition API) |
| Build tool | Vite |
| PWA | vite-plugin-pwa |
| UI Components | Vuetify 3 |
| Estado global | Pinia |
| HTTP client | Axios |
| Router | Vue Router 4 (hash mode para PWA iOS) |
| Gráficas | Chart.js + vue-chartjs |
| Lenguaje | JavaScript (sin TypeScript) |
| Utilidades | src/utils/date.js (format Month, getCurrentMonth, getYearMonths) |

---

## Estructura de Carpetas

```
aportaciones-templo-admin/
├── public/
│   ├── favicon.ico
│   └── icons/                      # Íconos PWA (192x192, 512x512)
├── src/
│   ├── main.js                     # Entrada: Vue + Vuetify + Pinia + Router
│   ├── App.vue
│   │
│   ├── router/
│   │   └── index.js                # Rutas con guards de autenticación
│   │
│   ├── stores/
│   │   ├── auth.js                 # Token JWT, usuario actual, login/logout
│   │   └── notifications.js        # Snackbars / alertas globales
│   │
│   ├── api/
│   │   └── index.js                # Instancia axios + interceptor JWT
│   │
│   ├── utils/
│   │   └── date.js                # Funciones de fecha (getCurrentMonth, formatMonth, getYearMonths)
│   │
│   ├── layouts/
│   │   ├── AuthLayout.vue          # Layout simple para pantalla de login
│   │   └── MainLayout.vue          # Layout con nav drawer + header
│   │
│   └── views/
│       ├── LoginView.vue
│       ├── DashboardView.vue
│       ├── MembersView.vue
│       ├── DonationsView.vue
│       ├── PendingView.vue
│       ├── ReportsView.vue
│       └── SettingsView.vue
│
├── .env
├── .env.example
├── index.html
├── vite.config.js
└── package.json
```

---

## Variables de Entorno

### `.env.example`
```env
VITE_API_BASE_URL=https://api.tu-dominio.com/api/v1
VITE_APP_TITLE=Admin - Aportaciones Templo
```

---

## Configuración Vite + PWA

### `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'Admin - Aportaciones Templo',
        short_name: 'Admin Templo',
        description: 'Panel de administración de aportaciones',
        lang: 'es',
        theme_color: '#0A3D1F',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ],
        categories: ['business', 'productivity'],
        prefer_related_applications: false
      }
    })
  ]
})
```

### `index.html`
```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="/icons/icon-192.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="theme-color" content="#0A3D1F" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <title>Admin Templo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

> **Importante:** Para que funcione como app nativa en iOS Safari:
> - Usar `status-bar-style: default` (no "black-translucent")
> - NO usar `viewport-fit=cover`
> - NO agregar meta tags duplicadas
> - Usar hash mode en el router (`createWebHashHistory()`)

---

## Autenticación JWT

### Flujo
```
LoginView
   │
   ▼
POST /auth/login → { access_token, refresh_token }
   │
   ├── Guardar tokens en Pinia store (auth.js)
   ├── Guardar access_token en memoria y sessionStorage
   ├── Guardar refresh_token en localStorage
   └── Redirigir a /dashboard
```

### Interceptor Axios con Mutex (`src/api/index.js`)
```javascript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

let isRefreshing = false

// Adjuntar token a cada request
api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

// Si expira el token, intentar refresh automático (una sola vez)
api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      if (isRefreshing) return Promise.reject(error)
      
      isRefreshing = true
      const auth = useAuthStore()
      
      try {
        const refreshed = await auth.refresh()
        isRefreshing = false
        
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${auth.token}`
          return api.request(originalRequest)
        }
      } catch (e) {
        isRefreshing = false
      }
      
      // Si falló, redirigir al login
      if (!auth.token) {
        window.location.hash = '#/login'
      }
    }
    return Promise.reject(error)
  }
)

export default {
  auth: {
    login: (email, password) => api.post('/auth/login', { email, password }),
    refresh: (refreshToken) => api.post('/auth/refresh', { refresh_token: refreshToken }),
    logout: () => api.post('/auth/logout')
  },
  public: {
    getInfo: () => api.get('/public/info')
  },
  users: {
    getMe: () => api.get('/users/me')
  },
  members: {
    getAll: (params) => api.get('/members', { params }),
    getById: (id) => api.get(`/members/${id}`),
    create: (data) => api.post('/members', data),
    update: (id, data) => api.patch(`/members/${id}`, data),
    delete: (id) => api.delete(`/members/${id}`)
  },
  periods: {
    getAll: () => api.get('/periods'),
    getActive: () => api.get('/periods/active'),
    create: (data) => api.post('/periods', data),
    setActive: (month) => api.put(`/periods/${month}/activate`)
  },
  donations: {
    getAll: (params) => api.get('/donations', { params }),
    getById: (id) => api.get(`/donations/${id}`),
    create: (data) => api.post('/donations', data),
    approve: (id) => api.patch(`/donations/${id}/approve`),
    reject: (id, motivo) => api.patch(`/donations/${id}/reject`, { motivo }),
    getProgress: (month) => api.get('/donations/progress', { params: { month } }),
    getReport: (month) => api.get('/donations/report', { params: { month } }),
    getByMember: (memberId) => api.get('/donations/by-member', { params: { member_id: memberId } }),
    getTopMembers: (month) => api.get('/donations/top-members', { params: { month } }),
    getAccumulated: (month) => api.get('/donations/accumulated', { params: { month } }),
    getStats: (month) => api.get('/donations/stats', { params: { month } })
  },
  settings: {
    get: () => api.get('/settings'),
    update: (data) => api.patch('/settings', data)
  }
}
```

### Auth Store con Mutex (`src/stores/auth.js`)
```javascript
import { defineStore } from 'pinia'
import api from '@/api'

const getStoredToken = () => {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token')
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getStoredToken(),
    user: null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    isRefreshing: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token
  },

  actions: {
    async login(email, password) {
      const response = await api.auth.login(email, password)
      const data = response.data
      this.token = data.access_token
      this.refreshToken = data.refresh_token
      
      sessionStorage.setItem('access_token', this.token)
      localStorage.setItem('access_token', this.token)
      localStorage.setItem('refresh_token', this.refreshToken)
      return data
    },

    async refresh() {
      if (!this.refreshToken || this.isRefreshing) return false
      this.isRefreshing = true
      try {
        const response = await api.auth.refresh(this.refreshToken)
        const data = response.data
        this.token = data.access_token
        this.refreshToken = data.refresh_token  // Guardar nuevo refresh_token
        
        sessionStorage.setItem('access_token', this.token)
        localStorage.setItem('access_token', this.token)
        localStorage.setItem('refresh_token', this.refreshToken)
        return true
      } catch (e) {
        this.logout()
        return false
      } finally {
        this.isRefreshing = false
      }
    },

    logout() {
      this.token = null
      this.user = null
      this.refreshToken = null
      this.isRefreshing = false
      sessionStorage.removeItem('access_token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
})
```

### Guards de ruta (`src/router/index.js`)
```javascript
router.beforeEach(async (to, from) => {
  const auth = useAuthStore()
  
  // Login: si ya tiene token, ir a dashboard
  if (to.meta.requiresAuth === false) {
    if (auth.token) return '/dashboard'
  }
  
  // Rutas protegidas: intentar refresh si no hay token
  if (to.meta.requiresAuth && !auth.token) {
    if (auth.refreshToken && !auth.isRefreshing) {
      const ok = await auth.refresh()
      if (ok) {
        await auth.fetchUser()
        return true
      }
    }
    if (!auth.token) return '/login'
  }
  
  // Rutas solo para admin
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return '/dashboard'
  }
})
```

### AuthLayout (`src/layouts/AuthLayout.vue`)
Layout para vistas de autenticación (Login). Incluye snackbar para notificaciones:
```vue
<template>
  <v-app>
    <router-view />
    <v-snackbar v-model="snackbarVisible" :color="notifications.type" location="top">
      {{ notifications.message }}
    </v-snackbar>
  </v-app>
</template>
```
```


---

## Rutas

| Ruta | Vista | Auth | Admin | Descripción |
|------|-------|------|-------|-------------|
| `/login` | LoginView | ❌ | ❌ | Pantalla de acceso |
| `/dashboard` | DashboardView | ✅ | ❌ | Resumen y meta del mes |
| `/members` | MembersView | ✅ | ❌ | Gestión de miembros |
| `/donations` | DonationsView | ✅ | ❌ | Ver y registrar aportaciones |
| `/pending` | PendingView | ✅ | ❌ | Aprobar/rechazar aportaciones públicas |
| `/reports` | ReportsView | ✅ | ❌ | Reportes mensuales |
| `/settings` | SettingsView | ✅ | ✅ | Configuración general + Periodo activo |

---

## Vistas en Detalle

### 🏠 Dashboard (`/dashboard`)
- Tarjeta: **Meta del mes** (monto objetivo)
- Tarjeta: **Total recaudado** (aprobadas del mes actual)
- Barra de progreso: % alcanzado de la meta
- Tarjeta: **Aportaciones pendientes** (badge con conteo, link a /pending)
- Lista de las últimas 5 aportaciones aprobadas

### 👥 Miembros (`/members`)
- Tabla/lista de miembros con: nombre, teléfono, estado (activo/inactivo)
- Botón flotante (FAB) para agregar nuevo miembro
- Cada fila con opciones: Editar, Desactivar
- Diálogo modal para crear/editar miembro
- Campos: nombre completo, teléfono, email (opcional)
- Búsqueda por nombre en tiempo real

### 💰 Aportaciones (`/donations`)
- Filtro por periodo (selector de mes)
- Filtro por estado (todas / aprobadas / rechazadas)
- Lista de aportaciones con: nombre, monto, periodo, estado, origen (público/admin)
- Botón para **registrar aportación manual** (abre modal)
  - Campos: buscar miembro (autocomplete) o nombre libre, monto, **selector de periodo**
  - Las aportaciones manuales van directo a estado `approved`
  - El periodo se selecciona manualmente (default: periodo activo)

### ⏳ Pendientes (`/pending`)
- Lista solo de aportaciones con estado `PENDING`
- Cada item muestra: nombre enviado, monto, fecha, origen público
- Dos botones por item: ✅ Aprobar / ❌ Rechazar
- Al rechazar, campo opcional para escribir motivo
- Badge en el ícono del menú con el conteo de pendientes

### 📊 Reportes (`/reports`)
- Selector de mes/periodo (**selecciona automáticamente el periodo activo**)
- Total acumulado (todas las aportaciones)
- Miembros activos, aprobadas, pendientes
- Top 10 miembros con más aportaciones
- Gráfico de barras: historial últimos 6 meses (Chart.js)
- Tabla detallada: nombre, monto, fecha, estado
- Botón: **Exportar a CSV** (genera archivo descargable)

### ⚙️ Configuración (`/settings`) - **SOLO ADMIN**
- Formulario de configuración general:
  - Nombre del Barrio
  - Monto por Defecto (Donaciones Públicas)
  - Meta de Donación Mensual
  - WhatsApp Líder General
  - WhatsApp Sociedad de Socorros
  - WhatsApp Cuórum de Élderes
- **Selecto de Período Activo** con lista visual:
  - Dropdown para cambiar periodo activo
  - Lista de todos los periodos con indicador visual (activo/inactivo)
  - Al cambiar, se llama a `PUT /api/v1/periods/{month}/activate`
- **El menú solo es visible para usuarios con `role: "admin"`

---

## Layout Principal (`MainLayout.vue`)

En móvil usar **navigation drawer** (menú lateral que se abre con hamburguesa):

```
┌─────────────────────────┐
│ ☰  Admin Templo    👤   │  ← Header
├─────────────────────────┤
│                         │
│   [Contenido de vista]  │
│                         │
│                         │
├─────────────────────────┤
│ 🏠  💰  ⏳  📊  👥     │  ← Bottom navigation bar (móvil)
└─────────────────────────┘
```

> Usar **Bottom Navigation Bar** de Vuetify para móvil en lugar de sidebar. Es el patrón más natural para apps móviles.

### Menú de Configuración (Solo Admin)
- El ítem "Configuración" en el drawer solo aparece si `auth.user?.role === 'admin'`
- Se usa `v-if="isAdmin"` en el `v-list-item`
- La ruta `/settings` tiene meta `{ requiresAuth: true, requiresAdmin: true }`
- El guard del router redirige a `/dashboard` si no es admin

---

## Pinia Stores

### `stores/auth.js`
- `token` — access token en memoria (se pierde al cerrar, por seguridad)
- `user` — datos del usuario logueado
- `refreshToken` — refresh token en localStorage
- `isRefreshing` — flag mutex para evitar múltiples refresh simultáneos
- Acciones: `login()`, `logout()`, `refresh()`

### `stores/notifications.js`
- `show(message, type)` — muestra snackbar global (success, error, warning)
- Usar en toda la app para feedback de acciones (ej: "Aportación aprobada ✅")

---

## Reglas de Diseño (Mobile First)

- Toda la UI diseñada primero para pantalla de 390px de ancho
- Tablas en desktop → Listas/tarjetas en móvil (usar `v-data-table` con configuración responsive de Vuetify)
- Botones de acción: mínimo 48px de altura, bien espaciados para no tocar el incorrecto
- Formularios: campos apilados verticalmente, etiquetas arriba del campo
- Bottom nav bar en móvil, sidebar opcional en desktop
- Modales centrados, scroll interno si el contenido es largo

---

## Checklist de Desarrollo

### Setup
- [x] Inicializar proyecto con Vite + Vue 3
- [x] Instalar: `vuetify`, `pinia`, `vue-router`, `axios`, `vite-plugin-pwa`, `chart.js`, `vue-chartjs`
- [x] Configurar `main.js` con todos los plugins
- [x] Configurar `vite.config.js` con PWA manifest
- [x] Crear instancia axios con interceptores JWT

### Auth
- [x] `LoginView.vue` con formulario email + password
- [x] `stores/auth.js` con login, logout, refresh (con mutex)
- [x] Guards de ruta implementados
- [x] Refresh automático de token en interceptor (con mutex global)
- [x] `AuthLayout.vue` con snackbar para notificaciones

### Por cada vista
- [x] Dashboard con meta, progreso y pendientes (usa periodo activo de API)
- [x] Miembros: lista + modal crear/editar
- [x] Aportaciones: lista filtrable + modal registro manual (con selector de periodo)
- [x] Pendientes: lista con aprobar/rechazar
- [x] Reportes: gráfico + tabla + exportar (usa periodo activo de API)
- [x] Configuración: configuración general + activación de periodo (SOLO ADMIN)

### PWA
- [x] Íconos generados y en `/public/icons/`
- [x] Configurar vite.config.js con PWA manifest
- [x] Usar hash mode en router para mejor compatibilidad con PWA iOS
- [x] index.html con meta tags correctas para iOS
- [x] Probar instalación en Android (Chrome)
- [x] Probar instalación en iOS (Safari)

### API Endpoints (Backend)
- [x] `/periods` - Lista TODOS los períodos (activo/inactivo) - Frontend usa este
- [x] `/donations/periods` - Lista de períodos con totales de donaciones
- [x] `/donations/stats` - Estadísticas globales (con filtro por mes)
- [x] `/donations/accumulated` - Total acumulado (con filtro por mes)
- [x] `/donations/top-members` - Ranking de miembros (con filtro por mes)
- [x] `/members` - Soporta filtro por nombre (`?name=`)
- [x] `PUT /periods/{month}/activate` - Activar período (desactiva otros)
- [x] `GET /settings` - Leer configuración general
- [x] `PATCH /settings` - Actualizar configuración general

---

## Reglas Importantes

1. **Token en memoria, refresh en localStorage** — El access token nunca va a localStorage por seguridad.
2. **Un solo periodo activo** — El backend debe validarlo, el frontend solo muestra el activo.
3. **Aportaciones manuales = aprobadas directo** — Sin pasar por pendientes.
4. **Aportaciones públicas = siempre pendientes primero** — El líder decide si aprobar.
5. **Feedback siempre visible** — Toda acción (aprobar, rechazar, guardar) muestra snackbar de confirmación.
6. **Sin eliminar aportaciones** — Solo rechazar. Los datos históricos nunca se borran.
7. **Exportar reportes** — Generar CSV en el frontend con los datos ya cargados, sin endpoint especial.
8. **Configuración solo para admin** — El menú y la ruta `/settings` están protegidos para `role: "admin"`.
9. **Período activo desde API** — Dashboard y Reportes usan `is_active: true` de la API, no `getCurrentMonth()`.
10. **Selector de período en donaciones** — Al registrar aportación manual, se puede elegir el período (default: activo).
