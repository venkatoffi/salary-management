import { useCallback, useState } from 'react'

export function useAsync() {
  const [state, setState] = useState({ loading: false, error: null, data: null })

  const run = useCallback(async (action) => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const data = await action()
      setState({ loading: false, error: null, data })
      return data
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error }))
      throw error
    }
  }, [])

  return { ...state, run, setState }
}
