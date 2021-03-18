import { useState } from 'react'
import { Platform } from 'react-native'

// Android only - overlapped button event
const useGestureHandlerEventPrevent = (): {
  isPrevent: () => boolean
  setPreventEvent: () => void
} => {
  const [prevent, setPrevent] = useState<boolean>(false)

  const setPreventEvent = (): void => {
    Platform.OS === 'android' && setPrevent(true)
  }

  const isPrevent = (): boolean => {
    if (Platform.OS === 'android' && prevent) {
      setPrevent(false)
      return true
    }
    return false
  }

  return { isPrevent, setPreventEvent }
}

export default useGestureHandlerEventPrevent
