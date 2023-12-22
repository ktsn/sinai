import { store, createMapper } from '../../src'
import counter from './counter'

const s = store(counter, {
  strict: true,
})

export const mapper = createMapper<typeof s>()

export default s
