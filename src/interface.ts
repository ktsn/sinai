export interface Class<T> {
  new (): T
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

export declare class BG<S, MD> {
  protected readonly state: S
  protected readonly modules: MD
}

export declare class BM<S> {
  protected readonly state: S
}

export declare class BA<S, G, M, MD> {
  protected readonly state: S
  protected readonly getters: G
  protected readonly mutations: M
  protected readonly modules: MD
}

export interface BG0 extends BG<{}, {}> {}
export interface BG1<S> extends BG<S, {}> {}
export interface BM0 extends BM<{}> {}
export interface BA0 extends BA<{}, BG0, BM0, {}> {}
export interface BA1<S, G, M> extends BA<S, G, M, {}> {}
export interface BMD0 { [key: string]: Module<{}, BG0, BM0, BA0> }

export declare function Getters<S> (): Class<BG1<S>>
export declare function Mutations<S> (): Class<BM<S>>
export declare function Actions<S, G, M> (): Class<BA1<S, G, M>>

export interface Injected<SG, SGMA> {
  Getters: <S>() => Class<BG<S, SG>>
  Mutations: <S>() => Class<BM<S>>
  Actions: <S, G, M>() => Class<BA<S, G, M, SGMA>>

  and<K extends string, S, G, M, A> (
    key: K,
    module: Module<S, G, M, A>
  ): Injected<SG & CHD<K, GI<S, G>>, SGMA & CHD<K, AI<S, G, M, A>>>
}

export declare function inject<K extends string, S, G, M, A> (
  key: K,
  module: Module<S, G, M, A>
): Injected<CHD<K, GI<S, G>>, CHD<K, AI<S, G, M, A>>>

export interface ModuleOptions<S, G, M, A> {
  state?: Class<S>
  getters?: Class<G>
  mutations?: Class<M>
  actions?: Class<A>
}

export interface Module<S, G, M, A> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A

  module<K extends string, S1, G1, M1, A1> (
    key: K,
    module: Module<S1, G1, M1, A1>
  ): Module<S & CHD<K, S1>, G & CHD<K, G1>, M & CHD<K, M1>, A & CHD<K, A1>>
}

export interface Store<S, G, M, A> {
  readonly state: S
  readonly getters: G
  readonly mutations: M
  readonly actions: A
}

export declare function create<S extends {}, G extends BG0, M extends BM0, A extends BA0> (
  options?: ModuleOptions<S, G, M, A>
): Module<S, G, M, A>

export declare function store<S, G, M, A> (
  module: Module<S, G, M, A>
): Store<S, G, M, A>

