export function assert (condition: any, message: string): void {
  if (!condition) {
    throw new Error('[brave] ' + message)
  }
}

export function getByPath <T>(path: string[], obj: any): T {
  return path.reduce((acc, key) => acc[key], obj)
}
