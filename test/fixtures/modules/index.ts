import { create } from '../../../src'
import Counter from './counter'
import Todos from './todos'

export default create()
  .module('counter', Counter)
  .module('todos', Todos)
