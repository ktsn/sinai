import { nextTick, watch } from 'vue'
import { defineStore, hotUpdateStore } from '../../src'
import { assert, beforeEach, describe, expect, it, vitest } from 'vitest'
import { createSinai, setActiveSinai } from '../../src/sinai'

describe('Hot Update', () => {
  it('supports hot module replacement for getters', () => {
    const create = (num: number) => {
      class Foo {
        get test() {
          return num
        }
      }

      return Foo
    }

    const sinai = createSinai()
    setActiveSinai(sinai)
    const initialDefinition = create(1)
    const useFoo = defineStore(initialDefinition)
    const foo = useFoo()

    assert(foo.test === 1)

    const newUseFoo = defineStore(create(2))
    hotUpdateStore(newUseFoo, initialDefinition, sinai)

    expect(foo.test).toBe(2)
  })

  it('supports hot module replacement for actions', () => {
    const create = (num: number) => {
      class Foo {
        value = 1

        inc() {
          this.value += num
        }
      }

      return Foo
    }

    const sinai = createSinai()
    setActiveSinai(sinai)
    const initialDefinition = create(1)
    const useFoo = defineStore(initialDefinition)
    const foo = useFoo()

    expect(foo.value).toBe(1)

    foo.inc()

    expect(foo.value).toBe(2)

    const newUseFoo = defineStore(create(2))
    hotUpdateStore(newUseFoo, initialDefinition, sinai)
    foo.inc()

    expect(foo.value).toBe(4)
  })

  it('re-evaluate getters when getters are updated', async () => {
    const spyFoo = vitest.fn()
    const spyBar = vitest.fn()

    const create = (num: number) => {
      class Foo {
        value = 1

        foo() {
          return this.value + num
        }

        get bar() {
          return this.value + num
        }
      }

      return Foo
    }

    const sinai = createSinai()
    setActiveSinai(sinai)
    const initialDefinition = create(1)
    const useFoo = defineStore(initialDefinition)
    const foo = useFoo()

    watch(
      () => foo.foo(),
      (value) => spyFoo(value),
    )
    watch(
      () => foo.bar,
      (value) => spyBar(value),
    )

    const newUseFoo = defineStore(create(2))
    hotUpdateStore(newUseFoo, initialDefinition, sinai)

    await nextTick()

    expect(spyFoo).toHaveBeenCalledWith(3)
    expect(spyBar).toHaveBeenCalledWith(3)
  })
})
