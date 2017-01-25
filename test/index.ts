import assert = require('power-assert')
import { Module, Getters, Mutations, Actions } from '../src/interface'

describe('Brave', () => {
  it('should be compiled', () => {
    class TestState {
      foo = 'foo'
      bar = 1
    }

    class TestGetters extends Getters<TestState>() {
      count () {
        return this.state.bar
      }
    }

    class TestMutations extends Mutations<TestState>() {
      inc (payload: { count: number }) {
        this.state.bar += payload.count
      }
    }

    class TestActions extends Actions<TestState, TestGetters, TestMutations>() {
      inc (payload: { count: number }) {
        this.getters.count()
        this.mutations.inc({ count: 1 })
      }
    }

    const m = new Module({
      state: TestState,
      getters: TestGetters,
      mutations: TestMutations,
      actions: TestActions
    })

    const mm = new Module({
      state: TestState,
      actions: TestActions
    }).module('b', m)

    const m1 = new Module({
    }).module('a', mm)
  })
})
