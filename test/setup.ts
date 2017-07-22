import Vue from 'vue'
import { install } from '../src'

Vue.config.productionTip = false
Vue.config.devtools = false

Vue.use(install)

// Since 2.2.0, Vue captures some errors by default.
// We must override this behaviour because it prevents some tests with assert.throws().
Vue.config.errorHandler = (err, vm, info) => {
  throw err
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: any
  }
}
