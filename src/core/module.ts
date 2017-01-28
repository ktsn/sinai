import {
  Class, Dictionary, CHD,
  BG0, BM0, BA0,
  BG1, BM, BA1
} from './interface'

import {
  BaseClass,
  BaseGettersImpl,
  BaseMutationsImpl,
  BaseActionsImpl
} from './inject'

import { StoreImpl } from './store'
import { assert, getByPath } from '../utils'

export interface ModuleOptions<S, G extends BG0, M extends BM0, A extends BA0> {
  state?: Class<S>
  getters?: Class<G>
  mutations?: Class<M>
  actions?: Class<A>
}

export interface Module<S, G extends BG0, M extends BM0, A extends BA0> {
  module<K extends string, S1, G1 extends BG0, M1 extends BM0, A1 extends BA0> (
    key: K,
    module: Module<S1, G1, M1, A1>
  ): Module<S & CHD<K, S1>, G & CHD<K, G1>, M & CHD<K, M1>, A & CHD<K, A1>>
}

export interface ModuleProxy<S, G extends BG0, M extends BM0, A extends BA0> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A
}

export class ModuleImpl implements Module<{}, BG0, BM0, BA0> {
  children: Dictionary<ModuleImpl> = {}
  State: Class<{}> | undefined
  Getters: BaseClass<BaseGettersImpl> | undefined
  Mutations: BaseClass<BaseMutationsImpl> | undefined
  Actions: BaseClass<BaseActionsImpl> | undefined

  constructor (
    public uid: number,
    { state, getters, mutations, actions }: ModuleOptions<{}, BG0, BM0, BA0>
  ) {
    this.State = state
    this.Getters = getters as BaseClass<BaseGettersImpl>
    this.Mutations = mutations as BaseClass<BaseMutationsImpl>
    this.Actions = actions as BaseClass<BaseActionsImpl>
  }

  initState (): {} {
    return this.State ? new this.State() : {}
  }

  initGetters (store: StoreImpl): BG0 {
    return this.Getters ? new this.Getters(this, store) : {} as BG0
  }

  initMutations (store: StoreImpl): BM0 {
    return this.Mutations ? new this.Mutations(this, store) : {} as BM0
  }

  initActions (store: StoreImpl): BA0 {
    return this.Actions ? new this.Actions(this, store) : {} as BA0
  }

  module (key: string, module: ModuleImpl): ModuleImpl {
    assert(!(key in this.children), `${key} is already used in the module`)
    this.children[key] = module
    return this
  }
}

export class ModuleProxyImpl implements ModuleProxy<{}, BG0, BM0, BA0> {
  constructor (
    private path: string[],
    private store: StoreImpl
  ) {}

  get state () {
    return getByPath(this.path, this.store.state)
  }

  get getters () {
    return getByPath<BG0>(this.path, this.store.getters)
  }

  get mutations () {
    return getByPath<BM0>(this.path, this.store.mutations)
  }

  get actions () {
    return getByPath<BA0>(this.path, this.store.actions)
  }
}

let uid = 0

export function create<S, G extends BG1<S>, M extends BM<S>, A extends BA1<S, G, M>> (
  options: ModuleOptions<S, G, M, A> = {}
): Module<S, G, M, A> {
  return new ModuleImpl(++uid, options)
}
