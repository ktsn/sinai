import * as Vue from 'vue'
import { BG0, BM0, BA0 } from './core/base'
import { Module, ModuleImpl } from './core/module'
import { Store, StoreImpl, Subscriber } from './core/store'
import { Dictionary, assert, bind } from './utils'

let _Vue: typeof Vue

export interface VueStoreOptions {
  strict?: boolean
}

export interface VueStore<S, G extends BG0, M extends BM0, A extends BA0> extends Store<S, G, M, A> {
  watch<R> (
    getter: (state: S, getters: G) => R,
    cb: (newState: R, oldState: R) => void,
    options?: Vue.WatchOptions
  ): () => void
}

export class VueStoreImpl implements VueStore<{}, BG0, BM0, BA0> {
  private innerStore: StoreImpl
  private vm: Vue & { state: {} }
  private watcher: Vue
  private gettersForComputed: Dictionary<() => any> = {}
  private strict: boolean

  constructor (module: ModuleImpl, options: VueStoreOptions) {
    if (process.env.NODE_ENV !== 'production') {
      assert(_Vue, 'Must install Brave by Vue.use before instantiate a store')
    }

    this.strict = Boolean(options.strict)

    this.innerStore = new StoreImpl(module, {
      transformGetter: bind(this, this.transformGetter),
      transformMutation: bind(this, this.transformMutation)
    })

    this.setupStoreVM()
    this.watcher = new _Vue()

    if (this.strict) {
      this.watch(
        state => state,
        () => {
          assert(
            !this.strict,
            'Must not update state out of mutations when strict mode is enabled.'
          )
        },
        { deep: true, sync: true } as Vue.WatchOptions
      )
    }
  }

  get state () {
    return this.vm.state
  }

  get getters () {
    return this.innerStore.getters
  }

  get mutations () {
    return this.innerStore.mutations
  }

  get actions () {
    return this.innerStore.actions
  }

  subscribe (fn: Subscriber<{}>): () => void {
    return this.innerStore.subscribe(fn)
  }

  watch (
    getter: (state: {}, getters: BG0) => {},
    cb: (newState: {}, oldState: {}) => void,
    options?: Vue.WatchOptions
  ): () => void {
    return this.watcher.$watch(
      () => getter(this.state, this.getters),
      cb,
      options
    )
  }

  hotUpdate (module: ModuleImpl): void {
    this.gettersForComputed = {}
    this.innerStore.hotUpdate(module)
    this.setupStoreVM()
  }

  private transformGetter (desc: PropertyDescriptor, path: string[]): PropertyDescriptor {
    if (typeof desc.get !== 'function') return desc

    const name = path.join('.')
    this.gettersForComputed[name] = desc.get

    desc.get = () => this.vm[name]

    return desc
  }

  private transformMutation (desc: PropertyDescriptor): PropertyDescriptor {
    if (!this.strict) return desc

    const original = desc.value as Function
    desc.value = (...args: any[]) => {
      this.commit(() => original.apply(null, args))
    }
    return desc
  }

  private setupStoreVM (): void {
    const oldVM = this.vm

    this.vm = new _Vue({
      data: {
        state: this.innerStore.state
      },
      computed: this.gettersForComputed
    }) as Vue & { state: {} }

    // Ensure to re-evaluate getters for hot update
    if (oldVM != null) {
      this.commit(() => {
        oldVM.state = null as any
      })

      _Vue.nextTick(() => {
        oldVM.$destroy()
      })
    }
  }

  private commit (fn: () => void): void {
    const original = this.strict
    this.strict = false
    fn()
    this.strict = original
  }
}

export function store<S, G extends BG0, M extends BM0, A extends BA0> (
  module: Module<S, G, M, A>,
  options: VueStoreOptions = {}
): VueStore<S, G, M, A> {
  return new VueStoreImpl(
    module as ModuleImpl,
    options
  ) as VueStore<any, any, any, any>
}

export function install (InjectedVue: typeof Vue): void {
  if (process.env.NODE_ENV !== 'production') {
    assert(!_Vue, 'Brave is already installed')
  }
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

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    store?: VueStore<any, any, any, any>
  }
}
