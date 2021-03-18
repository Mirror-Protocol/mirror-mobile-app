import React, { useContext, useEffect, useRef } from 'react'
import { Text, View, Animated, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import {
  RectButton,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Keychain from '../../common/Keychain'

export function NotificationPopupView(props: {
  navigation: any
  route: any
  title: string
  content: string
  done: string
  onDismissPressed: () => void
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const duration = 200
  const bgOpacity = useRef(new Animated.Value(0)).current
  const windowBottom = useRef(new Animated.Value(-safeInsetBottom - 260))
    .current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 0.9,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(windowBottom, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start()
  }, [])

  function dismissPressed() {
    Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(windowBottom, {
        toValue: -safeInsetBottom - 260,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      props.onDismissPressed()
    })
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: Resources.windowSize().width,
        height: Resources.windowSize().height,
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: Resources.Colors.darkGreyFour,
          opacity: bgOpacity,
        }}
      >
        <RectButton
          style={{ flex: 1 }}
          onPress={() => {
            dismissPressed()
          }}
        />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: windowBottom,
          width: Resources.windowSize().width,
        }}
      >
        <Content
          navigation={props.navigation}
          route={props.route}
          title={props.title}
          content={props.content}
          done={props.done}
          dismissPressed={dismissPressed}
        />
      </Animated.View>
    </View>
  )
}

const Content = (props: {
  navigation: any
  route: any
  title: string
  content: string
  done: string
  dismissPressed: () => void
}) => {
  const { translations } = useContext(ConfigContext)

  return (
    <TouchableWithoutFeedback
      style={{
        flexDirection: 'column',
        backgroundColor: Resources.Colors.darkBackground,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
      onPress={() => {}}
    >
      <View
        style={{
          marginHorizontal: 24,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 40,
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.2,
              color: Resources.Colors.white,
            }}
          >
            {props.title}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            lineHeight: 18,
            letterSpacing: -0.2,
            color: Resources.Colors.veryLightPink,
            marginBottom: 24,
          }}
        >
          {props.content}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => {
              props.dismissPressed()
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 14,
                letterSpacing: -0.2,
                color: Resources.Colors.brightTeal,
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              borderRadius: 30,
              backgroundColor: Resources.Colors.darkGreyTwo,
            }}
            onPress={() => {
              props.dismissPressed()
            }}
          >
            <Text
              style={{
                marginHorizontal: 30,
                marginVertical: 10,
                fontFamily: Resources.Fonts.medium,
                fontSize: 14,
                letterSpacing: -0.3,
                color: Resources.Colors.brightTeal,
              }}
            >
              {props.done}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View
        style={{
          width: '100%',
          height:
            Resources.getSafeLayoutInsets().bottom +
            (Platform.OS === 'ios' ? 30 : 60),
        }}
      />
    </TouchableWithoutFeedback>
  )
}
