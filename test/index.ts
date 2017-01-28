import assert = require('power-assert')
import store from './fixtures/store'

describe('Brave', () => {
  it('should be compiled', () => {
    assert(store.state.counter.count === 0)
    assert(Array.isArray(store.state.todos.todos))
    assert(store.state.todos.filter === 'all')

    assert(store.getters.counter.plus1 === 1)

    store.mutations.counter.inc(2)
    assert(store.state.counter.count === 2)
    assert(store.getters.counter.plus1 === 3)

    store.actions.counter.inc(3)
    assert(store.state.counter.count === 5)
    assert(store.getters.counter.plus1 === 6)

    store.actions.todos.done(1)
    assert(store.state.counter.count === 6)
    assert(store.state.todos.todos[0].isCompleted === true)
  })
})
