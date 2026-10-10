import { useEffect } from 'react'
import { useAsync } from './useAsync'

export function useLoad(loader) {
  const { run, ...state } = useAsync()
  useEffect(() => { run(loader).catch(() => {}) }, [loader, run])
  const retry = () => run(loader).catch(() => {})
  return { ...state, loading: state.loading || (!state.data && !state.error), retry }
}
