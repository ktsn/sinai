import assert = require('power-assert')
import sinon = require('sinon')
import Vue = require('vue')
import { create, store, Getters, Mutations } from '../../src'

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

    const s = store(create({
      state: FooState,
      mutations: FooMutations
    }))

    const c: any = new Vue({
      store: s,
      computed: {
        test () {
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

    const s = store(create({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations
    }))

    const c: any = new Vue({
      store: s,
      computed: {
        test () {
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

    const s = store(create({
      state: class {
        value = 123
      }
    }))

    const Grandchild = {
      created () {
        assert(this.$store.state.value === 123)
        spy1()
      },
      render: h => h('div', 'test')
    } as Vue.ComponentOptions<Vue>

    const Child = {
      created () {
        assert(this.$store.state.value === 123)
        spy2()
      },
      render: h => h(Grandchild)
    } as Vue.ComponentOptions<Vue>

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

    const foo = create({
      state: FooState,
      getters: class extends Getters<FooState>() {
        get ten () { return 10 }
      }
    })

    const bar = create({
      state: class {
        value = 567
      }
    }).module('foo', foo)

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
})