import React, { useState, useCallback, useContext } from 'react'
import { View, Text, Image, Alert, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import LottieView from 'lottie-react-native'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'
import * as Resources from '../../common/Resources'
import * as Keychain from '../../common/Keychain'
import * as Config from '../../common/Apis/Config'
import { PasscodeMode } from '../common/PinSecurityView'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as TorusUtils from '../../common/TorusUtils'
import { gotoMain } from '../../common/Utils'

export function InitialView(props: { navigation: any; route: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const [lottiePlayed, setLottiePlayed] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const [enableButton, setEnableButton] = useState(true)

  try {
    const torusData = props.route.params.data
    const torusPubK = props.route.params.pubK
    const torusNonce = props.route.params.nonce
    props.route.params.data = undefined
    props.route.params.pubK = undefined
    props.route.params.nonce = undefined
    if (
      Platform.OS === 'android' &&
      torusData !== undefined &&
      torusPubK !== undefined &&
      torusNonce !== undefined
    ) {
      TorusUtils.processAuth({
        type: 'success',
        url:
          'mirrorapp://torusauth?' +
          'data=' +
          encodeURIComponent(torusData) +
          '&pubK=' +
          encodeURIComponent(torusPubK) +
          '&nonce=' +
          encodeURIComponent(torusNonce),
      })
        .then((ret) => {
          getWalletAddressAndMoveAgreeView(ret)
        })
        .catch((e) => {
          Alert.alert(e.errorType, e.errorMsg)
        })
    }
  } catch {}

  useFocusEffect(
    useCallback(() => {
      if (
        props.route.params &&
        props.route.params.disableLogoAnim &&
        !lottiePlayed
      ) {
        setLottiePlayed(true)
      }

      if (lottiePlayed) {
        Keychain.isFirstRun().then((isFirstRun) => {
          setShowLogin(isFirstRun)
          if (isFirstRun) {
            return
          }

          gotoMain(props.navigation)
          const param = {
            mode: PasscodeMode.Auth,
          }

          props.navigation.navigate('PinSecurityView', param)
        })
      }

      return () => {}
    }, [lottiePlayed])
  )

  async function getWalletAddressAndMoveAgreeView(auth: any) {
    const address = await Keychain.getWalletAddressFromPk(auth!.privateKey)
    Keychain.isHaveUserAddress(address).then((ret) => {
      if (ret) {
        props.navigation.navigate('InitialStack', {
          screen: 'AgreeView',
          params: { ...auth, agreePass: true },
        })
      } else {
        props.navigation.navigate('InitialStack', {
          screen: 'AgreeView',
          params: auth,
        })
      }
    })
  }

  async function passPressed(authProvider: string) {
    try {
      setEnableButton(false)
      const auth = await TorusUtils.doAuth(authProvider)

      getWalletAddressAndMoveAgreeView(auth)
    } catch (e) {
      if (e instanceof TorusUtils.TorusLoginError) {
        switch (e.errorType) {
          case 'TimeoutError':
            Alert.alert('Timed out', e.errorMsg)
            break
          case 'TorusError':
            Alert.alert('Torus error', e.errorMsg)
            break
          case 'OAuthError':
            Alert.alert('OAuth Error', e.errorMsg)
            break
          case 'UserCancelationError':
            break
          default:
            Alert.alert(e.errorType, e.errorMsg)
            break
        }
      }
    } finally {
      setEnableButton(true)
    }
  }

  return (
    <View
      style={{
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
        paddingTop: safeInsetTop,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: safeInsetTop,
          bottom: 200 + safeInsetBottom,
          width: Resources.windowSize().width,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 128,
            height: 128,
          }}
        >
          {props.route.params && props.route.params.disableLogoAnim ? (
            <LottieView
              source={Resources.lotties.main}
              loop={false}
              onAnimationFinish={() => {}}
              style={{
                width: 128,
                height: 128,
              }}
              autoPlay={false}
              progress={1}
            />
          ) : (
            <LottieView
              source={Resources.lotties.main}
              autoPlay={true}
              loop={false}
              onAnimationFinish={() => {
                setLottiePlayed(true)
              }}
              style={{
                width: 128,
                height: 128,
              }}
            />
          )}
        </View>
      </View>
      <View style={{ flex: 1 }} />
      {lottiePlayed && showLogin ? (
        <View
          style={{
            marginBottom: 20 + safeInsetBottom,
            marginTop: 32,
            marginLeft: 24,
            marginRight: 24,
          }}
        >
          <SignInButton
            title={translations.initialView.login1}
            icon={
              Config.changeLoginButton
                ? Resources.Images.apple2
                : Resources.Images.apple
            }
            enable={enableButton}
            onPress={() => {
              passPressed('apple')
            }}
          />
          <View style={{ width: 12 }} />
          <SignInButton
            title={translations.initialView.login2}
            icon={
              Config.changeLoginButton
                ? Resources.Images.google2
                : Resources.Images.google
            }
            enable={enableButton}
            onPress={() => {
              passPressed('google')
            }}
          />
          <View style={{ width: 12 }} />
          <SignInButton
            title={translations.initialView.login3}
            icon={
              Config.changeLoginButton
                ? Resources.Images.facebook2
                : Resources.Images.facebook
            }
            enable={enableButton}
            onPress={() => {
              passPressed('facebook')
            }}
          />
          <View style={{ height: 12 }} />
          <TouchableOpacity
            onPress={() => {
              props.navigation.navigate('RecoverWalletView')
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 14,
                letterSpacing: -0.3,
                color: Resources.Colors.brownishGrey,
                alignSelf: 'center',
              }}
            >
              {translations.initialView.seed}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View />
      )}
    </View>
  )
}

function SignInButton(props: {
  title: string
  icon: any
  enable: boolean
  onPress: () => void
}) {
  return (
    <RectButton
      style={{
        backgroundColor: Config.changeLoginButton
          ? Resources.Colors.white
          : Resources.Colors.darkGrey,
        borderRadius: Config.changeLoginButton ? 6 : 12,
        height: Config.changeLoginButton ? 44 : 48,
        marginBottom: 12,
        alignItems: 'center',
        flexDirection: 'row',
      }}
      enabled={props.enable}
      onPress={() => {
        props.onPress()
      }}
    >
      {Config.changeLoginButton ? (
        <Image
          style={{
            position: 'absolute',
            left: 16,
            width: 31,
            height: 44,
          }}
          source={props.icon}
        />
      ) : (
        <Image
          style={{
            position: 'absolute',
            left: 16,
            width: 18,
            height: 18,
          }}
          source={props.icon}
        />
      )}
      {Config.changeLoginButton ? (
        <Text
          style={{
            fontFamily:
              Platform.OS === 'ios' ? undefined : Resources.Fonts.medium,
            fontWeight: Platform.OS === 'ios' ? '600' : undefined,
            fontSize: 19,
            lineHeight: 24,
            color: Resources.Colors.black,
            letterSpacing: -0.38,
            marginLeft: 63,
          }}
        >
          {props.title}
        </Text>
      ) : (
        <Text
          style={{
            flex: 1,
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            color: Resources.Colors.veryLightPinkTwo,
            letterSpacing: -0.3,
            textAlign: 'center',
          }}
        >
          {props.title}
        </Text>
      )}
    </RectButton>
  )
}
