import { BG0, BM0, BA0 } from './base'
import { Module, ModuleImpl, ModuleProxy } from './module'
import { assert, identity, forEachValues } from '../utils'

interface ModuleMap {
  [key: string]: {
    path: string[]
    module: ModuleImpl
    proxy: ModuleProxy
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

  replaceState (state: S): void
  subscribe (fn: Subscriber<S>): () => void
  hotUpdate (module: Module<S, G, M, A>): void
}

export class StoreImpl implements Store<{}, BG0, BM0, BA0> {
  private moduleMap: ModuleMap = {}
  private subscribers: Subscriber<{}>[] = []
  private transformGetter: Transformer
  private transformMutation: Transformer
  private transformAction: Transformer

  state!: {}
  getters!: BG0
  mutations!: BM0
  actions!: BA0

  constructor (module: ModuleImpl, options: StoreOptions = {}) {
    this.transformGetter = options.transformGetter || identity
    this.transformMutation = options.transformMutation || identity
    this.transformAction = options.transformAction || identity

    this.registerModule(module, false)
  }

  replaceState (state: {}): void {
    this.state = state
  }

  subscribe (fn: Subscriber<{}>): () => void {
    this.subscribers.push(fn)
    return () => {
      this.subscribers.splice(this.subscribers.indexOf(fn), 1)
    }
  }

  registerModule (module: ModuleImpl, isHot: boolean): void {
    this.registerModuleLoop([], module)

    const assets = this.initModuleAssets([], module)
    if (!isHot) {
      this.state = assets.state
    }
    this.getters = assets.getters
    this.mutations = assets.mutations
    this.actions = assets.actions
  }

  getProxy (module: ModuleImpl): ModuleProxy | null {
    const map = this.moduleMap[module.uid]
    if (map == null) return null
    return map.proxy
  }

  hotUpdate (module: ModuleImpl): void {
    this.moduleMap = {}
    this.registerModule(module, true)
  }

  private registerModuleLoop (path: string[], module: ModuleImpl): void {
    if (process.env.NODE_ENV !== 'production') {
      assert(
        !(module.uid in this.moduleMap),
        'The module is already registered. The module object must not be re-used in twice or more'
      )
    }

    this.moduleMap[module.uid] = {
      path,
      module,
      proxy: new ModuleProxy(path, this)
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
    module: ModuleImpl
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
        chainTransformer(path, this.hookMutation.bind(this))
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
    // desc.value must be a Function since
    // it should be already checked in each module
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
