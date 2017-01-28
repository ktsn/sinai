import { Getters, Mutations, Actions, create } from '../../../src'

class CounterState {
  count = 0
}

class CounterGetters extends Getters<CounterState>() {
  get plus1 () {
    return this.state.count + 1
  }
}

class CounterMutations extends Mutations<CounterState>() {
  inc (n: number) {
    this.state.count += n
  }

  dec (n: number) {
    this.state.count -= n
  }
}

class CounterActions extends Actions<CounterState, CounterGetters, CounterMutations>() {
  inc (n: number) {
    this.mutations.inc(n)
  }

  dec (n: number) {
    this.mutations.dec(n)
  }
}

export default create({
  state: CounterState,
  getters: CounterGetters,
  mutations: CounterMutations,
  actions: CounterActions
})
