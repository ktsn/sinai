import * as Vue from 'vue'
import { BG0, BM0, BA0 } from './core/interface'
import { Module, ModuleImpl } from './core/module'
import { Store, StoreImpl } from './core/store'
import { assert } from './utils'

let _Vue: typeof Vue | undefined

export class VueStore<S, G extends BG0, M extends BM0, A extends BA0> {
  private vm: Vue & { state: S }

  constructor (private store: Store<S, G, M, A>) {
    assert(_Vue, 'Must install Brave by Vue.use before instanciate a store')
    this.vm = new _Vue!({
      data: {
        state: store.state
      }
    }) as Vue & { state: S }
  }

  get state (): S {
    return this.vm.state
  }

  get getters (): G {
    return this.store.getters
  }

  get mutations (): M {
    return this.store.mutations
  }

  get actions (): A {
    return this.store.actions
  }
}

export function store<S, G extends BG0, M extends BM0, A extends BA0> (
  module: Module<S, G, M, A>
): VueStore<S, G, M, A> {
  const store = new StoreImpl(module as ModuleImpl)
  return new VueStore(store) as VueStore<S, G, M, A>
}

export function install (InjectedVue: typeof Vue): void {
  assert(!_Vue, 'Brave is already installed')
  _Vue = InjectedVue
  _Vue.mixin({
    beforeCreate: braveInit
  })
}

function braveInit (this: Vue): void {
  type Component = Vue & { $store: VueStore<{}, BG0, BM0, BA0>, $parent: Component }
  type ComponentOptions = Vue.ComponentOptions<Vue> & { store?: VueStore<{}, BG0, BM0, BA0> }

  const vm = this as Component
  const { store } = vm.$options as ComponentOptions

  if (store) {
    vm.$store = store
    return
  }

  if (vm.$parent && vm.$parent.$store) {
    vm.$store = vm.$parent.$store
  }
}
