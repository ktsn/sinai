import assert = require('power-assert')
import sinon = require('sinon')
import { inject, module, store, Getters, Mutations, Actions } from '../../src'

describe('Inject', () => {
  class AState {
    value = 1
  }
  class AGetters extends Getters<AState>() {
    get a () { return this.state.value + 1 }
  }
  class AMutations extends Mutations<AState>() {
    inc () { this.state.value += 1 }
  }
  class AActions extends Actions<AState, AGetters, AMutations>() {
    inc () { this.mutations.inc() }
  }
  const counter = module({
    state: AState,
    getters: AGetters,
    mutations: AMutations,
    actions: AActions
  })

  it('injects other module in getters', () => {
    const { Getters } = inject('counter', counter)

    class FooGetters extends Getters() {
      get stateTest () {
        return this.modules.counter.state.value
      }
      get getterTest () {
        return this.modules.counter.getters.a
      }
    }

    const foo = module({
      getters: FooGetters
    })
    const root = module()
      .child('foo', foo)
      .child('counter', counter)
    const s = store(root)

    assert(s.getters.foo.stateTest === 1)
    assert(s.getters.foo.getterTest === 2)
    s.state.counter.value += 1
    assert(s.getters.foo.stateTest === 2)
    assert(s.getters.foo.getterTest === 3)
  })

  it('inject other module in actions', () => {
    const spy = sinon.spy()

    const { Actions } = inject('counter', counter)

    class FooActions extends Actions() {
      test () {
        const { counter } = this.modules
        assert(counter.state.value === 1)
        assert(counter.getters.a === 2)
        counter.actions.inc()
        assert(counter.state.value === 2)
        counter.mutations.inc()
        assert(counter.state.value === 3)
        spy()
      }
    }

    const foo = module({
      actions: FooActions
    })
    const root = module()
      .child('foo', foo)
      .child('counter', counter)
    const s = store(root)

    s.actions.foo.test()
    assert(spy.called)
  })

  it('works for mutations as same as base mutations class', () => {
    const { Mutations } = inject('counter', counter)

    class FooState {
      value = 1
    }
    class FooMutations extends Mutations<FooState>() {
      inc () {
        this.state.value += 1
      }
    }

    const foo = module({
      state: FooState,
      mutations: FooMutations
    })
    const root = module()
      .child('foo', foo)
      .child('counter', counter)
    const s = store(root)

    assert(s.state.foo.value === 1)
    s.mutations.foo.inc()
    assert(s.state.foo.value === 2)
  })

  it('collects modules that placed as various structures', () => {
    const spy = sinon.spy()

    const anotherCounter = module({
      state: AState,
      getters: AGetters,
      mutations: AMutations,
      actions: AActions
    })

    const { Getters, Actions } = inject('a', counter)
      .and('b', anotherCounter)

    class FooGetters extends Getters() {
      get aTest () {
        return this.modules.a.getters.a
      }
      get bTest () {
        return this.modules.b.getters.a
      }
    }
    class FooActions extends Actions<{}, FooGetters>() {
      aTest () {
        const { state, getters, actions, mutations } = this.modules.a
        assert(state.value === 1)
        assert(getters.a === 2)
        actions.inc()
        assert(state.value === 2)
        mutations.inc()
        assert(state.value === 3)
        spy()
      }
      bTest () {
        const { state, getters, actions, mutations } = this.modules.b
        assert(state.value === 1)
        assert(getters.a === 2)
        actions.inc()
        assert(state.value === 2)
        mutations.inc()
        assert(state.value === 3)
        spy()
      }
    }

    const foo = module({
      getters: FooGetters,
      actions: FooActions
    })
    const root = module()
      .child('counter', counter)
      .child('nested', module()
        .child('anotherCounter', anotherCounter)
      )
      .child('foo', foo)
    const s = store(root)

    assert(s.getters.foo.aTest === 2)
    assert(s.getters.foo.bTest === 2)
    s.actions.foo.aTest()
    s.actions.foo.bTest()
    assert(spy.callCount === 2)
  })

  it('throws if the injected module is not found in the store', () => {
    const { Getters } = inject('counter', counter)

    class FooGetters extends Getters() {}

    const foo = module({ getters: FooGetters })

    assert.throws(() => {
      store(foo)
    })
  })
})
