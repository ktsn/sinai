import { WatchOptions } from 'vue'
import { Plugin } from '../vue/store'
import { BG0, BA0, BM0 } from '../core/base'
import { isPromise } from '../utils'
import { flattenGetters } from './devtool-plugin'

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
        const action = path.reduce<any>((action, key) => {
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
        const mutation = path.reduce<any>((mutation, key) => {
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
