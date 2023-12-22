import Vue from 'vue'
import { module, store, Getters, Mutations, Actions } from '../../src'
import { assert, describe, expect, it, vitest } from 'vitest'

describe('Hot Update', () => {
  it('supports hot module replacement for getters', () => {
    const m = (num: number) => {
      class FooGetters extends Getters() {
        get test() {
          return num
        }
      }

      return module({
        getters: FooGetters,
      })
    }

    const s = store(
      m(1)
        .child('a', m(2).child('b', m(3)))
        .child('c', m(4)),
    )

    assert(s.getters.test === 1)
    assert(s.getters.a.test === 2)
    assert(s.getters.a.b.test === 3)
    assert(s.getters.c.test === 4)

    s.hotUpdate(
      m(10)
        .child('a', m(20).child('b', m(30)))
        .child('c', m(40)),
    )

    expect(s.getters.test).toBe(10)
    expect(s.getters.a.test).toBe(20)
    expect(s.getters.a.b.test).toBe(30)
    expect(s.getters.c.test).toBe(40)
  })

  it('supports hot module replacement for mutations', () => {
    const m = (num: number) => {
      class FooState {
        value = 1
      }
      class FooMutations extends Mutations<FooState>() {
        inc() {
          this.state.value += num
        }
      }
      return module({
        state: FooState,
        mutations: FooMutations,
      })
    }

    const s = store(
      m(1)
        .child('a', m(2).child('b', m(3)))
        .child('c', m(4)),
    )

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

    expect(s.state.value).toBe(2)
    expect(s.state.a.value).toBe(3)
    expect(s.state.a.b.value).toBe(4)
    expect(s.state.c.value).toBe(5)

    s.hotUpdate(
      m(10)
        .child('a', m(20).child('b', m(30)))
        .child('c', m(40)),
    )

    emit(s)

    expect(s.state.value).toBe(12)
    expect(s.state.a.value).toBe(23)
    expect(s.state.a.b.value).toBe(34)
    expect(s.state.c.value).toBe(45)
  })

  it('supports hot module replacement for actions', () => {
    const m = (num: number) => {
      class FooState {
        value = 1
      }
      class FooMutations extends Mutations<FooState>() {
        inc(n: number) {
          this.state.value += n
        }
      }
      class FooActions extends Actions<FooState, FooMutations>() {
        inc() {
          this.mutations.inc(num)
        }
      }
      return module({
        state: FooState,
        mutations: FooMutations,
        actions: FooActions,
      })
    }

    const s = store(
      m(1)
        .child('a', m(2).child('b', m(3)))
        .child('c', m(4)),
    )

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

    expect(s.state.value).toBe(2)
    expect(s.state.a.value).toBe(3)
    expect(s.state.a.b.value).toBe(4)
    expect(s.state.c.value).toBe(5)

    s.hotUpdate(
      m(10)
        .child('a', m(20).child('b', m(30)))
        .child('c', m(40)),
    )

    emit(s)

    expect(s.state.value).toBe(12)
    expect(s.state.a.value).toBe(23)
    expect(s.state.a.b.value).toBe(34)
    expect(s.state.c.value).toBe(45)
  })

  it('re-evaluate getters when getters are updated', async () => {
    const spyFoo = vitest.fn()
    const spyBar = vitest.fn()

    const m = (num: number) => {
      class FooState {
        value = 1
      }
      class FooGetters extends Getters<FooState>() {
        foo() {
          return this.state.value + num
        }
        get bar() {
          return this.state.value + num
        }
      }
      return module({
        state: FooState,
        getters: FooGetters,
      })
    }

    const s = store(m(1))
    s.watch(
      (_state, getters) => getters.foo(),
      (value) => spyFoo(value),
    )
    s.watch(
      (_state, getters) => getters.bar,
      (value) => spyBar(value),
    )

    s.hotUpdate(m(2))

    await Vue.nextTick()

    expect(spyFoo).toHaveBeenCalledWith(3)
    expect(spyBar).toHaveBeenCalledWith(3)
  })
})
