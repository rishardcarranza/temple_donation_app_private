import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

let isRefreshing = false

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
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      if (isRefreshing) {
        return Promise.reject(error)
      }
      
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
    getReport: (month) => api.get('/donations/report', { params: { month } }),
    getByMember: (memberId) => api.get('/donations/by-member', { params: { member_id: memberId } }),
    getTopMembers: (month) => api.get('/donations/top-members', { params: { month } }),
    getAccumulated: (month) => api.get('/donations/accumulated', { params: { month } }),
    getStats: (month) => api.get('/donations/stats', { params: { month } })
  }
}