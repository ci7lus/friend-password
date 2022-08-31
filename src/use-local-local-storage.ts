import { useState, useCallback, useEffect } from "react"

/**
 * @mantine/hooks use-local-storage
 * https://github.com/mantinedev/mantine/blob/9fcad2e05f3620749fa6d996f637fd8698264210/src/mantine-hooks/src/use-local-storage/use-local-storage.ts
 * MIT License

Copyright (c) 2021 Vitaly Rtishchev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */

interface UseLocalStorage<T> {
  /** Local storage key */
  key: string

  /** Default value that will be set if value is not found in local storage */
  defaultValue: T

  /** If set to true, value will be update is useEffect after mount */
  getInitialValueInEffect?: boolean

  /** Function to serialize value into string to be save in local storage */
  serialize?(value: T): string

  /** Function to deserialize string value from local storage to value */
  deserialize?(value: string): T
}

function serializeJSON<T>(value: T) {
  try {
    return JSON.stringify(value)
  } catch (error) {
    throw new Error(
      "@mantine/hooks use-local-storage: Failed to serialize the value"
    )
  }
}

function deserializeJSON(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export function useLocalLocalStorage<T = string>({
  key,
  defaultValue,
  getInitialValueInEffect = true,
  deserialize = deserializeJSON,
  serialize = serializeJSON,
}: UseLocalStorage<T>) {
  const readLocalStorageValue = useCallback(
    (skipStorage?: boolean): T => {
      if (
        typeof window === "undefined" ||
        !("localStorage" in window) ||
        skipStorage
      ) {
        return (defaultValue ?? "") as T
      }

      const storageValue = window.localStorage.getItem(key)

      return storageValue !== null
        ? deserialize(storageValue)
        : ((defaultValue ?? "") as T)
    },
    [key, defaultValue]
  )

  const [value, setValue] = useState<T>(
    readLocalStorageValue(getInitialValueInEffect)
  )

  const setLocalStorageValue = useCallback(
    (val: T | ((prevState: T) => T)) => {
      if (val instanceof Function) {
        setValue((current) => {
          const result = val(current)
          window.localStorage.setItem(key, serialize(result))
          return result
        })
      } else {
        window.localStorage.setItem(key, serialize(val))
        setValue(val)
      }
    },
    [key]
  )

  useEffect(() => {
    if (defaultValue !== undefined && value === undefined) {
      setLocalStorageValue(defaultValue)
    }
  }, [defaultValue, value, setLocalStorageValue])

  useEffect(() => {
    if (getInitialValueInEffect) {
      setValue(readLocalStorageValue())
    }
  }, [])

  return [
    value === undefined ? defaultValue : value,
    setLocalStorageValue,
  ] as const
}
