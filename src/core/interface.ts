export interface Class<R> {
  new (...args: any[]): R
}

export interface Dictionary<T> {
  [key: string]: T
}

export type CHD<K extends string, T> = {
  [_ in K]: T
}

export interface GI<S, G> {
  readonly state: S
  readonly getters: G
}

export interface AI<S, G, M, A> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A
}

export interface BG<S, MD> {
  readonly state: S
  readonly modules: MD
}

export interface BM<S> {
  readonly state: S
}

export interface BA<S, G, M, MD> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly modules: MD
}

export interface BG0 extends BG<{}, {}> {}
export interface BG1<S> extends BG<S, {}> {}
export interface BM0 extends BM<{}> {}
export interface BA0 extends BA<{}, BG0, BM0, {}> {}
export interface BA1<S, G extends BG0, M extends BM0> extends BA<S, G, M, {}> {}

