export interface Class<R> {
  new (...args: any[]): R
}

export function assert(condition: any, message: string): void {
  if (!condition) {
    throw new Error('[sinai] ' + message)
  }
}

export function identity<T>(value: T): T {
  return value
}

export function forEachValues<T>(
  t: Record<string, T>,
  fn: (t: T, key: string) => void,
): void {
  Object.keys(t).forEach((key) => {
    fn(t[key], key)
  })
}

export function getByPath<T>(path: string[], obj: any): T {
  return path.reduce((acc, key) => acc[key], obj)
}

export function isPromise(p: any): p is Promise<any> {
  return p != null && typeof p.then === 'function'
}
