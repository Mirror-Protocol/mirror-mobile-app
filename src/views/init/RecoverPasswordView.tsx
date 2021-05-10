import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  TextInput,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Resources from '../../common/Resources'
import * as Keychain from '../../common/Keychain'
import * as Utils from '../../common/Utils'
import ThrottleButton from '../../component/ThrottleButton'
import BtnBackBlur from '../../component/BtnBackBlur'
import {
  decryptPrivateKey,
  recoverWalletFromPrivateKey,
} from '../../hooks/useRawKey'
import { StackActions } from '@react-navigation/native'
import { NotificationContext } from '../../common/provider/NotificationProvider'
import { RawKey } from '@terra-money/terra.js'

export const RecoverPasswordView = (props: { navigation: any; route: any }) => {
  const { translations } = useContext(ConfigContext)
  const { showNotification } = useContext(NotificationContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const [isKeyboardShow, setKeyboardShow] = useState(false)

  const encryptPrivateKey = props.route.params.encryptPrivateKey

  const bottomMargin = useRef(new Animated.Value(safeInsetBottom + 40)).current
  const animDuration = 200
  const startDownAnim = () => {
    Animated.parallel([
      Animated.timing(bottomMargin, {
        toValue: safeInsetBottom + 40,
        duration: animDuration,
        delay: 0,
        useNativeDriver: false,
      }),
    ]).start()
  }

  const startUpAnim = () => {
    Animated.parallel([
      Animated.timing(bottomMargin, {
        toValue: 0,
        duration: animDuration,
        delay: 0,
        useNativeDriver: false,
      }),
    ]).start()
  }

  useEffect(() => {
    const show = () => {
      setKeyboardShow(true)
      startUpAnim()
    }
    Keyboard.addListener('keyboardWillShow', show)
    Keyboard.addListener('keyboardDidShow', show)
    return () => {
      Keyboard.removeListener('keyboardWillShow', show)
      Keyboard.removeListener('keyboardDidShow', show)
    }
  }, [])

  useEffect(() => {
    const hide = () => {
      setKeyboardShow(false)
      startDownAnim()
    }
    Keyboard.addListener('keyboardWillHide', hide)
    Keyboard.addListener('keyboardDidHide', hide)
    return () => {
      Keyboard.removeListener('keyboardWillHide', hide)
      Keyboard.removeListener('keyboardDidHide', hide)
    }
  }, [])

  const hideKeyboard = () => {
    Keyboard.dismiss()
  }

  const [confirmEnable, setConfirmEnable] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    const lengthCheck = password.length >= 10
    setConfirmEnable(lengthCheck)
  }, [password])

  const recoverError = () => {
    showNotification(
      translations.recoverPasswordView.incorrectPassword,
      Resources.Colors.brightPink
    )
  }

  const recover = async (): Promise<RawKey | undefined> => {
    const privateKey = await decryptPrivateKey(encryptPrivateKey, password)
    if (privateKey) {
      return await recoverWalletFromPrivateKey(privateKey)
    }
  }

  const onNext = async () => {
    hideKeyboard()
    try {
      const wallet = await recover()
      if (wallet) {
        const isHaveAddress = await Keychain.isHaveUserAddress(
          wallet.accAddress
        )

        const authParams = {
          accessToken: '',
          email: '',
          privateKey: Utils.toHexString(wallet.privateKey),
          typeOfLogin: '',
          verifier: '',
        }

        props.navigation.dispatch({
          ...StackActions.replace('InitialStack', {
            screen: 'AgreeView',
            params: { ...authParams, agreePass: isHaveAddress },
          }),
        })
      } else {
        recoverError()
      }
    } catch (e) {
      recoverError()
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.container, { paddingTop: 52 + safeInsetTop }]}
        >
          <TouchableWithoutFeedback
            containerStyle={{ flex: 1 }}
            style={{
              flex: 1,
            }}
            onPress={() => {
              Keyboard.dismiss()
            }}
          >
            <>
              <View style={{ marginTop: 48 }}>
                <Text style={styles.title}>
                  {translations.recoverPasswordView.title}
                </Text>
                <Text style={styles.subTitle}>
                  {translations.recoverPasswordView.subTitle}
                </Text>
              </View>
              <View style={styles.pasteContainer} />
              <TextInput
                keyboardAppearance='dark'
                keyboardType='default'
                secureTextEntry={true}
                multiline={false}
                placeholder={translations.recoverPasswordView.inputPlaceHolder}
                placeholderTextColor={Resources.Colors.brownishGrey}
                underlineColorAndroid='transparent'
                style={[styles.passwordInput, { height: 64 }]}
                onChangeText={(text) => {
                  setPassword(text)
                }}
                value={password}
              />
              <View style={{ flex: 1 }} />

              <ThrottleButton
                type='TouchableOpacity'
                style={[
                  isKeyboardShow
                    ? styles.confirmButtonWithoutRadius
                    : styles.confirmButton,
                  {
                    backgroundColor: confirmEnable
                      ? Resources.Colors.brightTeal
                      : Resources.Colors.darkGreyTwo,
                  },
                ]}
                onPress={() => {
                  confirmEnable && onNext()
                }}
              >
                <Text
                  style={[
                    styles.confirmText,
                    {
                      color: confirmEnable
                        ? Resources.Colors.black
                        : Resources.Colors.greyishBrown,
                    },
                  ]}
                >
                  {translations.recoverPasswordView.confirm}
                </Text>
              </ThrottleButton>
              <Animated.View style={{ height: bottomMargin }} />
            </>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>

      <BtnBackBlur onPress={() => props.navigation.pop()} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Resources.Colors.darkBackground,
  },
  title: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 24,
    letterSpacing: -0.3,
    color: Resources.Colors.veryLightPinkTwo,
    marginHorizontal: 24,
  },
  subTitle: {
    fontFamily: Resources.Fonts.book,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.5,
    color: Resources.Colors.greyishBrown,
    marginTop: 11,
    marginHorizontal: 24,
  },
  paste: {
    fontFamily: Resources.Fonts.medium,
    color: Resources.Colors.brightTeal,
    fontSize: 12,
    letterSpacing: -0.3,
  },
  passwordInput: {
    borderRadius: 16,
    backgroundColor: Resources.Colors.darkGreyTwo,
    marginHorizontal: 24,

    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    textAlignVertical: 'top',
    color: Resources.Colors.veryLightPink,
    fontSize: 14,
    letterSpacing: -0.2,
  },
  confirmButton: {
    borderRadius: 30,
    height: 48,
    marginTop: 40,
    marginHorizontal: 24,

    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonWithoutRadius: {
    height: 48,
    marginTop: 40,

    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: Resources.Fonts.medium,
    color: Resources.Colors.black,
    fontSize: 18,
    letterSpacing: -0.5,
  },

  pasteContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginHorizontal: 32,
    height: 40,
  },
})
