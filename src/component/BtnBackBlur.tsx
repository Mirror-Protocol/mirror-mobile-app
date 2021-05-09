import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { Image, Platform, StyleProp, View, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import * as Resources from '../common/Resources'

const BtnBack = (props: {
  style?: StyleProp<ViewStyle>
  onPress: () => void
}) => {
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const Btn = () => {
    return (
      <TouchableOpacity onPress={props.onPress}>
        <Image
          source={Resources.Images.btnBackW}
          style={{
            width: 10,
            height: 18,
            marginVertical: 19,
            marginHorizontal: 24,
          }}
        />
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        flexDirection: 'row',
        height: 52 + safeInsetTop,
      }}
    >
      {Platform.OS === 'android' ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            width: '100%',
            height: '100%',
            backgroundColor: Resources.Colors.darkBackground,
            opacity: 1,
          }}
        >
          <Btn />
        </View>
      ) : (
        <BlurView
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            width: '100%',
            height: '100%',
          }}
        >
          <Btn />
        </BlurView>
      )}
    </View>
  )
}

export default BtnBack
