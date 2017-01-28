import { Dictionary, BG0, BM0, BA0 } from './interface'
import { ModuleImpl, ModuleProxyImpl } from './module'
import { assert } from '../utils'

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

export class StoreImpl implements Store<{}, BG0, BM0, BA0> {
  private moduleMap: ModuleMap = {}

  state: {}
  getters: BG0
  mutations: BM0
  actions: BA0

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
        state[key],
        getters[key],
        mutations[key],
        actions[key],
        module.children[name]
      )
    })
  }
}

