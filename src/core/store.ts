import { Dictionary, BG0, BM0, BA0 } from './interface'
import { ModuleImpl, ModuleProxyImpl } from './module'
import { assert, forEachValues } from '../utils'

interface ModuleMap {
  [key: string]: {
    path: string[]
    module: ModuleImpl
    proxy: ModuleProxyImpl
  }
}

export type Subscriber<S> = (mutationPath: string[], payload: any[], state: S) => void

export interface Store<S, G extends BG0, M extends BM0, A extends BA0> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A

  subscribe (fn: Subscriber<S>): () => void
}

export class StoreImpl implements Store<{}, BG0, BM0, BA0> {
  private moduleMap: ModuleMap = {}
  private subscribers: Subscriber<{}>[] = []

  state: {}
  getters: BG0
  mutations: BM0
  actions: BA0

  constructor (module: ModuleImpl) {
    this.registerModule(module)
  }

  subscribe (fn: Subscriber<{}>): () => void {
    this.subscribers.push(fn)
    return () => {
      this.subscribers.splice(this.subscribers.indexOf(fn), 1)
    }
  }

  registerModule (module: ModuleImpl): void {
    this.registerModuleLoop([], module)

    const assets = this.initModuleAssets([], module)
    this.state = assets.state
    this.getters = assets.getters
    this.mutations = assets.mutations
    this.actions = assets.actions
  }

  getProxy (module: ModuleImpl): ModuleProxyImpl | null {
    const map = this.moduleMap[module.uid]
    if (map == null) return null
    return map.proxy
  }

  private registerModuleLoop (path: string[], module: ModuleImpl): void {
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
    module: ModuleImpl
  ): {
    state: {},
    getters: BG0,
    mutations: BM0,
    actions: BA0
  } {
    const assets = {
      state: module.initState(),
      getters: module.initGetters(this),
      mutations: module.initMutations(this, (name, desc) => {
        return this.hookMutation(path.concat(name), desc)
      }),
      actions: module.initActions(this)
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

  private hookMutation (path: string[], desc: PropertyDescriptor): PropertyDescriptor {
    const original = desc.value as Function
    desc.value = (...args: any[]) => {
      original(...args)
      this.subscribers.forEach(fn => fn(path, args, this.state))
    }
    return desc
  }
}

