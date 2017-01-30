import assert = require('power-assert')
import sinon = require('sinon')
import Vue = require('vue')
import { create, store, Getters, Mutations, Actions } from '../../src'

describe('Hot Update', () => {
  it('supports hot module replacement for getters', () => {
    const m = (num: number) => {
      class FooGetters extends Getters() {
        get test () { return num }
      }

      return create({
        getters: FooGetters
      })
    }

    const s = store(m(1)
      .child('a', m(2)
        .child('b', m(3)))
      .child('c', m(4)))

    assert(s.getters.test === 1)
    assert(s.getters.a.test === 2)
    assert(s.getters.a.b.test === 3)
    assert(s.getters.c.test === 4)

    s.hotUpdate(m(10)
      .child('a', m(20)
        .child('b', m(30)))
      .child('c', m(40)))

    assert(s.getters.test === 10)
    assert(s.getters.a.test === 20)
    assert(s.getters.a.b.test === 30)
    assert(s.getters.c.test === 40)
  })

  it('supports hot module replacement for mutations', () => {
    const m = (num: number) => {
      class FooState {
        value = 1
      }
      class FooMutations extends Mutations<FooState>() {
        inc () {
          this.state.value += num
        }
      }
      return create({
        state: FooState,
        mutations: FooMutations
      })
    }

    const s = store(m(1)
      .child('a', m(2)
        .child('b', m(3)))
      .child('c', m(4)))

    const emit = (store: typeof s) => {
      store.mutations.inc()
      store.mutations.a.inc()
      store.mutations.a.b.inc()
      store.mutations.c.inc()
    }

    assert(s.state.value === 1)
    assert(s.state.a.value === 1)
    assert(s.state.a.b.value === 1)
    assert(s.state.c.value === 1)

    emit(s)

    assert(s.state.value === 2)
    assert(s.state.a.value === 3)
    assert(s.state.a.b.value === 4)
    assert(s.state.c.value === 5)

    s.hotUpdate(m(10)
      .child('a', m(20)
        .child('b', m(30)))
      .child('c', m(40)))

    emit(s)

    assert(s.state.value === 12)
    assert(s.state.a.value === 23)
    assert(s.state.a.b.value === 34)
    assert(s.state.c.value === 45)
  })

  it('supports hot module replacement for actions', () => {
    const m = (num: number) => {
      class FooState {
        value = 1
      }
      class FooMutations extends Mutations<FooState>() {
        inc (n: number) {
          this.state.value += n
        }
      }
      class FooActions extends Actions<FooState, FooMutations>() {
        inc () {
          this.mutations.inc(num)
        }
      }
      return create({
        state: FooState,
        mutations: FooMutations,
        actions: FooActions
      })
    }

    const s = store(m(1)
      .child('a', m(2)
        .child('b', m(3)))
      .child('c', m(4)))

    const emit = (store: typeof s) => {
      store.actions.inc()
      store.actions.a.inc()
      store.actions.a.b.inc()
      store.actions.c.inc()
    }

    assert(s.state.value === 1)
    assert(s.state.a.value === 1)
    assert(s.state.a.b.value === 1)
    assert(s.state.c.value === 1)

    emit(s)

    assert(s.state.value === 2)
    assert(s.state.a.value === 3)
    assert(s.state.a.b.value === 4)
    assert(s.state.c.value === 5)

    s.hotUpdate(m(10)
      .child('a', m(20)
        .child('b', m(30)))
      .child('c', m(40)))

    emit(s)

    assert(s.state.value === 12)
    assert(s.state.a.value === 23)
    assert(s.state.a.b.value === 34)
    assert(s.state.c.value === 45)
  })

  it('re-evaluate getters when getters are updated', done => {
    const spyFoo = sinon.spy()
    const spyBar = sinon.spy()

    const m = (num: number) => {
      class FooState {
        value = 1
      }
      class FooGetters extends Getters<FooState>() {
        foo () { return this.state.value + num }
        get bar () { return this.state.value + num }
      }
      return create({
        state: FooState,
        getters: FooGetters
      })
    }

    const s = store(m(1))
    s.watch(
      (state, getters) => getters.foo(),
      value => spyFoo(value)
    )
    s.watch(
      (state, getters) => getters.bar,
      value => spyBar(value)
    )

    s.hotUpdate(m(2))

    Vue.nextTick(() => {
      assert(spyFoo.calledWith(3))
      assert(spyBar.calledWith(3))
      done()
    })
  })
})

