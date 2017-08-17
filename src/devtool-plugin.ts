import { BG0, BM0, BA0, BG } from './core/base'
import { VueStore } from './vue'
import { Dictionary } from './utils'

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
    getters: flattenGetters(store.getters)
  }
}

function flattenGetters (getters: BG0): Dictionary<any> {
    function loop (acc: Dictionary<any>, path: string[], getters: BG0): Dictionary<any> {
        Object.keys(getters).forEach(key => {
            if (key === '__proxy__' || key === 'modules') {
                return
            }

            const desc = Object.getOwnPropertyDescriptor(getters, key)
            if (!(getters[key].__proto__ instanceof BG)) {
                Object.defineProperty(acc, path.concat(key).join('.'), {
                    get: () => getters[key],
                    enumerable: true,
                    configurable: true
                })
            }
            if (getters[key].__proto__ instanceof BG)
                loop(acc, path.concat(key), getters[key])
        })
        return acc
    }
    return loop({}, [], getters)
}
