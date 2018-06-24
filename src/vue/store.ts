import Vue, { WatchOptions, ComponentOptions as _ComponentOptions } from 'vue'
import { BG0, BM0, BA0 } from '../core/base'
import { Module, ModuleImpl } from '../core/module'
import { Store, StoreImpl, Subscriber } from '../core/store'
import { devtoolPlugin } from '../adapters/devtool-plugin'
import { assert } from '../utils'

let _Vue: typeof Vue

export type Plugin<S, G extends BG0, M extends BM0, A extends BA0> = (store: VueStore<S, G, M, A>) => void

export interface VueStoreOptions<S, G extends BG0, M extends BM0, A extends BA0> {
  strict?: boolean
  plugins?: Plugin<S, G, M, A>[]
}

export interface VueStore<S, G extends BG0, M extends BM0, A extends BA0> extends Store<S, G, M, A> {
  watch<R> (
    getter: (state: S, getters: G) => R,
    cb: (newState: R, oldState: R) => void,
    options?: WatchOptions
  ): () => void
}

export class VueStoreImpl implements VueStore<{}, BG0, BM0, BA0> {
  private innerStore: StoreImpl
  private vm!: Vue & { $data: { state: {} }}
  private watcher: Vue
  private gettersForComputed: Record<string, () => any> = {}
  private strict: boolean

  constructor (module: ModuleImpl, options: VueStoreOptions<{}, BG0, BM0, BA0>) {
    if (process.env.NODE_ENV !== 'production') {
      assert(_Vue, 'Must install Sinai by Vue.use before instantiate a store')
    }

    this.strict = Boolean(options.strict)

    this.innerStore = new StoreImpl(module, {
      transformGetter: this.transformGetter.bind(this),
      transformMutation: this.transformMutation.bind(this)
    })

    this.setupStoreVM()
    this.watcher = new _Vue()

    // Override the innerStore's state to point to VueStore's state
    // The state can do not be reactive sometimes if not do this
    Object.defineProperty(this.innerStore, 'state', {
      get: () => this.state,
      set: (value: {}) => {
        this.vm.$data.state = value
      }
    })

    if (this.strict) {
      this.watch(
        state => state,
        () => {
          assert(
            !this.strict,
            'Must not update state out of mutations when strict mode is enabled.'
          )
        },
        { deep: true, sync: true } as WatchOptions
      )
    }

    const plugins = options.plugins || []
    if (process.env.NODE_ENV !== 'production' && _Vue.config.devtools) {
      plugins.push(devtoolPlugin)
    }
    plugins.forEach(plugin => plugin(this))
  }

  get state () {
    return this.vm.$data.state
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

  replaceState (state: {}): void {
    this.commit(() => {
      this.vm.$data.state = state
    })
  }

  subscribe (fn: Subscriber<{}>): () => void {
    return this.innerStore.subscribe(fn)
  }

  watch<R> (
    getter: (state: {}, getters: BG0) => R,
    cb: (newState: R, oldState: R) => void,
    options?: WatchOptions
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
    }) as Vue & { $data: { state: {} }}

    // Ensure to re-evaluate getters for hot update
    if (oldVM != null) {
      this.commit(() => {
        oldVM.$data.state = null as any
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
  options: VueStoreOptions<S, G, M, A> = {}
): VueStore<S, G, M, A> {
  return new VueStoreImpl(
    module as ModuleImpl,
    options as VueStoreOptions<{}, BG0, BM0, BA0>
  ) as VueStore<any, any, any, any>
}

export function install (InjectedVue: typeof Vue): void {
  if (process.env.NODE_ENV !== 'production') {
    assert(!_Vue, 'Sinai is already installed')
  }
  _Vue = InjectedVue
  _Vue.mixin({
    beforeCreate: sinaiInit
  })
}

function sinaiInit (this: Vue): void {
  type Component = Vue & { $store: VueStore<{}, BG0, BM0, BA0>, $parent: Component }
  type ComponentOptions = _ComponentOptions<Vue> & { store?: VueStore<{}, BG0, BM0, BA0> }

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
