import { Dictionary } from './core/interface'

export function assert (condition: any, message: string): void {
  if (!condition) {
    throw new Error('[brave] ' + message)
  }
}

export function forEachValues<T> (
  t: Dictionary<T>,
  fn: (t: T, key: string) => void
): void {
  Object.keys(t).forEach(key => {
    fn(t[key], key)
  })
}

export function getByPath<T> (path: string[], obj: any): T {
  return path.reduce((acc, key) => acc[key], obj)
}

export function bind<T extends Function> (obj: any, fn: T): T {
  return function boundFn (...args: any[]) {
    return fn.call(obj, ...args)
  } as any
}

export function isPromise (p: any): p is Promise<any> {
  return p != null && typeof p.then === 'function'
}
