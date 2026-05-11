import { useRef, useEffect } from 'react';

/** Keeps a ref in sync with the latest value without triggering re-renders in event handlers. */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
