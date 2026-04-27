import { defineStore } from 'pinia'

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    message: '',
    type: 'success',
    show: false
  }),

  actions: {
    showMessage(message, type = 'success') {
      if (!message) return
      this.message = message
      this.type = type
      this.show = true
      setTimeout(() => {
        this.show = false
      }, 3000)
    },

    success(message) {
      this.showMessage(message, 'success')
    },

    error(message) {
      this.showMessage(message, 'error')
    },

    warning(message) {
      this.showMessage(message, 'warning')
    },

    clear() {
      this.show = false
      this.message = ''
    }
  }
})