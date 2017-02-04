import assert = require('power-assert')
import sinon = require('sinon')
import { module, inject, Getters, Mutations, Actions } from '../../src'
import { stub } from '../../src/test'

describe('Testing utility', () => {
  it('tests getters class', () => {
    class FooGetters extends Getters() {
      one () {
        return 1
      }
      get two () {
        return 2
      }
    }

    const getters = stub(FooGetters)
    assert(getters.one() === 1)
    assert(getters.two === 2)
  })

  it('tests getters class with injecting state', () => {
    class FooState {
      value = 1
      foo = 2
    }
    class FooGetters extends Getters<FooState>() {
      getValue () {
        return this.state.value
      }
    }

    const getters = stub(FooGetters, {
      state: {
        value: 10
      }
    })
    assert(getters.getValue() === 10)
  })

  it('tests getters class with injecting depending modules', () => {
    class FooState {
      value: 'foo'
      foo: 'test'
    }
    class FooGetters extends Getters<FooState>() {
      get test () {
        return 'foogetters'
      }
    }
    const foo = module({
      state: FooState,
      getters: FooGetters
    })

    const { Getters: GettersI } = inject('foo', foo)

    class BarState {
      value: 'bar'
      bar: 'test'
    }
    class BarGetters extends GettersI<BarState>() {
      get combine () {
        return this.modules.foo.state.value
          + ',' + this.modules.foo.getters.test
          + ',' + this.state.value
      }
    }

    const getters = stub(BarGetters, {
      state: { value: 'testbar' },
      modules: {
        foo: {
          state: {
            value: 'testfoo'
          },
          getters: {
            test: 'testfoogetters'
          }
        }
      }
    })
    assert(getters.combine === 'testfoo,testfoogetters,testbar')
  })

  it('tests mutations with injecting state', () => {
    class FooState {
      value: 1
      test: 'foo'
    }
    class FooMutations extends Mutations<FooState>() {
      inc (n: number) {
        this.state.value += n
      }
    }

    const mutations = stub(FooMutations, {
      state: { value: 10 }
    })
    mutations.inc(1)
    assert(mutations.state.value === 11)
  })

  it('tests actions with injecting state/getters/mutations', () => {
    const spy = sinon.spy()

    class FooState {
      value: 1
      test: 'foo'
    }
    class FooGetters extends Getters<FooState>() {
      computed () {
        return this.state.value + 1
      }
    }
    class FooMutations extends Mutations<FooState>() {
      inc (n: number) {
        this.state.value += n
      }
    }
    class FooActions extends Actions<FooState, FooGetters, FooMutations>() {
      test () {
        this.mutations.inc(
          this.state.value + this.getters.computed()
        )
      }
    }

    const actions = stub(FooActions, {
      state: {
        value: 10
      },
      getters: {
        computed: () => 100
      },
      mutations: {
        inc: spy as Function
      }
    })
    actions.test()
    assert(spy.calledWith(110))
  })

  it('tests actions with injecting depending modules', () => {
    class FooState {
      value: 1
      foo: 'test'
    }
    class FooGetters extends Getters<FooState>() {
      get test () {
        return this.state.value + 1
      }
    }
    class FooMutations extends Mutations<FooState>() {
      test (n: number) {
        this.state.value += 1
      }
    }
    class FooActions extends Actions<FooState, FooGetters, FooMutations>() {
      test (n: number) {
        this.mutations.test(n)
      }
    }
    const foo = module({
      state: FooState,
      getters: FooGetters,
      mutations: FooMutations,
      actions: FooActions
    })

    const { Actions: ActionsI } = inject('foo', foo)

    class BarActions extends ActionsI() {
      test () {
        const { foo } = this.modules
        foo.mutations.test(foo.state.value)
        foo.actions.test(foo.getters.test)
      }
    }

    const mutationSpy = sinon.spy()
    const actionSpy = sinon.spy()
    const actions = stub(BarActions, {
      modules: {
        foo: {
          state: { value: 100 },
          getters: { test: 200 },
          mutations: { test: mutationSpy as Function },
          actions: { test: actionSpy as Function }
        }
      }
    })
    actions.test()
    assert(mutationSpy.calledWith(100))
    assert(actionSpy.calledWith(200))
  })
})
