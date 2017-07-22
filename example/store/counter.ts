import { Getters, Mutations, Actions, module } from '../../'

class CounterState {
  count = 0
}

class CounterGetters extends Getters<CounterState>() {
  get double () {
    return this.state.count * 2
  }

  times (n: number) {
    return this.state.count * n
  }
}

class CounterMutations extends Mutations<CounterState>() {
  increment () {
    this.state.count += 1
  }
}

class CounterActions extends Actions<CounterState, CounterGetters, CounterMutations>() {
  asyncIncrement (delay: number) {
    return new Promise(resolve => {
      setTimeout(() => {
        this.mutations.increment()
      }, delay)
    })
  }
}

export default module({
  state: CounterState,
  getters: CounterGetters,
  mutations: CounterMutations,
  actions: CounterActions
})
