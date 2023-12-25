import { computed } from 'vue'
import { Sinai } from '.'
import { StoreDefinition, UseStore } from './store'

function isUseStore(value: unknown): value is UseStore {
  return (
    typeof value === 'function' &&
    '_definition' in value &&
    typeof value._definition === 'function'
  )
}

export function hotUpdateStore(
  newUseStore: UseStore,
  initialDefinition: StoreDefinition,
  sinai: Sinai,
): void {
  const store: any = sinai.stores.get(initialDefinition)
  if (!store) {
    return
  }

  const descriptors = Object.getOwnPropertyDescriptors(
    newUseStore._definition.prototype,
  )
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

  // Set initial definition to new useStore's _definition
  // since it is used as a key to get a store instance from Sinai object.
  newUseStore._definition = initialDefinition

  // Trigger reactive property update
  store._state = { ...store._state }
}

export function acceptHMRUpdate(useStore: UseStore, hot: any) {
  return (newModule: any) => {
    const sinai = hot.data.sinai ?? useStore._sinai
    if (!sinai) {
      return
    }

    hot.data.sinai = sinai

    for (const key in newModule) {
      const value = newModule[key]

      if (!isUseStore(value)) {
        continue
      }

      if (useStore._definition.name !== value._definition.name) {
        continue
      }

      hotUpdateStore(value, useStore._definition, sinai)
      return
    }

    hot.invalidate()
  }
}
