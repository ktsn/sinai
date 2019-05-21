import { BA0, BG, BG0, BM0 } from '../core/base'

import { VueStore } from '../vue/store'
import { flattenGetters } from './vuex'

const devtoolHook =
  typeof window !== 'undefined' &&
  (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__

/**
 * Mimic Vuex to use the vue-devtools feature
 */
export function devtoolPlugin (store: VueStore<{}, BG0, BM0, BA0>) {
  if (!devtoolHook) {
    return
  }

  devtoolHook.emit('vuex:init', proxyStore(store))

  devtoolHook.on('vuex:travel-to-state', (targetState: {}) => {
    store.replaceState(targetState)
  })

  store.subscribe((path, payload, state) => {
    devtoolHook.emit(
      'vuex:mutation',
      { type: path.join('.'), payload },
      state
    )
  })
}

function proxyStore (store: VueStore<{}, BG0, BM0, BA0>) {
  return {
    get state () {
      return store.state
    },

    getters: flattenGetters(store.getters, '.'),

    replaceState (state: {}) {
      store.replaceState(state)
    },

    get _vm() {
      return (store as any).vm
    },

    get _mutations() {
      return (store as any).mutations
    }
  }
}
