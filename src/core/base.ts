import { Class } from '../utils'
import { Module, ModuleImpl, ModuleProxy } from './module'
import { StoreImpl } from './store'
import { assert } from '../utils'

export interface GI<S, G extends BG0> {
  readonly state: S
  readonly getters: G
}

export interface AI<S, G extends BG0, M extends BM0, A extends BA0> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A
}

export interface GI0 extends GI<{}, BG0> {}
export interface AI0 extends AI<{}, BG0, BM0, BA0> {}

export interface Injected<SG, SGMA> {
  Getters<S> (): Class<BG<S, SG>>
  Mutations<S> (): Class<BM<S>>
  Actions<G extends BG0> (): Class<BA<{}, G, BM0, SGMA>>
  Actions<M extends BM0> (): Class<BA<{}, BG0, M, SGMA>>
  Actions<S> (): Class<BA<S, BG0, BM0, SGMA>>
  Actions<S, G extends BG0> (): Class<BA<S, G, BM0, SGMA>>
  Actions<S, M extends BM0> (): Class<BA<S, BG0, M, SGMA>>
  Actions<S, G extends BG0, M extends BM0> (): Class<BA<S, G, M, SGMA>>

  and<K extends string, S, G extends BG0, M extends BM0, A extends BA0> (
    key: K,
    module: Module<S, G, M, A>
  ): Injected<SG & Record<K, GI<S, G>>, SGMA & Record<K, AI<S, G, M, A>>>
}

export function makeInjected (
  Getters: BaseClass<BG0>,
  Mutations: BaseClass<BM0>,
  Actions: BaseClass<BA0>
): Injected<{}, {}> {
  return {
    Getters: () => Getters,
    Mutations: () => Mutations,
    Actions: () => Actions,
    and (key: string, module: ModuleImpl): Injected<{}, {}> {
      return makeInjected(
        injectModule(Getters, key, module) as BaseClass<BG0>,
        Mutations,
        injectModule(Actions, key, module) as BaseClass<BA0>
      )
    }
  } as Injected<{}, {}>
}

function injectModule<I> (
  Super: BaseClass<BaseInjectable<I>>,
  key: string,
  depModule: ModuleImpl
): BaseClass<BaseInjectable<I>> {
  return class extends Super {
    constructor (module: ModuleImpl, store: StoreImpl) {
      super(module, store)

      const proxy = store.getProxy(depModule)
      if (process.env.NODE_ENV !== 'production') {
        assert(proxy !== null, 'The dependent module is not found in the store')
      }
      (this.modules as any)[key] = proxy
    }
  }
}

export interface BaseClass<T> {
  new (module: ModuleImpl, store: StoreImpl): T
}

export class Base {
  protected __proxy__: ModuleProxy

  constructor (
    module: ModuleImpl,
    store: StoreImpl
  ) {
    const proxy = store.getProxy(module)
    if (process.env.NODE_ENV !== 'production') {
      assert(proxy !== null, 'The module proxy is not found in the store, unexpectedly')
    }
    this.__proxy__ = proxy!
  }
}

export class BaseInjectable<I> extends Base {
  protected modules: I = {} as I
}

export class BG<S, SG> extends BaseInjectable<SG> {
  protected get state (): S {
    return this.__proxy__.state as S
  }
}

export class BM<S> extends Base {
  protected get state (): S {
    return this.__proxy__.state as S
  }
}

export class BA<S, G extends BG0, M extends BM0, SGMA> extends BaseInjectable<SGMA> {
  protected get state (): S {
    return this.__proxy__.state as S
  }

  protected get getters (): G {
    return this.__proxy__.getters as G
  }

  protected get mutations (): M {
    return this.__proxy__.mutations as M
  }
}

export interface BG0 extends BG<unknown, unknown> {}
export interface BG1<S> extends BG<S, unknown> {}
export interface BM0 extends BM<unknown> {}
export interface BA0 extends BA<unknown, BG0, BM0, unknown> {}
export interface BA1<S, G extends BG0, M extends BM0> extends BA<S, G, M, unknown> {}

export function Getters<S> (): Class<BG1<S>>
export function Getters (): Class<BG0> {
  return BG
}

export function Mutations<S> (): Class<BM<S>>
export function Mutations (): Class<BM0> {
  return BM
}

export function Actions<G extends BG0> (): Class<BA1<unknown, G, BM0>>
export function Actions<M extends BM0> (): Class<BA1<unknown, BG0, M>>
export function Actions<S> (): Class<BA1<S, BG0, BM0>>
export function Actions<S, G extends BG0> (): Class<BA1<S, G, BM<S>>>
export function Actions<S, M extends BM0> (): Class<BA1<S, BG1<S>, M>>
export function Actions<S, G extends BG0, M extends BM0> (): Class<BA1<S, G, M>>
export function Actions (): Class<BA0> {
  return BA
}

export function inject<K extends string, S, G extends BG0, M extends BM0, A extends BA0> (
  key: K,
  module: Module<S, G, M, A>
): Injected<Record<K, GI<S, G>>, Record<K, AI<S, G, M, A>>> {
  return makeInjected(BG, BM, BA).and(key, module)
}
