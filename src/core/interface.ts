export interface Class<R> {
  new (...args: any[]): R
}

export interface Dictionary<T> {
  [key: string]: T
}

export type CHD<K extends string, T> = {
  [_ in K]: T
}

