import { inject, create } from '../../../src'
import Counter from './counter'

const { Getters, Mutations, Actions } = inject('counter', Counter)

interface Todo {
  id: number
  isCompleted: boolean
  title: string
}

class TodosState {
  todos: Todo[] = [{
    id: 1,
    isCompleted: false,
    title: 'Test'
  }]
  filter: 'all' | 'active' | 'completed' = 'all'
}

class TodosGetters extends Getters<TodosState>() {
  get all () {
    return this.state.todos
  }

  get active () {
    return this.state.todos.filter(t => !t.isCompleted)
  }

  get completed () {
    return this.state.todos.filter(t => t.isCompleted)
  }

  get filtered () {
    return this[this.state.filter]
  }

  find (id: number): Todo | undefined {
    return this.state.todos.filter(t => t.id === id)[0]
  }
}

class TodosMutations extends Mutations<TodosState>() {
  done (id: number) {
    const todo = this.state.todos.filter(t => t.id === id)[0]
    todo.isCompleted = true
  }
}

class TodosActions extends Actions<TodosState, TodosGetters, TodosMutations>() {
  done (id: number) {
    const todo = this.getters.find(id)
    if (!todo) {
      return
    }
    this.modules.counter.mutations.inc(1)
    this.mutations.done(id)
  }
}

export default create({
  state: TodosState,
  getters: TodosGetters,
  mutations: TodosMutations,
  actions: TodosActions
})
