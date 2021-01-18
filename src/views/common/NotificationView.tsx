import React, { useEffect, useContext, useRef } from 'react'
import { Text, View, Animated } from 'react-native'
import { NotificationContext } from '../../common/provider/NotificationProvider'
import * as Resources from '../../common/Resources'

export function NotificationView() {
  const { hideNotification, notificationInfo } = useContext(NotificationContext)

  useEffect(() => {
    doAnimate(true)
  }, [])

  const width = Resources.windowSize().width - 48
  const height = 46
  const message = notificationInfo.message
  const onPressed: () => void = notificationInfo.onPressed

  const duration = 200
  const fadeAnim = useRef(new Animated.Value(-height)).current
  const animationStyles = {
    transform: [{ translateY: fadeAnim }],
  }

  function hideWithAnimation() {
    doAnimate(false)
    onPressed()
  }

  function doAnimate(isShow: boolean) {
    Animated.timing(fadeAnim, {
      toValue: isShow ? 0 : -height,
      duration: duration,
      useNativeDriver: true,
    }).start(() => {
      if (isShow) {
        setTimeout(() => {
          hideWithAnimation()
        }, 1500)
      } else {
        hideNotification()
      }
    })
  }

  return (
    <Animated.View
      style={[
        animationStyles,
        { position: 'absolute', width: width, height: height },
      ]}
    >
      <View
        style={{
          position: 'absolute',
          left: 24,
          top: Resources.getSafeLayoutInsets().top + 8,
          width: width,
          borderRadius: 12,
          backgroundColor: notificationInfo.color,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontFamily: Resources.Fonts.medium,
            letterSpacing: -0.3,
            lineHeight: 16,
            marginLeft: 16,
            marginRight: 16,
            marginTop: 18,
            marginBottom: 18,
            color: Resources.Colors.darkGreyFour,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  )
}
