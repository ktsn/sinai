import { assert, beforeEach, describe, expect, it, vitest } from 'vitest'
import { defineStore, createSinai, setActiveSinai } from '../../src'

describe('Basic', () => {
  beforeEach(() => {
    const sinai = createSinai()
    setActiveSinai(sinai)
  })

  it('compose state', () => {
    class Foo {
      a = 1
      b = 2
      c = 3
      d = 4
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    assert(foo.a === 1)
    assert(foo.b === 2)
    assert(foo.c === 3)
    assert(foo.d === 4)
  })

  it('provides getters', () => {
    class Foo {
      a = 1

      get b() {
        return this.a + 1
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    expect(foo.b).toBe(2)
    foo.a += 10
    expect(foo.b).toBe(12)
  })

  it('refers other getters in each getter', () => {
    class Foo {
      value = 'foo'

      get double() {
        return this.value + this.value
      }

      get doubleUpper() {
        return this.double.toUpperCase()
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    assert(foo.doubleUpper === 'FOOFOO')
  })

  it('provides actions', () => {
    class Foo {
      value = 1

      inc() {
        this.value += 1
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    assert(foo.value === 1)
    foo.inc()
    expect(foo.value).toBe(2)
  })

  it('binds this to actions', () => {
    class Foo {
      value = 1

      inc() {
        this.value += 1
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    const { inc } = foo
    inc()
    expect(foo.value).toBe(2)
  })

  it('refers state/getters in each action', () => {
    const aSpy = vitest.fn()

    class Foo {
      value = 1

      get plus1() {
        return this.value + 1
      }

      test() {
        expect(this.value).toBe(1)
        expect(this.plus1).toBe(2)
        aSpy(true)
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    foo.test()
    expect(aSpy).toHaveBeenCalledWith(true)
  })

  it('refers other actions in each action', () => {
    const spy1 = vitest.fn()
    const spy2 = vitest.fn()

    class Foo {
      caller() {
        this.callee()
        spy1()
      }
      callee = spy2
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    foo.caller()
    expect(spy1).toHaveBeenCalled()
    expect(spy2).toHaveBeenCalled()
  })

  it('properly choose inherited methods', () => {
    const spyParent = vitest.fn()
    const spyChild = vitest.fn()

    class Parent {
      foo(): void {
        spyParent()
      }
    }

    class Child extends Parent {
      foo(): void {
        super.foo()
        spyChild()
      }
    }

    const useChild = defineStore(Child)
    const child = useChild()

    child.foo()
    expect(spyParent).toHaveBeenCalled()
    expect(spyChild).toHaveBeenCalled()
  })

  it('throws if there is setter in a store', () => {
    class Foo {
      set foo(_value: number) {
        /* nothing */
      }
    }

    const useFoo = defineStore(Foo)

    expect(() => {
      useFoo()
    }).toThrow(/Store must not have any setters/)
  })

  it('can get result from an action', () => {
    class Foo {
      foo() {
        return 1
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    expect(foo.foo()).toBe(1)
  })
})
