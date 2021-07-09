import _ from 'lodash'
import React, { ReactNode, useEffect, useState } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'

const DEFAULT_DELAY = 1000

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
  const attrs = {
    style: style,
    onPress: _.throttle(() => {
      onPress && onPress()
    }, delay ?? DEFAULT_DELAY),
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
