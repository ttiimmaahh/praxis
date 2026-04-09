type AnyFunction = (...args: unknown[]) => unknown

interface DebouncedFunction<T extends AnyFunction> {
  (...args: Parameters<T>): void
  cancel(): void
}

export function debounce<T extends AnyFunction>(fn: T, wait: number): DebouncedFunction<T> {
  let timerId: ReturnType<typeof setTimeout> | undefined

  const debounced = (...args: Parameters<T>): void => {
    if (timerId !== undefined) clearTimeout(timerId)
    timerId = setTimeout(() => {
      timerId = undefined
      fn(...args)
    }, wait)
  }

  debounced.cancel = (): void => {
    if (timerId !== undefined) {
      clearTimeout(timerId)
      timerId = undefined
    }
  }

  return debounced
}
