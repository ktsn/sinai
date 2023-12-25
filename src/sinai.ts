import { App } from 'vue'
import { StoreDefinition } from './store'

export interface Sinai {
  stores: SinaiStores
  install(app: App): void
}

type SinaiStores = Map<StoreDefinition, object>

export let activeSinai: Sinai | undefined

export function createSinai(): Sinai {
  const stores: SinaiStores = new Map()

  const sinai: Sinai = {
    stores,
    install() {
      setActiveSinai(sinai)
    },
  }

  return sinai
}

export function setActiveSinai(sinai: Sinai): void {
  activeSinai = sinai
}
