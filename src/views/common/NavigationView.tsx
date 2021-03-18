import React from 'react'
import { View, Image, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { BlurView } from '@react-native-community/blur'

export function NavigationView(props: { navigation: any }) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: safeInsetTop + 52,
        flexDirection: 'row',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {Platform.OS === 'android' ? (
          <View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: Resources.Colors.darkBackground,
              opacity: 1,
            }}
          />
        ) : (
          <BlurView style={{ width: '100%', height: '100%' }} />
        )}
      </View>
      <TouchableOpacity
        style={{
          marginLeft: 11,
          marginTop: 10 + safeInsetTop,
          width: 36,
          height: 36,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        hitSlop={{ left: 8, top: 8, right: 8, bottom: 8 }}
        onPress={() => {
          props.navigation.pop()
        }}
      >
        <Image
          style={{ width: 10, height: 18 }}
          source={Resources.Images.btnBackW}
        />
      </TouchableOpacity>
    </View>
  )
}
