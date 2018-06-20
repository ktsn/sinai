import Vue from 'vue'
import { store, install, createMapper } from '../../'
import counter from './counter'

Vue.use(install)

const s = store(counter, {
  strict: true
})

export const mapper = createMapper<typeof s>()

declare const module: any
if (module.hot) {
  module.hot.accept(['./counter'], () => {
    const newModule = require('./counter').default
    s.hotUpdate(newModule)
  })
}

declare module 'vue/types/vue' {
  interface Vue {
    $store: typeof s
  }
}

export default s
