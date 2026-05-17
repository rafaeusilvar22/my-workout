import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  register(process.env.SERVICE_WORKER_FILE, {
    ready() {},
    registered() {},
    cached() {},
    updatefound() {},
    updated() {
      // Notifica usuário que nova versão está disponível
      if (window.confirm('Nova versão disponível. Recarregar?')) {
        window.location.reload()
      }
    },
    offline() {},
    error() {},
  })
}
