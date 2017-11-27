import Vue from 'vue'
import { install } from '../src'

Vue.config.productionTip = false
Vue.config.devtools = false

Vue.use(install)

declare module 'vue/types/vue' {
  interface Vue {
    $store: any
  }
}
