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

export function MoonpayPopupView(props: {
  navigation: any
  route: any
  status: 'completed' | 'failed'
  amount: string
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
          amount={props.amount}
          status={props.status}
          dismissPressed={dismissPressed}
        />
      </Animated.View>
    </View>
  )
}

const Content = (props: {
  navigation: any
  route: any
  amount: string
  status: 'completed' | 'failed'
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
              color:
                props.status === 'completed'
                  ? Resources.Colors.white
                  : Resources.Colors.brightPink,
            }}
          >
            {props.status === 'completed'
              ? translations.moonpayPopupView.completedTitle
              : translations.moonpayPopupView.failedTitle}
          </Text>
        </View>

        {props.status === 'completed' ? (
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
            {props.amount}
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 10,
                lineHeight: 18,
                letterSpacing: -0.14,
                color: Resources.Colors.veryLightPink,
                marginBottom: 24,
              }}
            >
              {translations.moonpayPopupView.symbol}
            </Text>
            {translations.moonpayPopupView.completedMessage1}
          </Text>
        ) : (
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
            {translations.moonpayPopupView.failedMessage1}
            {props.amount}
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 10,
                lineHeight: 18,
                letterSpacing: -0.14,
                color: Resources.Colors.veryLightPink,
                marginBottom: 24,
              }}
            >
              {translations.moonpayPopupView.symbol}
            </Text>
            {translations.moonpayPopupView.failedMessage2}
          </Text>
        )}
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

              if (props.route.name === 'RampSelectView') {
                // props.navigation.pop()
                props.navigation.navigate('WalletStack', {
                  screen: 'WalletDetailView',
                  params: {
                    symbol: Keychain.baseCurrency,
                  },
                })
              } else {
                props.navigation.push('WalletDetailView', {
                  symbol: Keychain.baseCurrency,
                })
              }
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 14,
                letterSpacing: -0.2,
                color: Resources.Colors.brightTeal,
              }}
            >
              {props.status === 'completed' &&
                translations.moonpayPopupView.details}
            </Text>
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
              {translations.moonpayPopupView.done}
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
