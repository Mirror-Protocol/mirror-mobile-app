import React, { useContext, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Resources from '../../common/Resources'
import ThrottleButton from '../../component/ThrottleButton'
import { validateMnemonic, getMnemonicKeys } from '@terra-money/key-utils'
import * as Config from '../../common/Apis/Config'
import { StackActions } from '@react-navigation/native'

const useKeyboardState = () => {
  const [isKeyboardShow, setKeyboardShow] = useState(false)

  useEffect(() => {
    const show = () => setKeyboardShow(true)
    Keyboard.addListener('keyboardDidShow', show)
    return () => {
      Keyboard.removeListener('keyboardDidShow', show)
    }
  }, [])

  useEffect(() => {
    const hide = () => setKeyboardShow(false)
    Keyboard.addListener('keyboardDidHide', hide)
    return () => {
      Keyboard.removeListener('keyboardDidHide', hide)
    }
  }, [])

  const hideKeyboard = () => {
    Keyboard.dismiss()
  }

  return { isKeyboardShow, hideKeyboard }
}

export const RecoveryWalletView = (props: { navigation: any; route: any }) => {
  const { translations } = useContext(ConfigContext)
  const { isKeyboardShow, hideKeyboard } = useKeyboardState()
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const [wordCount, setWordCount] = useState(0)
  const [confirmEnable, setConfirmEnable] = useState(true)

  const [mk, setMk] = useState<string>('')

  const [isAwait, setAwait] = useState(false)

  useEffect(() => {
    setWordCount(getWordCount(mk))
    setConfirmEnable(validateMnemonic(mk.trim()))
  }, [mk])

  const trimMnemonicWords = (words: string): string => {
    return words.trim().replace(/\n/g, ' ')
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
        style={[styles.container, { paddingTop: safeInsetTop }]}
      >
        <View style={{ flex: 1 }}>
          {!isKeyboardShow && (
            <View
              style={{
                marginTop: 100,
              }}
            >
              <Text style={styles.title}>
                {translations.recoveryWalletView.title}
              </Text>
              <Text style={styles.subTitle}>
                {translations.recoveryWalletView.subTitle}
              </Text>
            </View>
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginHorizontal: 24,
              marginTop: 50,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 12,
                  letterSpacing: -0.3,
                  color: Resources.Colors.veryLightPinkTwo,
                }}
              >
                {wordCount}
              </Text>
              <Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 12,
                  letterSpacing: -0.3,
                  color: Resources.Colors.brownishGrey,
                }}
              >
                {'/24'}
              </Text>
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
                flex: isKeyboardShow ? 1 : undefined,
              },
            ]}
            onChangeText={(text) => {
              setMk(text)
            }}
            value={mk}
          />
        </View>
        <ThrottleButton
          type='TouchableOpacity'
          style={[
            styles.confirmButton,
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
    marginVertical: 40,
    marginHorizontal: 24,

    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: Resources.Fonts.medium,
    color: Resources.Colors.black,
    fontSize: 18,
    letterSpacing: -0.5,
  },
})
