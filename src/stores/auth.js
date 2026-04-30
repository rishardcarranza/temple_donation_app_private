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
      
      await this.fetchUser()
      return data
    },

    async fetchUser() {
      if (!this.token) return
      try {
        const response = await api.users.getMe()
        this.user = response.data
      } catch (e) {
        console.error('Error fetching user:', e)
      }
    },

    async refresh() {
      if (!this.refreshToken || this.isRefreshing) return false
      this.isRefreshing = true
      try {
        const response = await api.auth.refresh(this.refreshToken)
        const data = response.data
        this.token = data.access_token
        this.refreshToken = data.refresh_token
        
        sessionStorage.setItem('access_token', this.token)
        localStorage.setItem('access_token', this.token)
        localStorage.setItem('refresh_token', this.refreshToken)
        
        await this.fetchUser()
        return true
      } catch (e) {
        this.logout()
        return false
      } finally {
        this.isRefreshing = false
      }
    },

    async logout() {
      try {
        await api.auth.logout()
      } catch (e) {
        console.error('Logout API error:', e)
      }
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