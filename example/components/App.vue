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
import { defineComponent } from 'vue'
import { mapper } from '../store'

export default defineComponent({
  computed: {
    ...mapper.mapState({
      value: 'count',
    }),

    ...mapper.mapGetters({
      doubleValue: 'double',
      times: 'times',
    }),

    tripleValue(): number {
      return this.times(3)
    },
  },

  methods: {
    ...mapper.mapMutations(['increment']),

    ...mapper.mapActions({
      _asyncIncrement: 'asyncIncrement',
    }),

    asyncIncrement(): void {
      this._asyncIncrement(1000)
    },
  },
})
</script>
