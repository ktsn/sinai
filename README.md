# Sinai
[![npm version](https://badge.fury.io/js/sinai.svg)](https://badge.fury.io/js/sinai)
[![Build Status](https://travis-ci.org/ktsn/sinai.svg?branch=master)](https://travis-ci.org/ktsn/sinai)
[![sinai Dev Token](https://badge.devtoken.rocks/sinai)](https://devtoken.rocks/package/sinai)

Type safe state management inspired by Vuex.

**This library includes many type level hacks. Use at your own risk and do not use if you are unsure about the mechanism under the hood.**

**If you search a production ready state management solution, take a look [vuex-smart-module](https://github.com/ktsn/vuex-smart-module)**

## Requirements

* Vue >= 2.5
* TypeScript >= 2.8

## Examples

```ts
import { store as createStore, module, Getters, Mutations, Actions } from 'sinai'

// Declare the module state and its initial value
class CounterState {
  count = 0
}

// Declare getters
class CounterGetters extends Getters<CounterState>() {
  get half () {
    return this.state.count / 2
  }
}

// Declare mutations
class CounterMutations extends Mutations<CounterState>() {
  inc () {
    this.state.count += 1
  }

  dec () {
    this.state.count -= 1
  }
}

// Declare actions
class CounterActions extends Actions<CounterState, CounterGetters, CounterMutations>() {
  asyncInc (ms: number) {
    console.log('count: ' + this.state.count)
    console.log('half: ' + this.getters.half)

    return new Promise(resolve => {
      setTimeout(() => {
        this.mutations.inc()
        resolve()
      }, ms)
    })
  }
}

// Create module by composing state/getters/mutations/actions
const counter = module({
  state: CounterState,
  getters: CounterGetters,
  mutations: CounterMutations,
  actions: CounterActions
})

// Create root module
const root = module().child('counter', counter)

// Create store
const store = createStore(root, {
  strict: process.env.NODE_ENV !== 'production'
})

// These will be all type checked
console.log(store.state.counter.count)
console.log(store.getters.counter.half)
store.actions.counter.asyncInc(1000)
store.mutations.counter.inc()
```

For other examples, see [tests](test/specs/).

## License

MIT
