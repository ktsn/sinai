import { createApp, h, nextTick } from 'vue'
import {
  module,
  store,
  Getters,
  Mutations,
  createMapper,
  Actions,
} from '../../src'
import { describe, expect, it, vitest } from 'vitest'
import assert from 'assert'

describe('Vue integration', () => {
  it('has reactive state', () => {
    class FooState {
      value = 1
    }
    class FooMutations extends Mutations<FooState>() {
      inc() {
        this.state.value += 1
      }
    }

    const s = store(
      module({
        state: FooState,
        mutations: FooMutations,
      }),
    )

    const c: any = createApp({
      computed: {
        test(): number {
          return this.$store.state.value
        },
      },
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(c.test === 1)
    s.mutations.inc()
    assert(c.test === 2)
  })

  it('has reactive getters', () => {
    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      get twice() {
        return this.state.value * 2
      }
    }
    class FooMutations extends Mutations<FooState>() {
      inc() {
        this.state.value += 1
      }
    }

    const s = store(
      module({
        state: FooState,
        getters: FooGetters,
        mutations: FooMutations,
      }),
    )

    const c: any = createApp({
      computed: {
        test(): number {
          return this.$store.getters.twice
        },
      },
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(c.test === 2)
    s.mutations.inc()
    assert(c.test === 4)
  })

  it('propagates store object to all descendants', () => {
    const spy1 = vitest.fn()
    const spy2 = vitest.fn()

    const s = store(
      module({
        state: class {
          value = 123
        },
      }),
    )

    const Grandchild = {
      created(this: any) {
        assert(this.$store.state.value === 123)
        spy1()
      },
      render: () => h('div', {}, ['test']),
    }

    const Child = {
      created(this: any) {
        assert(this.$store.state.value === 123)
        spy2()
      },
      render: () => h(Grandchild),
    }

    createApp({
      render: () => h(Child),
    })
      .use(s)
      .mount(document.createElement('div'))

    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })

  it('watches state change', async () => {
    const spy1 = vitest.fn()
    const spy2 = vitest.fn()

    class FooState {
      value = 123
    }

    const foo = module({
      state: FooState,
      getters: class extends Getters<FooState>() {
        get ten() {
          return 10
        }
      },
    })

    const bar = module({
      state: class {
        value = 567
      },
    }).child('foo', foo)

    const s = store(bar)

    s.watch(
      (state, getters) => {
        assert(getters.foo.ten === 10)
        return state.foo.value
      },
      (newState, oldState) => {
        assert(oldState === 123)
        assert(newState === 124)
        spy1()
      },
    )

    s.watch(
      (state) => {
        return state.value
      },
      (newValue, oldValue) => {
        assert(oldValue === 567)
        assert(newValue === 568)
        spy2()
      },
    )

    s.state.foo.value += 1
    s.state.value += 1
    await nextTick()

    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })

  it('caches getters of property getter with Vue', () => {
    const spy = vitest.fn()

    class FooState {
      value = 'foo'
    }
    class FooGetters extends Getters<FooState>() {
      get test() {
        spy()
        return this.state.value + 'bar'
      }
    }

    const s = store(
      module({
        state: FooState,
        getters: FooGetters,
      }),
    )

    expect(spy).not.toHaveBeenCalled()
    assert(s.getters.test === 'foobar')
    assert(s.getters.test === 'foobar')
    assert(s.getters.test === 'foobar')
    expect(spy).toHaveBeenCalledTimes(1)
    s.state.value = 'bar'
    expect(s.getters.test).toBe('barbar')
    expect(s.getters.test).toBe('barbar')
    expect(s.getters.test).toBe('barbar')
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('track getters dependencies after replacing state', () => {
    class FooState {
      foo = 'foo'
    }

    class FooGetters extends Getters<FooState>() {
      get foobar() {
        return this.state.foo + 'bar'
      }
    }

    const s = store(
      module({
        state: FooState,
        getters: FooGetters,
      }),
    )

    assert(s.getters.foobar === 'foobar')
    s.replaceState({ foo: 'bar' })
    expect(s.getters.foobar).toBe('barbar')
  })

  it('should not throw on hmr even if strict mode is enabled', () => {
    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      test() {
        return this.state.value + 1
      }
    }

    const m = module({
      state: FooState,
      getters: FooGetters,
    })
    const s = store(m, {
      strict: true,
    })

    assert.doesNotThrow(() => {
      s.hotUpdate(m)
    })
  })

  it('binds store state to component', () => {
    class FooState {
      value = 123
    }

    const m = module({
      state: FooState,
    })

    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      computed: binder.mapState(['value']),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(vm.value === s.state.value)
  })

  it('binds store state with object syntax', () => {
    class FooState {
      value = 123
    }
    const m = module({
      state: FooState,
    })

    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      computed: binder.mapState({
        test: 'value',
      }),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(vm.test === s.state.value)
  })

  it('binds a getter to a component', () => {
    class FooState {
      value = 10
    }
    class FooGetters extends Getters<FooState>() {
      get double(): number {
        return this.state.value * 2
      }
    }

    const m = module({
      state: FooState,
      getters: FooGetters,
    })
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      computed: binder.mapGetters(['double']),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(vm.double === s.getters.double)
  })

  it('binds a getter with object syntax', () => {
    class FooState {
      value = 10
    }
    class FooGetters extends Getters<FooState>() {
      get double(): number {
        return this.state.value * 2
      }
    }

    const m = module({
      state: FooState,
      getters: FooGetters,
    })
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      computed: binder.mapGetters({
        test: 'double',
      }),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(vm.test === s.getters.double)
  })

  it('binds a mutation to a component', () => {
    class FooState {
      value = 10
    }
    class FooMutations extends Mutations<FooState>() {
      inc(): void {
        this.state.value++
      }
    }

    const m = module({
      state: FooState,
      mutations: FooMutations,
    })
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      methods: binder.mapMutations(['inc']),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    vm.inc()
    assert(s.state.value === 11)
  })

  it('binds a mutation with object syntax', () => {
    class FooState {
      value = 10
    }
    class FooMutations extends Mutations<FooState>() {
      inc(): void {
        this.state.value++
      }
    }

    const m = module({
      state: FooState,
      mutations: FooMutations,
    })
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      methods: binder.mapMutations({
        add: 'inc',
      }),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    vm.add()
    assert(s.state.value === 11)
  })

  it('binds an action to a component', async () => {
    class FooState {
      value = 10
    }
    class FooMutations extends Mutations<FooState>() {
      inc(): void {
        this.state.value++
      }
    }
    class FooActions extends Actions<FooState, FooMutations>() {
      async asyncInc(): Promise<void> {
        await wait(0)
        this.mutations.inc()
      }
    }

    const m = module({
      state: FooState,
      mutations: FooMutations,
      actions: FooActions,
    })
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      methods: binder.mapActions(['asyncInc']),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    await vm.asyncInc()
    assert(s.state.value === 11)
  })

  it('binds an action with object syntax', async () => {
    class FooState {
      value = 10
    }
    class FooMutations extends Mutations<FooState>() {
      inc(): void {
        this.state.value++
      }
    }
    class FooActions extends Actions<FooState, FooMutations>() {
      async asyncInc(): Promise<void> {
        await wait(0)
        this.mutations.inc()
      }
    }

    const m = module({
      state: FooState,
      mutations: FooMutations,
      actions: FooActions,
    })
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      methods: binder.mapActions({
        inc: 'asyncInc',
      }),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    await vm.inc()
    assert(s.state.value === 11)
  })

  it('binds child store state to component', () => {
    class FooState {
      value = 123
    }

    const foo = module({
      state: FooState,
    })
    const m = module().child('test', foo)
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      computed: binder.module('test').mapState(['value']),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))

    assert(vm.value === s.state.test.value)
  })

  it('binds nested store mutation to component', () => {
    class FooState {
      value = 123
    }
    const foo = module({
      state: FooState,
    })

    class BarState {
      test = 'value'
    }
    class BarMutations extends Mutations<BarState>() {
      update(value: string): void {
        this.state.test = value
      }
    }
    const bar = module({
      state: BarState,
      mutations: BarMutations,
    })

    const m = module().child('foo', foo.child('bar', bar))
    const s = store(m)
    const binder = createMapper<typeof s>()

    const vm: any = createApp({
      methods: binder.module('foo').module('bar').mapMutations({
        assign: 'update',
      }),
      render: () => {},
    })
      .use(s)
      .mount(document.createElement('div'))
    vm.assign('updated')
    assert(s.state.foo.bar.test === 'updated')
  })
})

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
