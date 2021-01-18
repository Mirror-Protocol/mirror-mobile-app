import React, { useState, useContext, useCallback } from 'react'
import { StyleSheet, Text, View, Image, BackHandler, Alert } from 'react-native'
import * as Keychain from '../../common/Keychain'
import * as BioAuth from '../../common/BioAuth'
import * as Resources from '../../common/Resources'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { useFocusEffect } from '@react-navigation/native'
import { gotoMain } from '../../common/Utils'
import ThrottleButton from '../../component/ThrottleButton'

export function BioAuthView(props: { navigation: any }) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const { translations, pw } = useContext(ConfigContext)
  const [isFaceID, setFaceID] = useState(false)

  useFocusEffect(
    useCallback(() => {
      BioAuth.getSupportType().then((type) => {
        setFaceID(type == BioAuth.BioType.faceID)
      })

      const callback = () => {
        return true
      }
      BackHandler.addEventListener('hardwareBackPress', callback)
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', callback)
      }
    }, [])
  )

  const title = isFaceID
    ? translations.bioAuthView.useFaceId
    : translations.bioAuthView.useTouchId
  const subtitle = isFaceID
    ? translations.bioAuthView.useFaceIdSub
    : translations.bioAuthView.useTouchIdSub

  function laterPressed() {
    Keychain.setUseBio(pw, false)
    gotoMain(props.navigation)
  }

  async function enablePressed() {
    try {
      await Keychain.setUseBio(pw, true, translations.bioAuthView.authReason)
      gotoMain(props.navigation)
    } catch (e) {
      Alert.alert('Mirror', translations.bioAuthView.biometricFailMsg)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: Resources.getSafeLayoutInsets().top,
      }}
    >
      <View style={{ height: 52, flexDirection: 'row' }}>
        <View style={{ flex: 1 }} />
        <ThrottleButton
          type={'RectButton'}
          style={{
            marginTop: 11,
            marginRight: 18,
            height: 36,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            laterPressed()
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.2,
              color: Resources.Colors.brightTeal,
            }}
          >
            {translations.bioAuthView.later}
          </Text>
        </ThrottleButton>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View
        style={{
          position: 'absolute',
          top: 221,
          width: Resources.windowSize().width,
          height: 32,
          marginTop: Resources.getSafeLayoutInsets().top,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1, alignItems: 'center' }}>
          {isFaceID ? (
            <Image
              style={{ marginTop: 57, width: 96, height: 96 }}
              source={Resources.Images.faceid}
            />
          ) : (
            <Image
              style={{ marginTop: 58, width: 92, height: 94 }}
              source={Resources.Images.touchid}
            />
          )}
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <View style={{ marginBottom: safeInsetBottom + 20 }}>
        <ThrottleButton
          type='RectButton'
          style={{
            marginLeft: 24,
            marginRight: 24,
            height: 48,
            borderRadius: 24,
            backgroundColor: Resources.Colors.brightTeal,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={() => {
            enablePressed()
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 18,
              letterSpacing: -0.5,
              color: Resources.Colors.black,
            }}
          >
            {translations.bioAuthView.enable}
          </Text>
        </ThrottleButton>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  title: {
    marginTop: 52,
    fontSize: 24,
    letterSpacing: -0.5,
    color: Resources.Colors.veryLightPinkTwo,
    fontFamily: Resources.Fonts.medium,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 11,
    fontSize: 14,
    letterSpacing: -0.17,
    lineHeight: 16,
    fontFamily: Resources.Fonts.book,
    color: Resources.Colors.greyishBrown,
    textAlign: 'center',
  },
  buttonEnable: {
    marginTop: 8,
  },
})
