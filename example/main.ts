import { createApp } from 'vue'
import { createSinai } from '../src'
import App from './components/App.vue'

const sinai = createSinai()

createApp(App).use(sinai).mount('#app')
