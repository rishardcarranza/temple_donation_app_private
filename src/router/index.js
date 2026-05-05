import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    component: () => import('@/layouts/AuthLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/views/LoginView.vue')
      }
    ]
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue')
      },
      {
        path: 'members',
        name: 'Members',
        component: () => import('@/views/MembersView.vue')
      },
      {
        path: 'donations',
        name: 'Donations',
        component: () => import('@/views/DonationsView.vue')
      },
      {
        path: 'pending',
        name: 'Pending',
        component: () => import('@/views/PendingView.vue')
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/ReportsView.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()
  
  if (to.meta.requiresAuth === false) {
    if (auth.token) {
      return '/dashboard'
    }
  } else if (to.meta.requiresAuth && !auth.token) {
    if (auth.refreshToken && !auth.isRefreshing) {
      const ok = await auth.refresh()
      if (ok) {
        await auth.fetchUser()
        return true
      }
    }
    if (!auth.token) {
      return '/login'
    }
  }
  
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return '/dashboard'
  }
})

export default router