import {
  BaseClass,
  BG, BM, BA,
  BG0, BM0, BA0,
  BG1, BA1
} from './base'

import { StoreImpl } from './store'

import {
  Class, Dictionary, CHD,
  assert, identity, getByPath, bind, isPromise
} from '../utils'

export type Transformer = (desc: PropertyDescriptor, key: string) => PropertyDescriptor

export interface ModuleOptions<S, G extends BG0, M extends BM0, A extends BA0> {
  state?: Class<S>
  getters?: Class<G>
  mutations?: Class<M>
  actions?: Class<A>
}

export interface Module<S, G extends BG0, M extends BM0, A extends BA0> {
  child<K extends string, S1, G1 extends BG0, M1 extends BM0, A1 extends BA0> (
    key: K,
    module: Module<S1, G1, M1, A1>
  ): Module<S & CHD<K, S1>, G & CHD<K, G1>, M & CHD<K, M1>, A & CHD<K, A1>>
}

export class ModuleImpl implements Module<{}, BG0, BM0, BA0> {
  children: Dictionary<ModuleImpl> = {}
  State: Class<{}> | undefined
  Getters: BaseClass<BG0> | undefined
  Mutations: BaseClass<BM0> | undefined
  Actions: BaseClass<BA0> | undefined

  constructor (
    public uid: number,
    { state, getters, mutations, actions }: ModuleOptions<{}, BG0, BM0, BA0>
  ) {
    this.State = state
    this.Getters = getters
    this.Mutations = mutations
    this.Actions = actions
  }

  initState (): {} {
    return this.State ? new this.State() : {}
  }

  initGetters (store: StoreImpl, transformer: Transformer = identity): BG0 {
    if (!this.Getters) return {} as BG0

    const getters = new this.Getters(this, store)

    traverseDescriptors(this.Getters.prototype, BG, (desc, key) => {
      if (process.env.NODE_ENV !== 'production') {
        assert(desc.set === undefined, 'Getters should not have any setters')
      }

      if (typeof desc.get === 'function') {
        const original = desc.get
        desc.get = function boundGetterFn () {
          return original.call(getters)
        }
      } else if (typeof desc.value === 'function') {
        const original = desc.value
        desc.value = function boundGetterFn () {
          return original.apply(getters, arguments)
        }
      } else if (process.env.NODE_ENV !== 'production') {
        assert(false, 'Getters should not have other than getter properties or methods')
      }

      Object.defineProperty(getters, key, transformer(desc, key))
    })

    return getters
  }

  initMutations (store: StoreImpl, transformer: Transformer = identity): BM0 {
    if (!this.Mutations) return {} as BM0

    const mutations = new this.Mutations(this, store)

    traverseDescriptors(this.Mutations.prototype, BM, (desc, key) => {
      if (process.env.NODE_ENV !== 'production') {
        assert(typeof desc.value === 'function', 'Mutations should only have functions')
      }

      const original = desc.value
      desc.value = function boundMutationFn () {
        const r = original.apply(mutations, arguments)
        if (process.env.NODE_ENV !== 'production') {
          assert(r === undefined, 'Mutations should not return anything')
        }
      }

      Object.defineProperty(mutations, key, transformer(desc, key))
    })

    return mutations
  }

  initActions (store: StoreImpl, transformer: Transformer = identity): BA0 {
    if (!this.Actions) return {} as BA0

    const actions = new this.Actions(this, store)

    traverseDescriptors(this.Actions.prototype, BA, (desc, key) => {
      if (process.env.NODE_ENV !== 'production') {
        assert(typeof desc.value === 'function', 'Actions should only have functions')
      }

      const original = desc.value
      desc.value = function boundMutationFn () {
        const r = original.apply(actions, arguments)
        if (process.env.NODE_ENV !== 'production') {
          assert(
            r === undefined || isPromise(r),
            'Actions should not return other than Promise'
          )
        }
        return r
      }

      Object.defineProperty(actions, key, transformer(desc, key))
    })

    return actions
  }

  child (key: string, module: ModuleImpl): this {
    if (process.env.NODE_ENV !== 'production') {
      assert(!(key in this.children), `${key} is already used in the module`)
    }
    this.children[key] = module
    return this
  }
}

export class ModuleProxy {
  constructor (
    private path: string[],
    private store: StoreImpl
  ) {}

  get state () {
    return getByPath<{}>(this.path, this.store.state)
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

export function module<S, G extends BG1<S>, M extends BM<S>, A extends BA1<S, G, M>> (
  options: ModuleOptions<S, G, M, A> = {}
): Module<S, G, M, A> {
  return new ModuleImpl(++uid, options)
}

function traverseDescriptors (
  proto: Object,
  Base: Function,
  fn: (desc: PropertyDescriptor, key: string) => void
): void {
  if (proto.constructor === Base) {
    return
  }

  Object.getOwnPropertyNames(proto).forEach(key => {
    if (key === 'constructor') return

    const desc = Object.getOwnPropertyDescriptor(proto, key)
    fn(desc, key)
  })

  traverseDescriptors(Object.getPrototypeOf(proto), Base, fn)
}
