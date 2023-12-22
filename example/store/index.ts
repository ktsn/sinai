import Vue from 'vue'
import { store, install, createMapper } from '../../'
import counter from './counter'

Vue.use(install)

const s = store(counter, {
  strict: true,
})

export const mapper = createMapper<typeof s>()

export default s
