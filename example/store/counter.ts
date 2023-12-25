import { acceptHMRUpdate, defineStore } from '../../src'

class CounterStore {
  count = 0

  get double() {
    return this.count * 2
  }

  times(n: number): number {
    return this.count * n
  }

  increment(): void {
    this.count += 1
  }

  asyncIncrement(delay: number) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.increment()
        resolve()
      }, delay)
    })
  }
}

export const useCounterStore = defineStore(CounterStore)

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCounterStore, import.meta.hot))
}
