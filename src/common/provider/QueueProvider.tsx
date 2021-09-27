import React, { createContext, useEffect, useState } from 'react'

interface Props {
  children: JSX.Element | Array<JSX.Element>
}

interface IQueueContext {
  hash: string | undefined
  setHash: (h?: string) => void
  showTxQueued: boolean
  setShowTxQueued: (b: boolean) => void
}

export const QueueContext = createContext<IQueueContext>({
  hash: undefined,
  setHash: (h?: string) => {},
  showTxQueued: false,
  setShowTxQueued: (b: boolean) => {},
})

export function QueueProvider(props: Props) {
  const [showTxQueued, setShowTxQueued] = useState<boolean>(false)
  const [hash, setHash] = useState<string>()

  return (
    <QueueContext.Provider
      value={{
        hash,
        setHash,
        showTxQueued,
        setShowTxQueued,
      }}
    >
      {props.children}
    </QueueContext.Provider>
  )
}
