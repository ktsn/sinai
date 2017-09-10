import * as assert from 'power-assert'
import { convertVuexPlugin } from '../../src/adapters/vuex'
import { store, module, Getters, Actions, Mutations } from '../../src/index'

describe('Vuex Plugin Adapter', () => {
  class FooState {
    value = 'bar'
  }

  class FooGetters extends Getters<FooState>() {
    get testGetter() {
      return this.state.value + 'foo'
    }
  }

  class FooMutations extends Mutations<FooState>() {
    testMutation(str: string) {
      this.state.value += ' ' + str
    }
  }

  class FooActions extends Actions<FooState, FooGetters, FooMutations>() {
    testAction(str: string) {
      this.mutations.testMutation(str)
    }

    objAction(payload: { str: string }) {
      this.mutations.testMutation(payload.str)
    }
  }

  const foo = module({
    state: FooState,
    getters: FooGetters,
    mutations: FooMutations,
    actions: FooActions
  })

  it('returns store state', done => {
    function vuexPlugin(store: any) {
      assert.deepStrictEqual(store.state, new FooState())
      done()
    }

    store(foo, {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
  })

  it('returns flatten getters', done => {
    function vuexPlugin(store: any) {
      assert.deepStrictEqual(store.getters, {
        'foo/testGetter': 'barfoo'
      })
      done()
    }

    store(module().child('foo', foo), {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
  })

  it('dispatches actions', done => {
    function vuexPlugin(store: any) {
      store.dispatch('foo/testAction', 'action')
      assert(store.state.foo.value === 'bar action')
      done()
    }

    store(module().child('foo', foo), {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
  })

  it('dispatches object type dispatch', done => {
    function vuexPlugin(store: any) {
      store.dispatch({
        type: 'foo/objAction',
        str: 'object action'
      })
      assert(store.state.foo.value === 'bar object action')
      done()
    }

    store(module().child('foo', foo), {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
  })

  it('commits mutations', done => {
    function vuexPlugin(store: any) {
      store.commit('foo/testMutation', 'mutation')
      assert(store.state.foo.value === 'bar mutation')
      done()
    }

    store(module().child('foo', foo), {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
  })

  it('subscribes store mutation', done => {
    function vuexPlugin(store: any) {
      store.subscribe((mutation: any, state: any) => {
        assert.deepStrictEqual(mutation, {
          type: 'testMutation',
          payload: 'mutation'
        })

        assert.deepStrictEqual(state, s.state)
        done()
      })
    }

    const s = store(foo, {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
    s.mutations.testMutation('mutation')
  })

  it('watches state change', done => {
    function vuexPlugin(store: any) {
      store.watch(
        (state: FooState) => state.value,
        (newState: string, oldState: string) => {
          assert(newState === 'test')
          assert(oldState === 'bar')
          done()
        }
      )
    }

    const s = store(foo, {
      plugins: [convertVuexPlugin(vuexPlugin)]
    })
    s.state.value = 'test'
  })
})
