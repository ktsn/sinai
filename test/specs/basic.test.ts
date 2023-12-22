import { assert, describe, expect, it, vitest } from 'vitest'
import { module, store, Getters, Mutations, Actions } from '../../src'

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

    const qux = module({ state: Qux })
    const baz = module({ state: Baz }).child('qux', qux)
    const bar = module({ state: Bar })
    const foo = module({ state: Foo }).child('bar', bar).child('baz', baz)

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
      get a() {
        return this.state.a + 1
      }
    }
    class BarState {
      b = 2
    }
    class BarGetters extends Getters<BarState>() {
      get b() {
        return this.state.b + 2
      }
      c(n: number) {
        return this.state.b + n
      }
    }
    class BazState {
      c = 3
    }
    class BazGetters extends Getters<BazState>() {
      get c() {
        return this.state.c + 3
      }
    }

    const baz = module({
      state: BazState,
      getters: BazGetters,
    })
    const bar = module({
      state: BarState,
      getters: BarGetters,
    }).child('baz', baz)
    const foo = module({
      state: FooState,
      getters: FooGetters,
    }).child('bar', bar)

    const s = store(foo)
    assert(s.getters.a === 2)
    assert(s.getters.bar.b === 4)
    assert(s.getters.bar.c(3) === 5)
    assert(s.getters.bar.baz.c === 6)
    s.state.a += 10
    s.state.bar.b += 20
    s.state.bar.baz.c += 30
    expect(s.getters.a).toBe(12)
    expect(s.getters.bar.b).toBe(24)
    expect(s.getters.bar.c(3)).toBe(25)
    expect(s.getters.bar.baz.c).toBe(36)
  })

  it('refers other getters in each getter', () => {
    class FooState {
      value = 'foo'
    }
    class FooGetters extends Getters<FooState>() {
      get double() {
        return this.state.value + this.state.value
      }
      get doubleUpper() {
        return this.double.toUpperCase()
      }
    }

    const s = store(
      module({
        state: FooState,
        getters: FooGetters,
      }),
    )
    assert(s.getters.doubleUpper === 'FOOFOO')
  })

  it('should bind this object for getters', () => {
    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      one() {
        return this.state.value
      }
      two() {
        const { one } = this
        return one() + 1
      }
    }
    const s = store(
      module({
        state: FooState,
        getters: FooGetters,
      }),
    )

    assert(s.getters.two() === 2)
  })

  it('provides mutations', () => {
    const spy1 = vitest.fn()
    const spy2 = vitest.fn()
    const spy3 = vitest.fn()

    class FooMutations extends Mutations() {
      test: (n: number) => void = spy1
    }
    class BarMutations extends Mutations() {
      test: (n: number) => void = spy2
    }
    class BazMutations extends Mutations() {
      test: (n: number) => void = spy3
    }

    const baz = module({
      mutations: BazMutations,
    })
    const bar = module({
      mutations: BarMutations,
    }).child('baz', baz)
    const foo = module({
      mutations: FooMutations,
    }).child('bar', bar)

    const s = store(foo)
    s.mutations.test(5)
    s.mutations.bar.test(10)
    s.mutations.bar.baz.test(15)
    expect(spy1).toHaveBeenCalledWith(5)
    expect(spy2).toHaveBeenCalledWith(10)
    expect(spy3).toHaveBeenCalledWith(15)
  })

  it('should bind this object for mutations', () => {
    class FooState {
      value = 1
    }
    class FooMutations extends Mutations<FooState>() {
      plus1() {
        this.state.value += 1
      }
      plus2() {
        const { plus1 } = this
        plus1()
        plus1()
      }
    }

    const s = store(
      module({
        state: FooState,
        mutations: FooMutations,
      }),
    )

    assert(s.state.value === 1)
    s.mutations.plus2()
    expect(s.state.value).toBe(3)
  })

  it('update state in each mutation', () => {
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

    assert(s.state.value === 1)
    s.mutations.inc()
    expect(s.state.value).toBe(2)
  })

  it('provides actions', () => {
    const spy1 = vitest.fn()
    const spy2 = vitest.fn()
    const spy3 = vitest.fn()

    class FooActions extends Actions() {
      test: (n: number) => void = spy1
    }
    class BarActions extends Actions() {
      test: (n: number) => void = spy2
    }
    class BazActions extends Actions() {
      test: (n: number) => void = spy3
    }

    const baz = module({
      actions: BazActions,
    })
    const bar = module({
      actions: BarActions,
    }).child('baz', baz)
    const foo = module({
      actions: FooActions,
    }).child('bar', bar)

    const s = store(foo)

    s.actions.test(10)
    s.actions.bar.test(11)
    s.actions.bar.baz.test(12)
    expect(spy1).toHaveBeenCalledWith(10)
    expect(spy2).toHaveBeenCalledWith(11)
    expect(spy3).toHaveBeenCalledWith(12)
  })

  it('should bind this object for actions', () => {
    const spy = vitest.fn()

    class FooState {
      value = 1
    }
    class FooMutations extends Mutations<FooState>() {
      inc() {
        this.state.value += 1
      }
    }
    class FooActions extends Actions<FooState, FooMutations>() {
      inc() {
        this.mutations.inc()
      }
      test() {
        const { inc } = this
        assert(this.state.value === 1)
        inc()
        expect(this.state.value).toBe(2)
        spy()
      }
    }

    const s = store(
      module({
        state: FooState,
        mutations: FooMutations,
        actions: FooActions,
      }),
    )

    s.actions.test()
    expect(spy).toHaveBeenCalled()
  })

  it('refers state/getters/actions in each action', () => {
    const aSpy = vitest.fn()
    const mSpy = vitest.fn()

    class FooState {
      value = 1
    }
    class FooGetters extends Getters<FooState>() {
      get plus1() {
        return this.state.value + 1
      }
    }
    class FooMutations extends Mutations<FooState>() {
      inc: (n: number) => void = mSpy
    }
    class FooActions extends Actions<FooState, FooGetters, FooMutations>() {
      test() {
        assert(this.state.value === 1)
        assert(this.getters.plus1 === 2)
        this.mutations.inc(1)
        expect(mSpy).toHaveBeenCalledWith(1)
        aSpy(true)
      }
    }

    const s = store(
      module({
        state: FooState,
        getters: FooGetters,
        mutations: FooMutations,
        actions: FooActions,
      }),
    )
    s.actions.test()
    expect(aSpy).toHaveBeenCalledWith(true)
  })

  it('refers other actions in each action', () => {
    const spy1 = vitest.fn()
    const spy2 = vitest.fn()

    class FooActions extends Actions() {
      caller() {
        this.callee()
        spy1()
      }
      callee = spy2
    }

    const s = store(
      module({
        actions: FooActions,
      }),
    )
    s.actions.caller()
    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })

  it('subscribes mutations', () => {
    const spy = vitest.fn()

    class FooState {
      value = 'foo'
    }
    class FooMutations extends Mutations<FooState>() {
      test(value: string, ..._args: any[]) {
        this.state.value = value
      }
    }

    const s = store(
      module().child(
        'foo',
        module({
          state: FooState,
          mutations: FooMutations,
        }),
      ),
    )

    const unsubscribe = s.subscribe(spy)
    s.mutations.foo.test('bar')

    const first = spy.mock.lastCall
    assert.deepEqual(first, [
      ['foo', 'test'],
      ['bar'],
      { foo: { value: 'bar' } },
    ])
    s.mutations.foo.test('baz', 1, true, null)

    const second = spy.mock.lastCall
    assert.deepEqual(second, [
      ['foo', 'test'],
      ['baz', 1, true, null],
      { foo: { value: 'baz' } },
    ])

    assert(spy.mock.calls.length === 2)
    unsubscribe()
    s.mutations.foo.test('qux')
    assert(spy.mock.calls.length === 2)
  })

  // #15
  it('subscribes inherited mutations', () => {
    const spy = vitest.fn()

    class FooState {
      value = 'foo'
    }
    abstract class AbstractMutations extends Mutations<FooState>() {
      update(str: string) {
        this.state.value = str
      }
    }
    class FooMutations extends AbstractMutations {}

    const s = store(
      module({
        state: FooState,
        mutations: FooMutations,
      }),
    )

    const unsubscribe = s.subscribe(spy)
    s.mutations.update('updated')

    const first = spy.mock.lastCall
    assert.deepEqual(first, [['update'], ['updated'], { value: 'updated' }])
    unsubscribe()
  })

  it('properly choose inherited methods', () => {
    const spyParent = vitest.fn()
    const spyChild = vitest.fn()

    class ParentMutations extends Mutations() {
      foo(): void {
        spyParent()
      }
    }

    class ChildMutations extends ParentMutations {
      foo(): void {
        super.foo()
        spyChild()
      }
    }

    const s = store(
      module({
        mutations: ChildMutations,
      }),
    )
    s.mutations.foo()
    expect(spyParent).toHaveBeenCalled()
    expect(spyChild).toHaveBeenCalled()
  })

  it('receives plugins', () => {
    const spy = vitest.fn()

    const s = store(module(), {
      plugins: [spy],
    })

    expect(spy).toHaveBeenCalledWith(s)
  })

  it('replaces entire state', () => {
    class State {
      foo = 'bar'
    }

    const s = store(
      module({
        state: State,
      }),
    )

    assert(s.state.foo === 'bar')
    s.replaceState({ foo: 'baz' })
    expect(s.state.foo).toBe('baz')
  })

  it('throws if trying to register a module that the name is already exists', () => {
    const foo = module()

    assert.throws(() => {
      module().child('foo', foo).child('foo', foo)
    })
  })

  it('throws if a module is registered in twice or more', () => {
    const foo = module()
    const bar = module().child('foo', foo)
    const baz = module().child('bar', bar).child('test', foo)

    assert.throws(() => {
      store(baz)
    })
  })

  it('throws if there is setter in getters', () => {
    class FooGetters extends Getters() {
      set foo(_value: number) {
        /* nothing */
      }
    }
    const foo = module({
      getters: FooGetters,
    })

    assert.throws(() => {
      store(foo)
    }, /Getters should not have any setters/)
  })

  it('throws if mutations have setter/getter', () => {
    class FooMutations extends Mutations() {
      get foo() {
        return 1
      }
    }
    const foo = module({
      mutations: FooMutations,
    })

    assert.throws(() => {
      store(foo)
    }, /Mutations should only have functions/)
  })

  it('throws if a mutation returns something', () => {
    class FooMutations extends Mutations() {
      foo() {
        return null
      }
    }
    const s = store(
      module({
        mutations: FooMutations,
      }),
    )

    assert.throws(() => {
      s.mutations.foo()
    }, /Mutations should not return anything/)
  })

  it('throws if actions have setter/getter', () => {
    class FooActions extends Actions() {
      get foo() {
        return 1
      }
    }
    const foo = module({
      actions: FooActions,
    })

    assert.throws(() => {
      store(foo)
    }, /Actions should only have functions/)
  })

  it('throws if an action returns other than Promise', () => {
    class FooActions extends Actions() {
      foo() {
        return 1
      }
    }
    const s = store(
      module({
        actions: FooActions,
      }),
    )

    assert.throws(() => {
      s.actions.foo()
    }, /Actions should not return other than Promise/)
  })

  it('should not throw if an action returns a Promise', () => {
    class FooActions extends Actions() {
      foo() {
        return Promise.resolve()
      }
    }
    const s = store(
      module({
        actions: FooActions,
      }),
    )

    assert.doesNotThrow(() => {
      s.actions.foo()
    })
  })
  it('can get result from an action via Promise', () => {
    class FooActions extends Actions() {
      foo() {
        return Promise.resolve(1)
      }
    }
    const s = store(
      module({
        actions: FooActions,
      }),
    )

    return s.actions.foo().then((ret) => {
      assert(ret === 1)
    })
  })
})
