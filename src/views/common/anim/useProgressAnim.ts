import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

const DEFAULT_WIDTH = 40
const DEFAULT_DURATION = 1000
const DEFAULT_DELAY = 100

const useProgressAnim = ({
  width,
  duration,
  delay,
}: {
  width?: number
  duration?: number
  delay?: number
}): {
  progressAnimLeft: Animated.Value
  progressAnimWidth: Animated.Value
} => {
  const progressAnimWidth = useRef(new Animated.Value(0)).current
  const progressAnimLeft = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.sequence([
        Animated.timing(progressAnimWidth, {
          toValue: width ?? DEFAULT_WIDTH,
          easing: Easing.in(Easing.exp),
          duration: duration ?? DEFAULT_DURATION,
          delay: delay ?? DEFAULT_DELAY,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnimWidth, {
          toValue: 0,
          easing: Easing.out(Easing.exp),
          duration: duration ?? DEFAULT_DURATION,
          delay: delay ?? DEFAULT_DELAY,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(progressAnimLeft, {
          toValue: 0,
          easing: Easing.in(Easing.exp),
          duration: duration ?? DEFAULT_DURATION,
          delay: delay ?? DEFAULT_DELAY,
          useNativeDriver: false,
        }),
        Animated.timing(progressAnimLeft, {
          toValue: width ?? DEFAULT_WIDTH,
          easing: Easing.out(Easing.exp),
          duration: duration ?? DEFAULT_DURATION,
          delay: delay ?? DEFAULT_DELAY,
          useNativeDriver: false,
        }),
      ]),
    ])
    Animated.loop(anim).start()
  }, [])

  return { progressAnimLeft, progressAnimWidth }
}

export default useProgressAnim
