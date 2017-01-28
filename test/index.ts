import assert = require('power-assert')
import sinon = require('sinon')
import { create, store, Getters, Mutations, Actions } from '../src'

describe('Brave', () => {
  it('compose state tree', () => {
    class Foo {
      a = 1
    }
    class Bar {
      b = 2
    }
    class Baz {
      c = 3
    }

    const baz = create({ state: Baz })
    const bar = create({ state: Bar })
    const foo = create({ state: Foo })
      .module('bar', bar)
      .module('baz', baz)

    const s = store(foo)
    assert(s.state.a === 1)
    assert(s.state.bar.b === 2)
    assert(s.state.baz.c === 3)
  })

  it('provides getters', () => {
    class FooState {
      a = 1
    }
    class FooGetters extends Getters<FooState>() {
      get a () { return this.state.a + 1 }
    }
    class BarState {
      b = 2
    }
    class BarGetters extends Getters<BarState>() {
      get b () { return this.state.b + 2 }
      c (n: number) { return this.state.b + n }
    }

    const bar = create({
      state: BarState,
      getters: BarGetters
    })
    const foo = create({
      state: FooState,
      getters: FooGetters
    }).module('bar', bar)

    const s = store(foo)
    assert(s.getters.a === 2)
    assert(s.getters.bar.b === 4)
    assert(s.getters.bar.c(3) === 5)
    s.state.a += 10
    s.state.bar.b += 20
    assert(s.getters.a === 12)
    assert(s.getters.bar.b === 24)
    assert(s.getters.bar.c(3) === 25)
  })

  it('refers other getters in each getter', () => {
    class FooState {
      value = 'foo'
    }
    class FooGetters extends Getters<FooState>() {
      get double () { return this.state.value + this.state.value }
      get doubleUpper () {
        return this.double.toUpperCase()
      }
    }

    const s = store(create({
      state: FooState,
      getters: FooGetters
    }))
    assert(s.getters.doubleUpper === 'FOOFOO')
  })

  it('provides mutations', () => {
    const spy = sinon.spy()

    class FooMutations extends Mutations() {
      test: (n: number) => void = spy
    }

    const s = store(create({
      mutations: FooMutations
    }))
    s.mutations.test(5)
    assert(spy.calledWith(5))
  })

  it('provides actions', () => {
    const spy = sinon.spy()

    class FooActions extends Actions() {
      test: (n: number) => void = spy
    }

    const s = store(create({
      actions: FooActions
    }))

    s.actions.test(10)
    assert(spy.calledWith(10))
  })

  it('refers state/getters/actions in each action', () => {
    const aSpy = sinon.spy()
    const mSpy = sinon.spy()

    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      get plus1 () { return this.state.value + 1 }
    }
    class FooMutations extends Mutations<FooState>() {
      inc: (n: number) => void = mSpy
    }
    class FooActions extends Actions<FooState, FooGetters, FooMutations>() {
      test () {
        assert(this.state.value === 1)
        assert(this.getters.plus1 === 2)
        this.mutations.inc(1)
        assert(mSpy.calledWith(1))
        aSpy(true)
      }
    }

    const s = store(create({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations,
      actions: FooActions
    }))
    s.actions.test()
    assert(aSpy.calledWith(true))
  })

  it('refers other actions in each action', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()

    class FooActions extends Actions() {
      caller () {
        this.callee()
        spy1()
      }
      callee = spy2
    }

    const s = store(create({
      actions: FooActions
    }))
    s.actions.caller()
    assert(spy1.called)
    assert(spy2.called)
  })
})
