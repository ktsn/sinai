import { VueStore } from './store'
import { BG0, BM0, BA0 } from '../core/base'
import { getByPath } from '../utils'

type State<ST extends VueStore<any, any, any, any>> = ST extends VueStore<infer S, any, any, any> ? S : never
type Getters<ST extends VueStore<any, any, any, any>> = ST extends VueStore<any, infer G, any, any> ? G : never
type Mutations<ST extends VueStore<any, any, any, any>> = ST extends VueStore<any, any, infer M, any> ? M : never
type Actions<ST extends VueStore<any, any, any, any>> = ST extends VueStore<any, any, any, infer A> ? A : never
type Module<S, G, M, A> = keyof S & keyof G & keyof M & keyof A

function normalizeMap<R>(map: string[] | Record<string, string>, fn: (value: string, key: string) => R): Record<string, R> {
  const res: Record<string, R> = {}
  if (Array.isArray(map)) {
    map.forEach(key => {
      res[key] = fn(key, key)
    })
  } else {
    Object.keys(map).forEach(key => {
      res[key] = fn(map[key], key)
    })
  }
  return res
}

export class VueMapper<S, G, M, A> {
  constructor(private _module: string[]) {}

  module<T extends Module<S, G, M, A>>(module: T): VueMapper<S[T], G[T], M[T], A[T]>
  module(module: string): VueMapper<any, any, any, any> {
    return new VueMapper(this._module.concat(module))
  }

  mapState<Key extends keyof S>(keys: Key[]): { [K in Key]: () => S[K] }
  mapState<T extends Record<string, keyof S>>(map: T): { [K in keyof T]: () => S[T[K]] }
  mapState(map: string[] | Record<string, string>): Record<string, Function> {
    return normalizeMap(map, value => {
      const path = this._module.concat(value)
      return function stateMapper(this: any) {
        return getByPath(path, this.$store.state)
      }
    })
  }

  mapGetters<Key extends keyof G>(keys: Key[]): { [K in Key]: () => G[K] }
  mapGetters<T extends Record<string, keyof G>>(map: T): { [K in keyof T]: () => G[T[K]] }
  mapGetters(map: string[] | Record<string, string>): Record<string, Function> {
    return normalizeMap(map, value => {
      const path = this._module.concat(value)
      return function getterMapper(this: any) {
        return getByPath(path, this.$store.getters)
      }
    })
  }

  mapMutations<Key extends keyof M>(keys: Key[]): { [K in Key]: M[K] }
  mapMutations<T extends Record<string, keyof M>>(map: T): { [K in keyof T]: M[T[K]] }
  mapMutations(map: string[] | Record<string, string>): Record<string, any> {
    return normalizeMap(map, value => {
      const path = this._module.concat(value)
      return function mutationMapper(this: any, ...args: any[]) {
        // It never return non-callable value since we have runtime assertion in the module
        return getByPath<Function>(path, this.$store.mutations)(...args)
      }
    })
  }

  mapActions<Key extends keyof A>(keys: Key[]): { [K in Key]: A[K] }
  mapActions<T extends Record<string, keyof A>>(map: T): { [K in keyof T]: A[T[K]] }
  mapActions(map: string[] | Record<string, string>): Record<string, any> {
    return normalizeMap(map, value => {
      const path = this._module.concat(value)
      return function actionMapper(this: any, ...args: any[]) {
        // It never return non-callable value since we have runtime assertion in the module
        return getByPath<Function>(path, this.$store.actions)(...args)
      }
    })
  }
}

export function createMapper<ST extends VueStore<{}, BG0, BM0, BA0>>(): VueMapper<State<ST>, Getters<ST>, Mutations<ST>, Actions<ST>> {
  return new VueMapper([])
}
