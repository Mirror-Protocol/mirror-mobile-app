import React, { createContext, useState } from 'react'

export function LoadingProvider(props: { children: any }) {
  const [isLoading, setLoading] = useState(false)

  function set(isLoading: boolean) {
    setLoading(isLoading)
  }

  return (
    <LoadingContext.Provider
      value={{
        isLoading: isLoading,
        setLoading: set,
      }}
    >
      {props.children}
    </LoadingContext.Provider>
  )
}

export const LoadingContext = createContext({
  isLoading: false,
  setLoading: (isLoading: boolean) => {},
})
