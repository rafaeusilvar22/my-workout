import { Dark, Notify } from 'quasar'

export default () => {
  const saved = localStorage.getItem('theme')
  Dark.set(saved !== null ? saved === 'dark' : false)

  Notify.setDefaults({
    position: 'top-right',
    timeout: 2800,
    classes: 'notify-glass',
    progress: false,
  })
}
