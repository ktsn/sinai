import { computed, createApp, h, nextTick } from 'vue'
import { createSinai, defineStore } from '../../src'
import { describe, expect, it, vitest } from 'vitest'
import assert from 'assert'

describe('Vue integration', () => {
  it('has reactive state', () => {
    class Foo {
      value = 1

      inc() {
        this.value += 1
      }
    }

    const useFoo = defineStore(Foo)
    const sinai = createSinai()

    const c: any = createApp({
      setup() {
        const foo = useFoo()

        const test = computed((): number => {
          return foo.value
        })

        return {
          test,
          inc: foo.inc,
        }
      },
      render: () => {},
    })
      .use(sinai)
      .mount(document.createElement('div'))

    expect(c.test).toBe(1)
    c.inc()
    expect(c.test).toBe(2)
  })

  it('has reactive getters', () => {
    class FooState {
      value = 1

      get twice() {
        return this.value * 2
      }

      inc() {
        this.value += 1
      }
    }

    const useFoo = defineStore(FooState)
    const sinai = createSinai()

    const c: any = createApp({
      setup() {
        const foo = useFoo()

        const test = computed((): number => {
          return foo.twice
        })

        return {
          test,
          inc: foo.inc,
        }
      },
      render: () => {},
    })
      .use(sinai)
      .mount(document.createElement('div'))

    assert(c.test === 2)
    c.inc()
    assert(c.test === 4)
  })

  it('caches getters of property getter with Vue', () => {
    const spy = vitest.fn()

    class Foo {
      value = 'foo'

      get test() {
        spy()
        return this.value + 'bar'
      }
    }

    const useFoo = defineStore(Foo)
    const foo = useFoo()

    expect(spy).not.toHaveBeenCalled()
    assert(foo.test === 'foobar')
    assert(foo.test === 'foobar')
    assert(foo.test === 'foobar')
    expect(spy).toHaveBeenCalledTimes(1)
    foo.value = 'bar'
    expect(foo.test).toBe('barbar')
    expect(foo.test).toBe('barbar')
    expect(foo.test).toBe('barbar')
    expect(spy).toHaveBeenCalledTimes(2)
  })
})
