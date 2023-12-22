import { Class } from './utils'
import { BG, BM, BA, BG0, BM0 } from './core/base'

export type PartialModule<T> = {
  [K in keyof T]?: Partial<T[K]>
}

// Make each module and its assets optional
// e.g. { foo: Module } -> { foo?: Partial<Module> }
export type PartialModules<T> = {
  [K in keyof T]?: PartialModule<T[K]>
}

export interface Injection<S, G, M, MD> {
  state?: Partial<S>
  getters?: Partial<G>
  mutations?: Partial<M>
  modules?: PartialModules<MD>
}

type GetterState<G extends BG<any, any>> = G extends BG<infer S, any>
  ? S
  : never
type GetterModules<G extends BG<any, any>> = G extends BG<any, infer SG>
  ? SG
  : never
type MutationState<M extends BM<any>> = M extends BM<infer S> ? S : never
type ActionState<A extends BA<any, any, any, any>> = A extends BA<
  infer S,
  any,
  any,
  any
>
  ? S
  : never
type ActionGetters<A extends BA<any, any, any, any>> = A extends BA<
  any,
  infer G,
  any,
  any
>
  ? G
  : never
type ActionMutations<A extends BA<any, any, any, any>> = A extends BA<
  any,
  any,
  infer M,
  any
>
  ? M
  : never
type ActionModules<A extends BA<any, any, any, any>> = A extends BA<
  any,
  any,
  any,
  infer SGMA
>
  ? SGMA
  : never

export function stub<T extends BG<unknown, unknown>>(
  Getters: Class<T>,
  injection?: Injection<GetterState<T>, never, never, GetterModules<T>>,
): T & { state: GetterState<T>; modules: GetterModules<T> }

export function stub<T extends BM<unknown>>(
  Mutations: Class<T>,
  injection?: Injection<MutationState<T>, never, never, never>,
): T & { state: MutationState<T> }

export function stub<T extends BA<unknown, BG0, BM0, unknown>>(
  Actions: Class<T>,
  injection?: Injection<
    ActionState<T>,
    ActionGetters<T>,
    ActionMutations<T>,
    ActionModules<T>
  >,
): T & {
  state: ActionState<T>
  getters: ActionGetters<T>
  mutations: ActionMutations<T>
  modules: ActionModules<T>
}

export function stub(
  Class: Class<unknown>,
  injection: Injection<{}, {}, {}, {}> = {},
): {} {
  const instance = Object.create(Class.prototype)
  Object.keys(injection).forEach((key) => {
    Object.defineProperty(instance, key, {
      value: (injection as any)[key],
    })
  })
  return instance
}
