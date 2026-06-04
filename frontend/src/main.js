import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource/inter'
import '@fortawesome/fontawesome-free/css/all.min.css'

import './assets/styles/theme.css'

import App from './App.vue'
import router from './router'
import { usePreferencesStore } from './stores/preferences.store'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Apply theme before mount to avoid flash.
usePreferencesStore().init()

app.mount('#app')
