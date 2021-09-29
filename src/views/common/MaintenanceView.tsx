import React, { ReactElement, useEffect, useState } from 'react'
import { Animated, Easing, Image, Text, View } from 'react-native'
import { getJson } from '../../common/request'

import * as Resources from '../../common/Resources'
import * as Config from '../../common/Apis/Config'
import * as Sentry from '@sentry/react-native'

const LOADING_WIDTH = 70
const LOADING_HEIGHT = 70
const LOGO_WIDTH = 13
const LOGO_HEIGHT = 24
const LOGO_POS = LOADING_HEIGHT / 2 - LOGO_HEIGHT / 2

const MaintenanceView = (props: { maintenance: any }): ReactElement => {
  const spinValue = new Animated.Value(0)
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const maintenance = props.maintenance

  useEffect(() => {
    if (maintenance !== undefined && maintenance.maintenance === true) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        { iterations: 5000 }
      ).start()
    }
  }, [maintenance])

  return maintenance !== undefined && maintenance.maintenance === true ? (
    <View
      style={{
        position: 'absolute',
        flexDirection: 'column',
        width: Resources.windowSize().width,
        height: Resources.windowSize().height,
        backgroundColor: Resources.Colors.darkBackground,
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          marginBottom: 6,
        }}
      >
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
          }}
        >
          <Image
            source={Resources.Images.maintenanceProgress}
            style={{ width: LOADING_WIDTH, height: LOADING_HEIGHT }}
          />
        </Animated.View>
        <Image
          source={Resources.Images.maintenanceLogo}
          style={{
            position: 'absolute',
            width: LOGO_WIDTH,
            height: LOGO_HEIGHT,
            top: LOGO_POS,
          }}
        />
      </View>
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          color: 'rgb(255, 255, 255)',
          fontSize: 16,
          marginVertical: 8,
          alignSelf: 'center',
        }}
      >
        {maintenance.title}
      </Text>
      <Text
        style={{
          fontFamily: Resources.Fonts.book,
          color: 'rgb(255, 255, 255)',
          fontSize: 12,
          alignSelf: 'center',
        }}
      >
        {maintenance.message}
      </Text>
    </View>
  ) : (
    <View />
  )
}

export default MaintenanceView
