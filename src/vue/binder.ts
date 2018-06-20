import { VueStore } from './store'
import { BG0, BM0, BA0 } from '../core/base'

type State<ST extends VueStore<any, any, any, any>> = ST extends VueStore<infer S, any, any, any> ? S : never
type Getters<ST extends VueStore<any, any, any, any>> = ST extends VueStore<any, infer G, any, any> ? G : never
type Mutations<ST extends VueStore<any, any, any, any>> = ST extends VueStore<any, any, infer M, any> ? M : never
type Actions<ST extends VueStore<any, any, any, any>> = ST extends VueStore<any, any, any, infer A> ? A : never
type Module<S, G, M, A> = keyof S & keyof G & keyof M & keyof A

function createMapper(module: string[], name: string, key: string): Function {
  return function (this: any) {
    const target = this.$store[name]
    return module.concat(key).reduce<any>((acc, key) => {
      return acc[key]
    }, target)
  }
}

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

export class VueBinder<S, G, M, A> {
  constructor(private _module: string[]) {}

  module<T extends Module<S, G, M, A>>(module: T): VueBinder<S[T], G[T], M[T], A[T]>
  module(module: string): VueBinder<any, any, any, any> {
    return new VueBinder(this._module.concat(module))
  }

  mapState<Key extends keyof S>(keys: Key[]): { [K in Key]: () => S[K] }
  mapState<T extends Record<string, keyof S>>(map: T): { [K in keyof T]: () => S[T[K]] }
  mapState(map: string[] | Record<string, string>): Record<string, Function> {
    return normalizeMap(map, value => {
      return createMapper(this._module, 'state', value)
    })
  }

  mapGetters<Key extends keyof G>(keys: Key[]): { [K in Key]: () => G[K] }
  mapGetters<T extends Record<string, keyof G>>(map: T): { [K in keyof T]: () => G[T[K]] }
  mapGetters(map: string[] | Record<string, string>): Record<string, Function> {
    return normalizeMap(map, value => {
      return createMapper(this._module, 'getters', value)
    })
  }
}

export function createVueBinder<ST extends VueStore<{}, BG0, BM0, BA0>>(): VueBinder<State<ST>, Getters<ST>, Mutations<ST>, Actions<ST>> {
  return new VueBinder([])
}
