import { BlurView } from '@react-native-community/blur'
import { StackActions } from '@react-navigation/native'
import React from 'react'
import {
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Resources from '../../../common/Resources'

const RampNavHeader = (props: {
  navigation: any
  showBack: boolean
  onClosePress?: () => void
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        navHeaderStyles.container,
        !props.showBack && { justifyContent: 'flex-end' },
        {
          height: insets.top + 52,
        },
      ]}
    >
      <View style={navHeaderStyles.blurContainer}>
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
      {props.showBack && (
        <TouchableOpacity
          style={{ padding: 8, marginLeft: 24 }}
          onPress={() => {
            props.navigation.pop()
          }}
        >
          <Image
            source={Resources.Images.btnBackW}
            style={{ width: 10, height: 18 }}
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={{ padding: 8, marginRight: 24 }}
        onPress={() => {
          if (props.onClosePress) {
            props.onClosePress()
          } else {
            props.navigation.pop(StackActions.popToTop())
            props.navigation.pop()
          }
        }}
      >
        <Image
          source={Resources.Images.btnClose16W}
          style={{ width: 18, height: 18 }}
        />
      </TouchableOpacity>
    </View>
  )
}

const navHeaderStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    flexDirection: 'row',
    width: '100%',
    left: 0,
    top: 0,
    paddingBottom: 8,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  blurContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
})

export default RampNavHeader
