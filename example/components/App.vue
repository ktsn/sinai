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
    value () {
      return this.$store.state.count
    },
    doubleValue () {
      return this.$store.getters.double
    },
    tripleValue () {
      return this.$store.getters.times(3)
    }
  },
  methods: {
    increment () {
      this.$store.mutations.increment()
    },
    asyncIncrement () {
      this.$store.actions.asyncIncrement(1000)
    }
  }
})
</script>

