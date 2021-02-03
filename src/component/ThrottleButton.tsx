import React, { ReactNode, useEffect, useState } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'

const DEFAULT_DELAY = 1000

let timer: NodeJS.Timeout | undefined = undefined

interface Props {
  type?: 'TouchableOpacity' | 'RectButton'
  children?: ReactNode
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  delay?: number
}

const ThrottleButton = ({
  type,
  children,
  style,
  onPress,
  delay = DEFAULT_DELAY,
}: Props) => {
  const [isPress, setPress] = useState(false)

  const pressHandler = () => {
    if (!isPress) {
      setPress(true)
      onPress && onPress()

      timer = setTimeout(() => {
        setPress(false)
      }, delay)
    }
  }

  useEffect(() => {
    return () => {
      timer !== undefined && clearTimeout(timer)
    }
  }, [])

  const attrs = {
    style: style,
    onPress: pressHandler,
    children: children,
  }

  return (
    <>
      {type === 'TouchableOpacity' || undefined ? (
        <TouchableOpacity {...attrs} />
      ) : type === 'RectButton' ? (
        <RectButton {...attrs} />
      ) : null}
    </>
  )
}

export default ThrottleButton
