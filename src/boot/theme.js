import { Dark } from 'quasar'

export default () => {
  const saved = localStorage.getItem('theme')
  if (saved !== null) {
    Dark.set(saved === 'dark')
  } else {
    Dark.set(false)
  }
}
