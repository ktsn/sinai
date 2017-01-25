export interface Class<T> {
  new (): T
}

export interface Dictionary<T> {
  [key: string]: T
}

export type CHD<K extends string, T> = {
  [_ in K]: T
}

export declare class BG<S> {
  protected readonly state: S
}

export declare class BM<S> {
  protected readonly state: S
}

export declare class BA<S, G, M> {
  protected readonly state: S
  protected readonly getters: G
  protected readonly mutations: M
}

export interface BG0 extends BG<{}> {}
export interface BM0 extends BM<{}> {}
export interface BA0 extends BA<{}, BG0, BM0> {}
export interface BMD0 { [key: string]: Module<{}, BG0, BM0, BA0> }

export declare function Getters<S> (): Class<BG<S>>

export declare function Mutations<S> (): Class<BM<S>>

export declare function Actions<S, G extends BG0, M extends BM0> (): Class<BA<S, G, M>>

export interface ModuleOptions<S, G extends BG0, M extends BM0, A extends BA0> {
  state?: Class<S>,
  getters?: Class<G>,
  mutations?: Class<M>,
  actions?: Class<A>,
}

export declare class Module<S extends {}, G extends BG0, M extends BM0, A extends BA0> {
  constructor (options?: ModuleOptions<S, G, M, A>)

  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A

  module<K extends string, S1 extends {}, G1 extends BG0, M1 extends BM0, A1 extends BA0> (
    key: K,
    module: Module<S1, G1, M1, A1>
  ): Module<S & CHD<K, S1>, G & CHD<K, G1>, M & CHD<K, M1>, A & CHD<K, A1>>
}
