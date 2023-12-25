<template>
  <div>
    <p>count: {{ counter.count }}</p>
    <p>double: {{ counter.double }}</p>
    <p>triple: {{ tripleValue }}</p>
    <button type="button" @click="counter.increment">increment</button>
    <button type="button" @click="asyncIncrement">increment with delay</button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useCounterStore } from '../store/counter'

export default defineComponent({
  setup() {
    const counter = useCounterStore()

    const tripleValue = computed((): number => {
      return counter.times(3)
    })

    function asyncIncrement(): void {
      counter.asyncIncrement(1000)
    }

    return {
      counter,
      tripleValue,
      asyncIncrement,
    }
  },
})
</script>
