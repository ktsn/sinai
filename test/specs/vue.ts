import assert = require('power-assert')
import sinon = require('sinon')
import Vue, { ComponentOptions, VNode } from 'vue'
import { module, store, Getters, Mutations, createVueBinder, Actions } from '../../src'

describe('Vue integration', () => {
  it('has reactive state', () => {
    class FooState {
      value = 1
    }
    class FooMutations extends Mutations<FooState>() {
      inc () {
        this.state.value += 1
      }
    }

    const s = store(module({
      state: FooState,
      mutations: FooMutations
    }))

    const c: any = new Vue({
      store: s,
      computed: {
        test (): number {
          return this.$store.state.value
        }
      }
    })

    assert(c.test === 1)
    s.mutations.inc()
    assert(c.test === 2)
  })

  it('has reactive getters', () => {
    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      get twice () {
        return this.state.value * 2
      }
    }
    class FooMutations extends Mutations<FooState>() {
      inc () {
        this.state.value += 1
      }
    }

    const s = store(module({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations
    }))

    const c: any = new Vue({
      store: s,
      computed: {
        test (): number {
          return this.$store.getters.twice
        }
      }
    })

    assert(c.test === 2)
    s.mutations.inc()
    assert(c.test === 4)
  })

  it('propagetes store object to all descendants', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()

    const s = store(module({
      state: class {
        value = 123
      }
    }))

    const Grandchild = Vue.extend({
      created (this: Vue) {
        assert(this.$store.state.value === 123)
        spy1()
      },
      render: h => h('div', 'test')
    })

    const Child = Vue.extend({
      created (this: Vue) {
        assert(this.$store.state.value === 123)
        spy2()
      },
      render: h => h(Grandchild)
    })

    new Vue({
      store: s,
      render: h => h(Child)
    }).$mount()

    assert(spy1.called)
    assert(spy2.called)
  })

  it('watches state change', done => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()

    class FooState {
      value = 123
    }

    const foo = module({
      state: FooState,
      getters: class extends Getters<FooState>() {
        get ten () { return 10 }
      }
    })

    const bar = module({
      state: class {
        value = 567
      }
    }).child('foo', foo)

    const s = store(bar)

    s.watch((state, getters) => {
      assert(getters.foo.ten === 10)
      return state.foo.value
    }, (newState, oldState) => {
      assert(oldState === 123)
      assert(newState === 124)
      spy1()
    })

    s.watch(state => {
      return state.value
    }, (newValue, oldValue) => {
      assert(oldValue === 567)
      assert(newValue === 568)
      spy2()
    })

    s.state.foo.value += 1
    s.state.value += 1
    Vue.nextTick(() => {
      assert(spy1.called)
      assert(spy2.called)
      done()
    })
  })

  it('caches getters of property getter with Vue', () => {
    const spy = sinon.spy()

    class FooState {
      value = 'foo'
    }
    class FooGetters extends Getters<FooState>() {
      get test () {
        spy()
        return this.state.value + 'bar'
      }
    }

    const s = store(module({
      state: FooState,
      getters: FooGetters
    }))

    assert(!spy.called)
    assert(s.getters.test === 'foobar')
    assert(s.getters.test === 'foobar')
    assert(s.getters.test === 'foobar')
    assert(spy.callCount === 1)
    s.state.value = 'bar'
    assert(s.getters.test === 'barbar')
    assert(s.getters.test === 'barbar')
    assert(s.getters.test === 'barbar')
    assert(spy.callCount === 2)
  })


  it('track getters dependencies after replacing state', () => {
    class FooState {
      foo = 'foo'
    }

    class FooGetters extends Getters<FooState>() {
      get foobar () {
        return this.state.foo + 'bar'
      }
    }

    const s = store(module({
      state: FooState,
      getters: FooGetters
    }))

    assert(s.getters.foobar === 'foobar')
    s.replaceState({ foo: 'bar' })
    assert(s.getters.foobar === 'barbar')
  })

  it('throws if mutate state out of mutations when strict mode', () => {
    class FooState {
      value = 1
    }
    class FooMutation extends Mutations<FooState>() {
      inc (n: number) {
        this.state.value += n
      }
    }
    const s = store(module({
      state: FooState,
      mutations: FooMutation
    }), {
      strict: true
    })

    // Should not throw
    s.mutations.inc(1)
    assert(s.state.value === 2)

    // Should throw
    Vue.config.silent = true
    const orgHandler = Vue.config.errorHandler
    try {
      const spy1 = Vue.config.errorHandler = sinon.spy()
      s.state.value += 10
      assert(spy1.called)
      const expected = /Must not update state out of mutations when strict mode is enabled/
      const msg = spy1.firstCall.args[0].toString()
      assert(expected.test(msg))
    }
    finally {
      Vue.config.errorHandler = orgHandler
      Vue.config.silent = false
    }
  })

  it('should not throw on hmr even if strict mode is enabled', () => {
    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      test () { return this.state.value + 1 }
    }

    const m = module({
      state: FooState,
      getters: FooGetters
    })
    const s = store(m, {
      strict: true
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
      state: FooState
    })

    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      computed: binder.mapState(['value'])
    })

    assert(vm.value === s.state.value)
  })

  it('binds store state with object syntax', () => {
    class FooState {
      value = 123
    }
    const m = module({
      state: FooState
    })

    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      computed: binder.mapState({
        test: 'value'
      })
    })

    assert(vm.test === s.state.value)
  })

  it('binds nested store state to component', () => {
    class FooState {
      value = 123
    }

    const foo = module({
      state: FooState
    })
    const m = module().child('test', foo)
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      computed: binder.module('test').mapState(['value'])
    })

    assert(vm.value === s.state.test.value)
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
      getters: FooGetters
    })
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      computed: binder.mapGetters(['double'])
    })

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
      getters: FooGetters
    })
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      computed: binder.mapGetters({
        test: 'double'
      })
    })

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
      mutations: FooMutations
    })
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      methods: binder.mapMutations(['inc'])
    })

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
      mutations: FooMutations
    })
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      methods: binder.mapMutations({
        add: 'inc'
      })
    })

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
      actions: FooActions
    })
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      methods: binder.mapActions(['asyncInc'])
    })

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
      actions: FooActions
    })
    const s = store(m)
    const binder = createVueBinder<typeof s>()

    const vm = new Vue({
      store: s,
      methods: binder.mapActions({
        inc: 'asyncInc'
      })
    })

    await vm.inc()
    assert(s.state.value === 11)
  })
})

function wait(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}
