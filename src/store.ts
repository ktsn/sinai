import { Dictionary } from './interface'
import { Module, ModuleImpl, ModuleProxyImpl } from './module'
import { assert } from './utils'

interface ModuleMap {
  [key: string]: {
    path: string[]
    module: ModuleImpl
    proxy: ModuleProxyImpl
  }
}

export interface Store<S, G, M, A> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A
}

export class StoreImpl implements Store<{}, {}, {}, {}> {
  private moduleMap: ModuleMap = {}

  state: {}
  getters: {}
  mutations: {}
  actions: {}

  constructor (module: ModuleImpl) {
    this.registerModule(module)
  }

  registerModule (module: ModuleImpl): void {
    this.registerModuleLoop([], module)

    // Root module
    module.initState('state', this)
    module.initGetters('getters', this, this)
    module.initMutations('mutations', this, this)
    module.initActions('actions', this, this)

    Object.keys(module.children).forEach(name => {
      this.initModuleAssets(
        [name],
        this.state,
        this.getters,
        this.mutations,
        this.actions,
        module.children[name]
      )
    })
  }

  getProxy (module: ModuleImpl): ModuleProxyImpl | null {
    const map = this.moduleMap[module.uid]
    if (map == null) return null
    return map.proxy
  }

  private registerModuleLoop (path: string[], module: ModuleImpl): void {
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
    state: {},
    getters: {},
    mutations: {},
    actions: {},
    module: ModuleImpl
  ): void {
    const key = path[path.length - 1]
    module.initState(key, state)
    module.initGetters(key, getters, this)
    module.initMutations(key, mutations, this)
    module.initActions(key, actions, this)

    Object.keys(module.children).forEach(name => {
      this.initModuleAssets(
        path.concat(name),
        state[name] = {},
        getters[name] = {},
        mutations[name] = {},
        actions[name] = {},
        module.children[name]
      )
    })
  }
}

export function store<S, G, M, A> (
  module: Module<S, G, M, A>
): Store<S, G, M, A> {
  return new StoreImpl(module as ModuleImpl) as any
}

