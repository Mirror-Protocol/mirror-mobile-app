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
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Resources from '../../common/Resources'
import ThrottleButton from '../../component/ThrottleButton'
import { validateMnemonic, getMnemonicKeys } from '@terra-money/key-utils'
import * as Config from '../../common/Apis/Config'
import { StackActions } from '@react-navigation/native'
import BtnBack from '../../component/BtnBack'

export const RecoveryWalletView = (props: { navigation: any; route: any }) => {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const [isKeyboardShow, setKeyboardShow] = useState(false)

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

  const [wordCount, setWordCount] = useState(0)
  const [confirmEnable, setConfirmEnable] = useState(true)

  const [mk, setMk] = useState<string>('')

  const [isAwait, setAwait] = useState(false)

  useEffect(() => {
    setWordCount(getWordCount(mk))
    setConfirmEnable(validateMnemonic(trimMnemonicWords(mk)))
  }, [mk])

  const trimMnemonicWords = (words: string): string => {
    const w = words.trim().toLowerCase().replace(/\n/g, ' ')
    console.log(w)
    return w
  }

  const getWordCount = (words: string): number => {
    const split = trimMnemonicWords(words).split(' ')

    let count = 0
    split.forEach((w) => {
      w !== '' && count++
    })

    return count
  }

  const createWallet = () => {
    setAwait(true)
    hideKeyboard()
    setTimeout(async () => {
      try {
        const keys = await getMnemonicKeys(trimMnemonicWords(mk), {
          chainID: Config.currentDomain.chainID,
          URL: Config.currentDomain.chainDomain,
        })

        props.navigation.dispatch({
          ...StackActions.replace('SelectWalletView', { keys }),
        })
      } finally {
        setAwait(false)
      }
    })
  }

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback
          containerStyle={{ flex: 1 }}
          style={{
            flex: 1,
            paddingTop: safeInsetTop,
          }}
          onPress={() => {
            Keyboard.dismiss()
          }}
        >
          <>
            <BtnBack onPress={() => props.navigation.pop()} />
            {!isKeyboardShow && (
              <View style={{ marginTop: 100 }}>
                <Text style={styles.title}>
                  {translations.recoveryWalletView.title}
                </Text>
                <Text style={styles.subTitle}>
                  {translations.recoveryWalletView.subTitle}
                </Text>
              </View>
            )}
            <View style={styles.wordCountContainer}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={styles.wordCountText}>{wordCount}</Text>
                <Text style={styles.wordCountText2}>{'/24'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Resources.pasteClipboard().then((value) => setMk(value))
                }}
              >
                <Text style={styles.paste}>
                  {translations.recoveryWalletView.paste}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              keyboardAppearance='dark'
              keyboardType='default'
              multiline={true}
              placeholder={translations.recoveryWalletView.inputPlaceHolder}
              placeholderTextColor={Resources.Colors.brownishGrey}
              underlineColorAndroid='transparent'
              style={[
                styles.seedInput,
                {
                  height: isKeyboardShow ? 200 : undefined,
                },
              ]}
              onChangeText={(text) => {
                setMk(text)
              }}
              value={mk.toLowerCase()}
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
              onPress={() => createWallet()}
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
                {translations.recoveryWalletView.confirm}
              </Text>
            </ThrottleButton>
            <Animated.View style={{ height: bottomMargin }} />
          </>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      {isAwait && (
        <View
          style={{
            position: 'absolute',
            justifyContent: 'center',
            width: Resources.windowSize().width,
            height: Resources.windowSize().height,
          }}
        >
          <ActivityIndicator size='large' color='#ffffff' animating={true} />
        </View>
      )}
    </>
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
    alignSelf: 'center',
  },
  subTitle: {
    fontFamily: Resources.Fonts.book,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.5,
    color: Resources.Colors.greyishBrown,
    alignSelf: 'center',
    marginTop: 11,
    marginHorizontal: 55,
    textAlign: 'center',
  },
  paste: {
    fontFamily: Resources.Fonts.medium,
    color: Resources.Colors.brightTeal,
    fontSize: 12,
    letterSpacing: -0.3,
  },
  seedInput: {
    flex: 1,
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

  wordCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 50,
    marginBottom: 16,
  },

  wordCountText: {
    fontFamily: Resources.Fonts.book,
    fontSize: 12,
    letterSpacing: -0.3,
    color: Resources.Colors.veryLightPinkTwo,
  },
  wordCountText2: {
    fontFamily: Resources.Fonts.book,
    fontSize: 12,
    letterSpacing: -0.3,
    color: Resources.Colors.brownishGrey,
  },
})
