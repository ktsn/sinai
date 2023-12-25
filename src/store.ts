import { reactive, computed } from 'vue'
import { Sinai, activeSinai } from './sinai'

export type StoreDefinition<T extends object = object> = new () => T

export interface UseStore<T = object> {
  (sinai?: Sinai): T
  _definition: StoreDefinition
  _sinai?: Sinai
}

export function defineStore<T extends StoreDefinition>(
  definition: T,
): UseStore<InstanceType<T>> {
  const useStore: UseStore<InstanceType<T>> = (sinai) => {
    sinai ??= activeSinai
    if (!sinai) {
      throw new Error('Sinai is not installed')
    }

    // Set sinai for HMR
    useStore._sinai = sinai

    let store = sinai.stores.get(definition)
    if (!store) {
      store = createStore(definition)
      sinai.stores.set(definition, store)
    }

    return store as InstanceType<T>
  }

  useStore._definition = definition

  return useStore
}

export function createStore<T extends StoreDefinition>(
  definition: T,
): InstanceType<T> {
  const store = reactive<any>({
    _state: {},
  })

  const descriptors = Object.getOwnPropertyDescriptors(definition.prototype)
  for (const key in descriptors) {
    const descriptor = descriptors[key]
    if (descriptor.set) {
      throw new Error('Store must not have any setters')
    }

    if (descriptor.get) {
      const getter = computed(descriptor.get.bind(store))
      Object.defineProperty(store, key, {
        get: () => getter.value,
        enumerable: true,
        configurable: true,
      })
    } else if (typeof descriptor.value === 'function') {
      store[key] = descriptor.value.bind(store)
    }
  }

  const instance: any = new definition()
  for (const key in instance) {
    store._state[key] = instance[key]

    Object.defineProperty(store, key, {
      get: () => store._state[key],
      set: (value: any) => (store._state[key] = value),
      enumerable: true,
      configurable: true,
    })
  }

  return store
}
