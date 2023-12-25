# Sinai

Class based state management for Vue.

## Examples

```ts
import { defineStore } from 'sinai'

// Declare a store with class syntax
class CounterState {
  // Properties will be reactive value
  count = 0

  // Getters will be computed property
  get half(): number {
    return this.count / 2
  }

  inc(): void {
    this.count += 1
  }

  dec(): void {
    this.count -= 1
  }
}

// Create composable with defineStore function
export const useCounter = defineStore(CounterState)
```

```ts
import { createApp } from 'vue'
import { createSinai } from '../src'
import App from './components/App.vue'

// Create Sinai instance
const sinai = createSinai()

// Install Sinai instance to Vue app
createApp(App).use(sinai).mount('#app')
```

```vue
<script setup lang="ts">
import { useCounter } from '../store/counter'

const counter = useCounter()
</script>

<template>
  <button @click="counter.dec">-</button>
  <span>{{ counter.count }}</span>
  <button @click="counter.inc">+</button>
</template>
```

For other examples, see [tests](test/specs/).

## License

MIT
