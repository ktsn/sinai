import assert = require('power-assert')
import sinon = require('sinon')
import { create, store, Getters, Mutations, Actions } from '../../src'

describe('Basic', () => {
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
    class Qux {
      d = 4
    }

    const qux = create({ state: Qux })
    const baz = create({ state: Baz })
      .module('qux', qux)
    const bar = create({ state: Bar })
    const foo = create({ state: Foo })
      .module('bar', bar)
      .module('baz', baz)

    const s = store(foo)
    assert(s.state.a === 1)
    assert(s.state.bar.b === 2)
    assert(s.state.baz.c === 3)
    assert(s.state.baz.qux.d === 4)
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
    class BazState {
      c = 3
    }
    class BazGetters extends Getters<BazState>() {
      get c () { return this.state.c + 3 }
    }

    const baz = create({
      state: BazState,
      getters: BazGetters
    })
    const bar = create({
      state: BarState,
      getters: BarGetters
    }).module('baz', baz)
    const foo = create({
      state: FooState,
      getters: FooGetters
    }).module('bar', bar)

    const s = store(foo)
    assert(s.getters.a === 2)
    assert(s.getters.bar.b === 4)
    assert(s.getters.bar.c(3) === 5)
    assert(s.getters.bar.baz.c === 6)
    s.state.a += 10
    s.state.bar.b += 20
    s.state.bar.baz.c += 30
    assert(s.getters.a === 12)
    assert(s.getters.bar.b === 24)
    assert(s.getters.bar.c(3) === 25)
    assert(s.getters.bar.baz.c === 36)
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
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const spy3 = sinon.spy()

    class FooMutations extends Mutations() {
      test: (n: number) => void = spy1
    }
    class BarMutations extends Mutations() {
      test: (n: number) => void = spy2
    }
    class BazMutations extends Mutations() {
      test: (n: number) => void = spy3
    }

    const baz = create({
      mutations: BazMutations
    })
    const bar = create({
      mutations: BarMutations
    }).module('baz', baz)
    const foo = create({
      mutations: FooMutations
    }).module('bar', bar)

    const s = store(foo)
    s.mutations.test(5)
    s.mutations.bar.test(10)
    s.mutations.bar.baz.test(15)
    assert(spy1.calledWith(5))
    assert(spy2.calledWith(10))
    assert(spy3.calledWith(15))
  })

  it('update state in each mutation', () => {
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

    assert(s.state.value === 1)
    s.mutations.inc()
    assert(s.state.value === 2)
  })

  it('provides actions', () => {
    const spy1 = sinon.spy()
    const spy2 = sinon.spy()
    const spy3 = sinon.spy()

    class FooActions extends Actions() {
      test: (n: number) => void = spy1
    }
    class BarActions extends Actions() {
      test: (n: number) => void = spy2
    }
    class BazActions extends Actions() {
      test: (n: number) => void = spy3
    }

    const baz = create({
      actions: BazActions
    })
    const bar = create({
      actions: BarActions
    }).module('baz', baz)
    const foo = create({
      actions: FooActions
    }).module('bar', bar)

    const s = store(foo)

    s.actions.test(10)
    s.actions.bar.test(11)
    s.actions.bar.baz.test(12)
    assert(spy1.calledWith(10))
    assert(spy2.calledWith(11))
    assert(spy3.calledWith(12))
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

  it('throws if trying to register a module that the name is already exists', () => {
    const foo = create()
    const bar = create()

    assert.throws(() => {
      create().module('foo', foo).module('foo', foo)
    })
  })
})
