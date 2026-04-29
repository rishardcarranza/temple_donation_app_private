# Admin Templo

Panel de administración PWA para gestionar aportaciones del templo.

## Funcionalidades

- **Dashboard**: Resumen de aportaciones,meta del mes y progreso
- **Miembros**: Registro y gestión de miembros
- **Aportaciones**: Ver yRegistrar aportaciones manuales
- **Pendientes**: Aprobar o rechazar aportacionesdel público
- **Reportes**: Estadísticas mensuales y exportación CSV

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Producción

```bash
npm run build
```

Los archivos generados están en `dist/`.

## Configuración

Crear archivo `.env` basado en `.env.example`:

```env
VITE_API_BASE_URL=https://tu-dominio.com/api/v1
VITE_APP_TITLE=Admin - Aportaciones Templo
```

## PWA

Para instalaren móvil:
1. Abrir en Safari (iOS) o Chrome (Android)
2. **iOS**: Compartir > Añadir a pantalla de inicio
3. **Android**: Menú > Instalar app

## Tecnologías

- Vue 3 + Vuetify 3
- Pinia (estado)
- Vue Router (hash mode)
- Chart.js (gráficas)
- Vite + vite-plugin-pwa