<template>
  <div>
    <p>count: {{ value }}</p>
    <p>double: {{ doubleValue }}</p>
    <p>triple: {{ tripleValue }}</p>
    <button type="button" @click="increment">increment</button>
    <button type="button" @click="asyncIncrement">increment with delay</button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  computed: {
    value (): number {
      return this.$store.state.count
    },
    doubleValue (): number {
      return this.$store.getters.double
    },
    tripleValue (): number {
      return this.$store.getters.times(3)
    }
  },
  methods: {
    increment (): void {
      this.$store.mutations.increment()
    },
    asyncIncrement (): void {
      this.$store.actions.asyncIncrement(1000)
    }
  }
})
</script>

