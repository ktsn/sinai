import {
  App,
  ComputedRef,
  Ref,
  WatchOptions,
  ComponentOptions as _ComponentOptions,
  computed,
  ref,
  watch,
} from 'vue'
import { BG0, BM0, BA0 } from '../core/base'
import { Module, ModuleImpl } from '../core/module'
import { Store, StoreImpl, Subscriber } from '../core/store'
import { assert } from '../utils'

export type Plugin<S, G extends BG0, M extends BM0, A extends BA0> = (
  store: VueStore<S, G, M, A>,
) => void

export interface VueStoreOptions<
  S,
  G extends BG0,
  M extends BM0,
  A extends BA0,
> {
  strict?: boolean
  plugins?: Plugin<S, G, M, A>[]
}

export interface VueStore<S, G extends BG0, M extends BM0, A extends BA0>
  extends Store<S, G, M, A> {
  watch<R>(
    getter: (state: S, getters: G) => R,
    cb: (newState: R, oldState: R | undefined) => void,
    options?: WatchOptions,
  ): () => void
  install(app: App): void
}

export class VueStoreImpl implements VueStore<unknown, BG0, BM0, BA0> {
  private innerStore: StoreImpl
  private _state!: Ref<unknown>
  private _getters: Record<string, ComputedRef<unknown>> = {}
  private strict: boolean

  constructor(
    module: ModuleImpl,
    options: VueStoreOptions<unknown, BG0, BM0, BA0>,
  ) {
    this.strict = Boolean(options.strict)

    this.innerStore = new StoreImpl(module, {
      transformGetter: this.transformGetter.bind(this),
      transformMutation: this.transformMutation.bind(this),
    })

    this.setupStoreVM()

    // Override the innerStore's state to point to VueStore's state
    // The state can do not be reactive sometimes if not do this
    Object.defineProperty(this.innerStore, 'state', {
      get: () => this._state.value,
      set: (value: {}) => {
        this._state.value = value
      },
    })

    if (this.strict) {
      this.watch(
        (state) => state,
        () => {
          assert(
            !this.strict,
            'Must not update state out of mutations when strict mode is enabled.',
          )
        },
        { deep: true, flush: 'sync' },
      )
    }

    const plugins = options.plugins || []
    plugins.forEach((plugin) => plugin(this))
  }

  get state() {
    return this._state.value
  }

  get getters() {
    return this.innerStore.getters
  }

  get mutations() {
    return this.innerStore.mutations
  }

  get actions() {
    return this.innerStore.actions
  }

  replaceState(state: {}): void {
    this.commit(() => {
      this._state.value = state
    })
  }

  subscribe(fn: Subscriber<unknown>): () => void {
    return this.innerStore.subscribe(fn)
  }

  watch<R>(
    getter: (state: unknown, getters: BG0) => R,
    cb: (newState: R, oldState: R | undefined) => void,
    options?: WatchOptions,
  ): () => void {
    return watch(
      () => getter(this.state, this.getters),
      (newState, oldState) => cb(newState, oldState),
      options,
    )
  }

  hotUpdate(module: ModuleImpl): void {
    this._getters = {}
    this.innerStore.hotUpdate(module)
    this.setupStoreVM()
  }

  install(app: App): void {
    const store = this

    app.mixin({
      beforeCreate() {
        this.$store = store
      },
    })
  }

  private transformGetter(
    desc: PropertyDescriptor,
    path: string[],
  ): PropertyDescriptor {
    if (typeof desc.get !== 'function') return desc

    const name = path.join('.')
    this._getters[name] = computed(desc.get)

    desc.get = () => this._getters[name].value

    return desc
  }

  private transformMutation(desc: PropertyDescriptor): PropertyDescriptor {
    if (!this.strict) return desc

    const original = desc.value as Function
    desc.value = (...args: any[]) => {
      this.commit(() => original.apply(null, args))
    }
    return desc
  }

  private setupStoreVM(): void {
    const oldState = this._state

    this._state = ref(this.innerStore.state)

    // Ensure to re-evaluate getters for hot update
    if (oldState != null) {
      this.commit(() => {
        oldState.value = null as any
      })
    }
  }

  private commit(fn: () => void): void {
    const original = this.strict
    this.strict = false
    fn()
    this.strict = original
  }
}

export function store<S, G extends BG0, M extends BM0, A extends BA0>(
  module: Module<S, G, M, A>,
  options: VueStoreOptions<S, G, M, A> = {},
): VueStore<S, G, M, A> {
  return new VueStoreImpl(
    module as ModuleImpl,
    options as VueStoreOptions<unknown, BG0, BM0, BA0>,
  ) as VueStore<any, any, any, any>
}
