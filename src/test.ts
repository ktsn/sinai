import { Class } from './utils'
import { BG, BM, BA, BG0, BM0 } from './core/base'

export interface Injection<S, G, M, MD> {
  state?: Partial<S>
  getters?: Partial<G>
  mutations?: Partial<M>
  modules?: Partial<MD>
}

export function stub<S, SG, T extends BG<S, {}>> (
  Getters: Class<T>,
  injection?: Injection<S, never, never, SG>
): T & { state: S, modules: SG }

export function stub<S, T extends BM<S>> (
  Mutations: Class<T>,
  injection?: Injection<S, never, never, never>
): T & { state: S }

export function stub<S, G, M, SGMA, T extends BA<S, G & BG0, M & BM0, {}>> (
  Actions: Class<T>,
  injection?: Injection<S, G, M, SGMA>
): T & { state: S, getters: G, mutations: M, modules: SGMA }

export function stub (Class: Class<{}>, injection: Injection<{}, {}, {}, {}> = {}): {} {
  const instance = Object.create(Class.prototype)
  Object.keys(injection).forEach(key => {
    Object.defineProperty(instance, key, {
      value: injection[key]
    })
  })
  return instance
}

