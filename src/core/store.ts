import { BG0, BM0, BA0 } from './interface'
import { ModuleImpl, ModuleProxyImpl } from './module'
import { assert, identity, bind, forEachValues } from '../utils'

interface ModuleMap {
  [key: string]: {
    path: string[]
    module: ModuleImpl<{}, BG0, BM0, BA0>
    proxy: ModuleProxyImpl<{}, BG0, BM0, BA0>
  }
}

export type Transformer = (desc: PropertyDescriptor, path: string[]) => PropertyDescriptor

export interface StoreOptions {
  transformGetter?: Transformer
  transformMutation?: Transformer
  transformAction?: Transformer
}

export type Subscriber<S> = (mutationPath: string[], payload: any[], state: S) => void

export interface Store<S, G extends BG0, M extends BM0, A extends BA0> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A

  subscribe (fn: Subscriber<S>): () => void
}

export class StoreImpl<S, G extends BG0, M extends BM0, A extends BA0> implements Store<S, G, M, A> {
  private moduleMap: ModuleMap = {}
  private subscribers: Subscriber<{}>[] = []
  private transformGetter: Transformer
  private transformMutation: Transformer
  private transformAction: Transformer

  state: S
  getters: G
  mutations: M
  actions: A

  constructor (module: ModuleImpl<S, G, M, A>, options: StoreOptions = {}) {
    this.transformGetter = options.transformGetter || identity
    this.transformMutation = options.transformMutation || identity
    this.transformAction = options.transformAction || identity

    this.registerModule(module)
  }

  subscribe (fn: Subscriber<{}>): () => void {
    this.subscribers.push(fn)
    return () => {
      this.subscribers.splice(this.subscribers.indexOf(fn), 1)
    }
  }

  registerModule (module: ModuleImpl<S, G, M, A>): void {
    this.registerModuleLoop([], module)

    const assets = this.initModuleAssets([], module)
    this.state = assets.state as S
    this.getters = assets.getters as G
    this.mutations = assets.mutations as M
    this.actions = assets.actions as A
  }

  getProxy (module: ModuleImpl<{}, BG0, BM0, BA0>): ModuleProxyImpl<{}, BG0, BM0, BA0> | null {
    const map = this.moduleMap[module.uid]
    if (map == null) return null
    return map.proxy
  }

  private registerModuleLoop (path: string[], module: ModuleImpl<{}, BG0, BM0, BA0>): void {
    assert(
      !(module.uid in this.moduleMap),
      'The module is already registered. The module object must not be re-used in twice or more'
    )

    this.moduleMap[module.uid] = {
      path,
      module,
      proxy: new ModuleProxyImpl(path, this)
    }

    Object.keys(module.children).forEach(name => {
      this.registerModuleLoop(
        path.concat(name),
        module.children[name]
      )
    })
  }

  private initModuleAssets (
    path: string[],
    module: ModuleImpl<{}, BG0, BM0, BA0>
  ): {
    state: {},
    getters: BG0,
    mutations: BM0,
    actions: BA0
  } {
    const assets = {
      state: module.initState(),
      getters: module.initGetters(
        this,
        chainTransformer(path, this.transformGetter)
      ),
      mutations: module.initMutations(
        this,
        chainTransformer(path, bind(this, this.hookMutation))
      ),
      actions: module.initActions(
        this,
        chainTransformer(path, this.transformAction)
      )
    }

    forEachValues(module.children, (childModule, key) => {
      const child = this.initModuleAssets(path.concat(key), childModule)
      assets.state[key] = child.state
      assets.getters[key] = child.getters
      assets.mutations[key] = child.mutations
      assets.actions[key] = child.actions
    })

    return assets
  }

  private hookMutation (desc: PropertyDescriptor, path: string[]): PropertyDescriptor {
    const original = desc.value as Function
    desc.value = (...args: any[]) => {
      original(...args)
      this.subscribers.forEach(fn => fn(path, args, this.state))
    }
    return this.transformMutation(desc, path)
  }
}

function chainTransformer (
  path: string[],
  transform: Transformer
): (desc: PropertyDescriptor, name: string) => PropertyDescriptor {
  return function chainedTransformer (desc, name) {
    return transform(desc, path.concat(name))
  }
}
