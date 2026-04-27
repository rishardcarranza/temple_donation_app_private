# 🔐 AGENTS.md — App Privada: Aportaciones Templo Admin

## Descripción
Panel de administración PWA para el líder de la iglesia. Permite gestionar miembros, registrar aportaciones manualmente, aprobar o rechazar aportaciones enviadas por el público, configurar el periodo activo y consultar reportes mensuales. Acceso con autenticación JWT. Diseño Mobile First, instalable como PWA.

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
| Router | Vue Router 4 |
| Gráficas | Chart.js + vue-chartjs |
| Lenguaje | JavaScript (sin TypeScript) |

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
│   │   ├── index.js                # Instancia axios + interceptor JWT
│   │   ├── auth.js                 # login, refresh, logout
│   │   ├── members.js              # CRUD miembros
│   │   ├── donations.js            # CRUD aportaciones + aprobar/rechazar
│   │   ├── periods.js              # Configurar periodo activo
│   │   └── reports.js              # Endpoints de reportes
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
│       └── PeriodsView.vue
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
      manifest: {
        name: 'Admin Aportaciones Templo',
        short_name: 'Admin Templo',
        description: 'Panel de administración de aportaciones',
        theme_color: '#1B5E20',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

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
   ├── Guardar access_token en memoria
   ├── Guardar refresh_token en localStorage
   └── Redirigir a /dashboard
```

### Interceptor Axios (`src/api/index.js`)
```javascript
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

// Adjuntar token a cada request
api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

// Si expira el token, intentar refresh automático
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      const refreshed = await auth.refresh()
      if (refreshed) return api.request(error.config)
      auth.logout()
    }
    return Promise.reject(error)
  }
)

export default api
```

### Guards de ruta (`src/router/index.js`)
```javascript
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) return '/login'
  if (to.path === '/login' && auth.token) return '/dashboard'
})
```

---

## Rutas

| Ruta | Vista | Auth | Descripción |
|------|-------|------|-------------|
| `/login` | LoginView | ❌ | Pantalla de acceso |
| `/dashboard` | DashboardView | ✅ | Resumen y meta del mes |
| `/members` | MembersView | ✅ | Gestión de miembros |
| `/donations` | DonationsView | ✅ | Ver y registrar aportaciones |
| `/pending` | PendingView | ✅ | Aprobar/rechazar aportaciones públicas |
| `/reports` | ReportsView | ✅ | Reportes mensuales |
| `/periods` | PeriodsView | ✅ | Configurar periodo activo |

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
  - Campos: buscar miembro (autocomplete) o nombre libre, monto, periodo
  - Las aportaciones manuales van directo a estado `APPROVED`

### ⏳ Pendientes (`/pending`)
- Lista solo de aportaciones con estado `PENDING`
- Cada item muestra: nombre enviado, monto, fecha, origen público
- Dos botones por item: ✅ Aprobar / ❌ Rechazar
- Al rechazar, campo opcional para escribir motivo
- Badge en el ícono del menú con el conteo de pendientes

### 📊 Reportes (`/reports`)
- Selector de mes/periodo
- Total recaudado vs meta (número y barra)
- Gráfico de barras: recaudado por mes (últimos 6 meses) usando Chart.js
- Tabla detallada: nombre, monto, fecha, estado
- Botón: **Exportar a Excel** (genera archivo .xlsx o .csv descargable)

### 📅 Periodos (`/periods`)
- Periodo activo actual (visible en la app pública)
- Formulario para activar un nuevo periodo: mes + año + monto meta
- Solo puede haber un periodo activo a la vez
- Historial de periodos anteriores en tabla

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

---

## Pinia Stores

### `stores/auth.js`
- `token` — access token en memoria (se pierde al cerrar, por seguridad)
- `user` — datos del usuario logueado
- `refresh_token` — en localStorage
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
- [ ] Inicializar proyecto con Vite + Vue 3
- [ ] Instalar: `vuetify`, `pinia`, `vue-router`, `axios`, `vite-plugin-pwa`, `chart.js`, `vue-chartjs`
- [ ] Configurar `main.js` con todos los plugins
- [ ] Configurar `vite.config.js` con PWA manifest
- [ ] Crear instancia axios con interceptores JWT

### Auth
- [ ] `LoginView.vue` con formulario email + password
- [ ] `stores/auth.js` con login, logout, refresh
- [ ] Guards de ruta implementados
- [ ] Refresh automático de token en interceptor

### Por cada vista
- [ ] Dashboard con meta, progreso y pendientes
- [ ] Miembros: lista + modal crear/editar
- [ ] Aportaciones: lista filtrable + modal registro manual
- [ ] Pendientes: lista con aprobar/rechazar
- [ ] Reportes: gráfico + tabla + exportar
- [ ] Periodos: activar periodo + configurar meta

### PWA
- [ ] Íconos generados y en `/public/icons/`
- [ ] Probar instalación en Android (Chrome)
- [ ] Probar instalación en iOS (Safari)

---

## Reglas Importantes

1. **Token en memoria, refresh en localStorage** — El access token nunca va a localStorage por seguridad.
2. **Un solo periodo activo** — El backend debe validarlo, el frontend solo muestra el activo.
3. **Aportaciones manuales = aprobadas directo** — Sin pasar por pendientes.
4. **Aportaciones públicas = siempre pendientes primero** — El líder decide si aprobar.
5. **Feedback siempre visible** — Toda acción (aprobar, rechazar, guardar) muestra snackbar de confirmación.
6. **Sin eliminar aportaciones** — Solo rechazar. Los datos históricos nunca se borran.
7. **Exportar reportes** — Generar CSV en el frontend con los datos ya cargados, sin endpoint especial.
