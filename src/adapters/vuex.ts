import { WatchOptions } from 'vue'
import { Plugin } from '../vue'
import { BG0, BG, BA0, BM0 } from '../core/base'
import { Dictionary, isPromise } from '../utils'

/**
 * We cannot use original Vuex typings because
 * they conficts Sinai's type augmentation for ComponentOptions
 */
interface VuexStore<S> {
  readonly state: S
  readonly getters: any

  replaceState(state: S): void

  dispatch: Dispatch
  commit: Commit

  subscribe(fn: (mutation: MutationPayload, state: S) => any): () => void
  watch<T>(getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): () => void

  registerModule(...args: any[]): void
  unregisterModule(...args: any[]): void
}

interface Payload {
  type: string
}

interface MutationPayload extends Payload {
  payload: any
}

interface Dispatch {
  (type: string, payload?: any): Promise<any>
  <P extends Payload>(payloadWithType: P): Promise<any>
}

interface Commit {
  (type: string, payload?: any): void
  <P extends Payload>(payloadWithType: P): void
}

/**
 * Convert Vuex plugin to Sinai plugin
 */
export function convertVuexPlugin<S, G extends BG0, M extends BM0, A extends BA0>(
  plugin: (store: any) => void
): Plugin<S, G, M, A> {
  return store => {
    const storeAdapter: VuexStore<any> = {
      get state() {
        return store.state
      },

      get getters() {
        return flattenGetters(store.getters, '/')
      },

      replaceState(state) {
        store.replaceState(state)
      },

      dispatch<P extends Payload>(type: string | P, payload?: any): Promise<any> {
        if (typeof type !== 'string') {
          payload = type
          type = payload.type as string
        }
        const path = type.split('/')
        const action = path.reduce((action, key) => {
          return action[key]
        }, store.actions)

        const res = action(payload)
        if (isPromise(res)) {
          return res
        } else {
          return Promise.resolve(res)
        }
      },

      commit<P extends Payload>(type: string | P, payload?: any): void {
        if (typeof type !== 'string') {
          payload = type
          type = payload.type as string
        }
        const path = type.split('/')
        const mutation = path.reduce((mutation, key) => {
          return mutation[key]
        }, store.mutations)

        mutation(payload)
      },

      subscribe(fn) {
        return store.subscribe((path, payload, state) => {
          const type = path.join('/')
          fn({
            type,
            payload: payload[0]
          }, state)
        })
      },

      watch(getter, cb, options) {
        return store.watch(
          () => getter(this.state, this.getters),
          cb,
          options
        )
      },

      registerModule() {
        throw new Error('[sinai:vuex-plugin-adapter] registerModule is not supported')
      },

      unregisterModule() {
        throw new Error('[sinai:vuex-plugin-adapter] unregisterModule is not supported')
      }
    }
    plugin(storeAdapter)
  }
}

export function flattenGetters (getters: BG0, sep: string): Dictionary<any> {
  function loop (acc: Dictionary<any>, path: string[], getters: BG0): Dictionary<any> {
    Object.keys(getters).forEach(key => {
      if (key === '__proxy__' || key === 'modules') {
        return
      }

      const value = getters[key]
      if (!value || !(value.__proto__ instanceof BG)) {
        Object.defineProperty(acc, path.concat(key).join(sep), {
          get: () => getters[key], // `getters[key]` should be evaluated in `get` function
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
