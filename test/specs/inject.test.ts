import { assert, describe, beforeEach, expect, it, vitest } from 'vitest'
import { createSinai, defineStore, setActiveSinai } from '../../src'

describe('Inject', () => {
  class A {
    value = 1

    get a() {
      return this.value + 1
    }

    inc() {
      this.value += 1
    }
  }

  const useA = defineStore(A)

  beforeEach(() => {
    const sinai = createSinai()
    setActiveSinai(sinai)
  })

  it('inject other module', () => {
    const spy = vitest.fn()

    class Foo {
      a = useA()

      test() {
        const counter = this.a
        assert(counter.value === 1)
        assert(counter.a === 2)
        counter.inc()
        expect(counter.value).toBe(2)
        counter.inc()
        expect(counter.value).toBe(3)
        spy()
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    foo.test()
    expect(spy).toHaveBeenCalled()
  })
})
