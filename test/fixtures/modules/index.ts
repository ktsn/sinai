import { create } from '../../../src/interface'
import Counter from './counter'
import Todos from './todos'

export default create()
  .module('counter', Counter)
  .module('todos', Todos)