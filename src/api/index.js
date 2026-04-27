import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore()
    if (auth.token) {
      config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      const refreshed = await auth.refresh()
      if (refreshed) {
        return api.request(error.config)
      }
      auth.logout()
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
  members: {
    getAll: (params) => api.get('/members', { params }),
    getById: (id) => api.get(`/members/${id}`),
    create: (data) => api.post('/members', data),
    update: (id, data) => api.patch(`/members/${id}`, data),
    delete: (id) => api.delete(`/members/${id}`)
  },
  periods: {
    getAll: () => api.get('/donations/periods'),
    getActive: () => api.get('/periods/active'),
    create: (data) => api.post('/periods', data),
    setActive: (id) => api.patch(`/periods/${id}/activate`)
  },
  donations: {
    getAll: (params) => api.get('/donations', { params }),
    getById: (id) => api.get(`/donations/${id}`),
    create: (data) => api.post('/donations', data),
    approve: (id) => api.patch(`/donations/${id}/approve`),
    reject: (id, motivo) => api.patch(`/donations/${id}/reject`, { motivo }),
    getProgress: (month) => api.get('/donations/progress', { params: { month } }),
    getReport: (month) => api.get('/donations/report', { params: { month } })
  }
}