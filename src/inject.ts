import {
  Class, CHD,
  GI, AI,
  BG, BM, BA,
  BG0, BM0, BA0,
  BG1, BA1
} from './interface'

import { Module, ModuleImpl, ModuleProxyImpl } from './module'
import { StoreImpl } from './store'
import { assert } from './utils'

export interface Injected<SG, SGMA> {
  Getters<S> (): Class<BG<S, SG>>
  Mutations<S> (): Class<BM<S>>
  Actions<S> (): Class<BA<S, BG0, BM0, SGMA>>
  Actions<S, G extends BG0> (): Class<BA<S, G, BM0, SGMA>>
  Actions<S, M extends BM0> (): Class<BA<S, BG0, M, SGMA>>
  Actions<S, G extends BG0, M extends BM0> (): Class<BA<S, G, M, SGMA>>

  and<K extends string, S, G extends BG0, M extends BM0, A extends BA0> (
    key: K,
    module: Module<S, G, M, A>
  ): Injected<SG & CHD<K, GI<S, G>>, SGMA & CHD<K, AI<S, G, M, A>>>
}

export function makeInjected (
  Getters: BaseClass<BaseGettersImpl>,
  Mutations: BaseClass<BaseMutationsImpl>,
  Actions: BaseClass<BaseActionsImpl>
): Injected<{}, {}> {
  return {
    Getters: () => Getters,
    Mutations: () => Mutations,
    Actions: () => Actions,
    and (key: string, module: ModuleImpl): Injected<{}, {}> {
      return makeInjected(
        injectModule(Getters, key, module) as BaseClass<BaseGettersImpl>,
        Mutations,
        injectModule(Actions, key, module) as BaseClass<BaseActionsImpl>
      )
    }
  }
}

function injectModule<T extends BaseClass<Base>> (
  Super: BaseClass<Base>,
  key: string,
  depModule: ModuleImpl
): BaseClass<Base> {
  return class extends Super {
    constructor (module: ModuleImpl, store: StoreImpl) {
      super(module, store)

      const proxy = store.getProxy(depModule)
      assert(proxy !== null, 'The dependent module is not found in the store')
      this.modules[key] = proxy
    }
  }
}

export interface BaseClass<T extends Base> {
  new (module: ModuleImpl, store: StoreImpl): T
}

export class Base {
  modules: {}
  protected proxy: ModuleProxyImpl

  constructor (
    module: ModuleImpl,
    store: StoreImpl
  ) {
    const proxy = store.getProxy(module)
    assert(proxy !== null, 'The module proxy is not found in the store, unexpectedly')
    this.proxy = proxy!
  }
}

export class BaseGettersImpl extends Base implements BG0 {
  modules = {}

  get state () {
    return this.proxy.state
  }
}

export class BaseMutationsImpl extends Base implements BM0 {
  get state () {
    return this.proxy.state
  }
}

export class BaseActionsImpl extends Base implements BA0 {
  modules = {}

  get state () {
    return this.proxy.state
  }

  get getters () {
    return this.proxy.getters
  }

  get mutations () {
    return this.proxy.mutations
  }
}

export function Getters<S> (): Class<BG1<S>>
export function Getters (): Class<BG0> {
  return BaseGettersImpl
}

export function Mutations<S> (): Class<BM<S>>
export function Mutations (): Class<BM0> {
  return BaseMutationsImpl
}

export function Actions<S> (): Class<BA1<S, BG0, BM0>>
export function Actions<S, G extends BG0> (): Class<BA1<S, G, BM0>>
export function Actions<S, M extends BM0> (): Class<BA1<S, BG0, M>>
export function Actions<S, G extends BG0, M extends BM0> (): Class<BA1<S, G, M>>
export function Actions (): Class<BA0> {
  return BaseActionsImpl
}

export function inject<K extends string, S, G extends BG0, M extends BM0, A extends BA0> (
  key: K,
  module: Module<S, G, M, A>
): Injected<CHD<K, GI<S, G>>, CHD<K, AI<S, G, M, A>>> {
  return makeInjected(
    BaseGettersImpl,
    BaseMutationsImpl,
    BaseActionsImpl
  ).and(key, module as ModuleImpl) as any
}
