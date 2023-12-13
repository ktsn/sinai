import { BA0, BG, BG0, BM0, BM } from '../core/base'
import { VueStore } from '../vue/store'

const devtoolHook =
  typeof window !== 'undefined' &&
  (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__

/**
 * Mimic Vuex to use the vue-devtools feature
 */
export function devtoolPlugin (store: VueStore<unknown, BG0, BM0, BA0>) {
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

function proxyStore (store: VueStore<unknown, BG0, BM0, BA0>) {
  return {
    get state () {
      return store.state
    },

    getters: flattenGetters(store.getters, '.'),

    replaceState (state: {}) {
      store.replaceState(state)
    },

    _vm: (store as any).vm,

    _mutations: flattenMutations((store as any).mutations)
  }
}

function flattenMutations (mutations: any): Record<string, Function> {
  function loop (acc: Record<string, any>, path: string[], mutations: any): Record<string, any> {
    Object.keys(mutations).forEach(key => {
      if (key === '__proxy__') {
        return
      }

      const value = mutations[key]
      if (!value || !(value.__proto__ instanceof BM)) {
        Object.defineProperty(acc, path.concat(key).join('.'), {
          get: () => mutations[key], // `mutations[key]` should be evaluated in `get` function
          enumerable: true,
          configurable: true
        })
      } else {
        loop(acc, path.concat(key), value)
      }
    })
    return acc
  }
  return loop({}, [], mutations)
}

export function flattenGetters (getters: BG0, sep: string): Record<string, any> {
  function loop (acc: Record<string, any>, path: string[], getters: BG0): Record<string, any> {
    Object.getOwnPropertyNames(getters).forEach(key => {
      if (key === '__proxy__' || key === 'modules') {
        return
      }

      const value = (getters as any)[key]
      if (!value || !(value.__proto__ instanceof BG)) {
        Object.defineProperty(acc, path.concat(key).join(sep), {
          get: () => (getters as any)[key], // `getters[key]` should be evaluated in `get` function
          enumerable: true,
          configurable: true
        })
      } else {
        loop(acc, path.concat(key), value)
      }
    })
    return acc
  }
  return loop({}, [], getters)
}
