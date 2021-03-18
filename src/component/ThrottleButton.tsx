import _ from 'lodash'
import { both } from 'ramda'
import React, { ReactNode, useEffect, useState } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'

const DEFAULT_DELAY = 1000

let timer: NodeJS.Timeout | undefined = undefined

interface Props {
  type?: 'TouchableOpacity' | 'RectButton'
  children?: ReactNode
  hitSlop?: number
  style?: StyleProp<ViewStyle>
  onPress?: () => void
  delay?: number
}

const ThrottleButton = ({
  type,
  children,
  style,
  hitSlop,
  onPress,
  delay,
}: Props) => {
  const [isPress, setPress] = useState(false)

  const onPressHandler = () => {
    if (!isPress) {
      setPress(true)
      onPress && onPress()

      timer = setTimeout(() => {
        setPress(false)
      }, delay ?? DEFAULT_DELAY)
    }
  }

  // useEffect(() => {
  //   return () => {
  //     timer !== undefined && clearTimeout(timer)
  //     setPress(false)
  //   }
  // }, [])

  const attrs = {
    style: style,
    onPress: onPressHandler,
    children: children,
    hitSlop: hitSlop
      ? { left: hitSlop, top: hitSlop, right: hitSlop, bottom: hitSlop }
      : undefined,
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
