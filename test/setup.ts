import Vue = require('vue')
import { install } from '../src'

Vue.use(install)

declare module 'vue/types/vue' {
  interface Vue {
    $store: any
  }
}
