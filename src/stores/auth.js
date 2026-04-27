import { defineStore } from 'pinia'
import api from '@/api'

const getStoredToken = () => {
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token')
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: getStoredToken(),
    user: null,
    refreshToken: localStorage.getItem('refresh_token') || null
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
      if (!this.refreshToken) return false
      try {
        const response = await api.auth.refresh(this.refreshToken)
        this.token = response.data.access_token
        sessionStorage.setItem('access_token', this.token)
        localStorage.setItem('access_token', this.token)
        return true
      } catch (e) {
        this.logout()
        return false
      }
    },

    async initAuth() {
      if (this.token) return true
      if (this.refreshToken) {
        return await this.refresh()
      }
      return false
    },

    logout() {
      this.token = null
      this.user = null
      this.refreshToken = null
      sessionStorage.removeItem('access_token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }
})