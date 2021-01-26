import React, {
  useState,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import {
  StyleSheet,
  Text,
  View,
  BackHandler,
  Image,
  Alert,
  Animated,
} from 'react-native'
import { RectButton } from 'react-native-gesture-handler'
import * as Keychain from '../../common/Keychain'
import * as BioAuth from '../../common/BioAuth'
import * as Resources from '../../common/Resources'
import * as Api from '../../common/Apis/Api'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { NotificationContext } from '../../common/provider/NotificationProvider'
import { useFocusEffect } from '@react-navigation/native'
import { gotoMain } from '../../common/Utils'

const DUMMY = -9999
const BACKSPACE = -1

enum PasscodeSetStep {
  AuthInput,
  NewInput,
  NewReInput,
}

export enum PasscodeMode {
  Set = 0,
  Auth = 1,
  Reset = 2,
}

export function PinSecurityView(props: { route: any; navigation: any }) {
  const { translations, pw, setPw } = useContext(ConfigContext)
  const { showNotification } = useContext(NotificationContext)

  const [cancelable, setCancelable] = useState(false)

  const [mode, setMode] = useState(PasscodeMode.Set)
  const [step, setStep] = useState(PasscodeSetStep.NewInput)

  const [masterKey, setMasterKey] = useState('masterKey')

  const [passcode1, setPasscode1] = useState([] as number[])
  const [passcode2, setPasscode2] = useState([] as number[])

  const [passcodeWrongCount, setPasscodeWrongCount] = useState(0)
  const [showLockView, setShowLockView] = useState(false)

  useEffect(() => {
    const mode = props.route.params.mode
    setMode(mode)

    if (mode == PasscodeMode.Reset) {
      setCancelable(true)
    } else {
      setCancelable(false)
    }

    if (mode == PasscodeMode.Set) {
      setStep(PasscodeSetStep.NewInput)
    } else if (mode == PasscodeMode.Reset) {
      setStep(PasscodeSetStep.AuthInput)
    } else {
      checkLockStatus()
      checkBioStatus()
      setStep(PasscodeSetStep.AuthInput)
    }
  }, [])

  useEffect(() => {
    if (passcodeWrongCount >= 5) {
      setPasscodeWrongCount(0)

      const now = new Date().getTime()
      Keychain.setPasswordLock(now + 60 * 1000)

      checkLockStatus()
    }
  }, [passcodeWrongCount])

  function checkLockStatus() {
    Keychain.getPasswordLock().then((time) => {
      const now = new Date().getTime()
      if (now - time > 0) {
        if (showLockView) {
          setShowLockView(false)
        }
      } else {
        if (!showLockView) {
          setShowLockView(true)
        }
      }
    })
  }

  const lockTimer = useRef(null as any)
  useEffect(() => {
    if (showLockView) {
      if (lockTimer.current == null) {
        lockTimer.current = setInterval(() => {
          checkLockStatus()
        }, 1000)
      }
    } else {
      if (lockTimer.current) {
        clearInterval(lockTimer.current)
      }
    }
  }, [showLockView])

  async function checkBioStatus() {
    const support = await BioAuth.isSupport()
    if (!support) {
      return
    }
    const use = await Keychain.getUseBio()
    if (!use) {
      return
    }

    try {
      await Keychain.loadBiometricKey(setPw, translations.bioAuthView.authTitle)
      gotoMain(props.navigation)
    } catch (e) {}
  }

  useFocusEffect(
    useCallback(() => {
      const callback = () => {
        return true
      }
      BackHandler.addEventListener('hardwareBackPress', callback)
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', callback)
      }
    }, [])
  )

  function numberPressed(index: number) {
    if (mode == PasscodeMode.Set) {
      if (step == PasscodeSetStep.NewInput) {
        checkNewInput(index)
      } else if (step == PasscodeSetStep.NewReInput) {
        checkReInput(index)
      }
    } else if (mode == PasscodeMode.Reset) {
      if (step == PasscodeSetStep.AuthInput) {
        checkExisting(index)
      } else if (step == PasscodeSetStep.NewInput) {
        checkNewInput(index)
      } else if (step == PasscodeSetStep.NewReInput) {
        checkReInput(index)
      }
    } else {
      checkAuth(index)
    }
  }

  async function checkExisting(index: number) {
    let newPasscode = passcode1.slice()
    if (index == BACKSPACE) {
      newPasscode.pop()
    } else {
      if (newPasscode.length < 6) {
        newPasscode.push(index)
      }
    }
    setPasscode1(newPasscode)

    if (newPasscode.length == 6) {
      const pass = newPasscode.join('')
      const flag = await Keychain.checkPassword(pass)
      setTimeout(() => {
        setPasscode1([])

        if (!flag) {
          setStep(PasscodeSetStep.AuthInput)
          showNotification(
            translations.pinSecurityView.notMatch,
            Resources.Colors.brightPink
          )
          startShake()
        } else {
          setMasterKey(pass)
          setStep(PasscodeSetStep.NewInput)
        }
      }, 200)
    }
  }

  function checkNewInput(index: number) {
    let newPasscode = passcode1.slice()
    if (index == BACKSPACE) {
      newPasscode.pop()
    } else {
      if (newPasscode.length < 6) {
        newPasscode.push(index)
      } else {
        return
      }
    }
    setPasscode1(newPasscode)

    if (newPasscode.length == 6) {
      setTimeout(() => {
        setStep(PasscodeSetStep.NewReInput)
      }, 200)
    }
  }

  async function checkReInput(index: number) {
    let newPasscode = passcode2.slice()
    if (index == BACKSPACE) {
      newPasscode.pop()
    } else {
      if (newPasscode.length < 6) {
        newPasscode.push(index)
      } else {
        return
      }
    }
    setPasscode2(newPasscode)

    if (newPasscode.length == 6) {
      const p1 = passcode1.join('')
      const p2 = newPasscode.join('')

      if (p1 != p2) {
        setTimeout(() => {
          setPasscode2([])
          showNotification(
            translations.pinSecurityView.notMatch,
            Resources.Colors.brightPink
          )
          startShake()
        }, 200)
      } else {
        if (mode == PasscodeMode.Set) {
          Keychain.setUserEmail(props.route.params.email)
          await Keychain.setPrivateKeyToKeystore(
            setPw,
            props.route.params.privateKey,
            p1
          )

          Keychain.setSkipOnboarding()

          await Keychain.addUserAddress(
            await Keychain.getWalletAddressFromPk(props.route.params.privateKey)
          )

          Keychain.setLoginType(props.route.params.typeOfLogin)

          try {
            await Api.setConnect(undefined)
          } catch (e) {}

          try {
            const haveBalanceHistory = await Api.getHaveBalanceHistory()
            if (haveBalanceHistory) {
              Keychain.setWelcomeDone()
            }
          } catch (e) {}

          const support = await BioAuth.isSupport()
          if (support) {
            props.navigation.push('BioAuthView')
          } else {
            gotoMain(props.navigation)
          }
        } else {
          if (masterKey == null) {
            console.error(new Error('Huh?'))
          }

          const oldkey = masterKey
          const pwCheckRes = await Keychain.checkPassword(oldkey)
          if (!pwCheckRes) {
            throw new Error('Huh?')
          }
          let bioFlag = false
          if (await Keychain.getUseBio()) {
            bioFlag = true
            await Keychain.setUseBio(p1, false)
          }

          setMasterKey('')
          await Keychain.updatePassword(setPw, oldkey, p1)

          if (bioFlag) {
            try {
              await Keychain.setUseBio(
                p1,
                true,
                translations.bioAuthView.authTitle
              )
            } catch (e) {}
          }

          props.navigation.pop()
          showNotification(
            translations.pinSecurityView.changed,
            Resources.Colors.brightTeal
          )
        }
      }
    }
  }

  async function checkAuth(index: number) {
    let newPasscode = passcode1.slice()
    if (index == BACKSPACE) {
      newPasscode.pop()
    } else {
      if (newPasscode.length < 6) {
        newPasscode.push(index)
      } else {
        return
      }
    }

    setPasscode1(newPasscode)

    if (newPasscode.length == 6) {
      const p1 = newPasscode.join('')
      const flag = await Keychain.checkPassword(p1)

      if (!flag) {
        setPasscode1([])
        setStep(PasscodeSetStep.AuthInput)
        showNotification(
          translations.pinSecurityView.notMatch,
          Resources.Colors.brightPink
        )
        startShake()
        setPasscodeWrongCount(passcodeWrongCount + 1)
      } else {
        successAuth(setPw, props.route, props.navigation, p1)
      }
    }
  }

  const shakeAnimation = useRef(new Animated.Value(0)).current

  function startShake() {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start()
  }

  try {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: Resources.Colors.darkBackground,
          paddingTop: Resources.getSafeLayoutInsets().top,
        }}
      >
        <View style={{ height: 44 }}>
          {cancelable && step != PasscodeSetStep.NewReInput ? (
            <CancelButton
              onPressed={() => {
                if (
                  cancelable &&
                  (mode == PasscodeMode.Auth ||
                    step == PasscodeSetStep.AuthInput ||
                    step == PasscodeSetStep.NewInput)
                ) {
                  props.navigation.pop()
                  return
                }

                setStep(PasscodeSetStep.NewInput)
                setPasscode1([])
                setPasscode2([])
              }}
            />
          ) : step == PasscodeSetStep.NewReInput ? (
            <BackButton
              onPressed={() => {
                setStep(PasscodeSetStep.NewInput)
                setPasscode1([])
                setPasscode2([])
              }}
            />
          ) : (
            <View />
          )}
        </View>

        <StatusView mode={mode} step={step} />

        <Animated.View
          style={{
            transform: [{ translateX: shakeAnimation }],
            position: 'absolute',
            top:
              mode == PasscodeMode.Auth || mode == PasscodeMode.Reset
                ? 168
                : 231,
            width: Resources.windowSize().width,
            marginTop: Resources.getSafeLayoutInsets().top,
          }}
        >
          <DotView
            count={
              step == PasscodeSetStep.AuthInput
                ? passcode1.length
                : step == PasscodeSetStep.NewInput
                ? passcode1.length
                : passcode2.length
            }
            mode={mode}
          />
        </Animated.View>

        <View style={{ flex: 1 }} />

        <View
          style={{
            paddingLeft: 6,
            paddingRight: 6,
            marginBottom: Resources.getSafeLayoutInsets().bottom + 8,
          }}
        >
          <NumberView numberPressed={numberPressed} />

          {step == PasscodeSetStep.AuthInput && mode == PasscodeMode.Auth ? (
            <View
              style={{
                marginTop: 30,
                marginBottom: 14,
                height: 24,
              }}
            >
              <ForgotPasswordView
                resetPressed={() => {
                  Keychain.reset()
                  props.navigation.navigate('InitialView')
                }}
              />
            </View>
          ) : (
            <View />
          )}
        </View>

        {showLockView ? <LockView navigation={props.navigation} /> : <View />}
      </View>
    )
  } catch (e) {
    return <View />
  }
}

function StatusView(props: { mode: PasscodeMode; step: PasscodeSetStep }) {
  const { translations } = useContext(ConfigContext)

  let title = ''
  let subtitle = ''
  if (props.mode == PasscodeMode.Set || props.mode == PasscodeMode.Reset) {
    if (props.step == PasscodeSetStep.AuthInput) {
      title = translations.pinSecurityView.authTitle
      subtitle = ''
    } else if (props.step == PasscodeSetStep.NewInput) {
      title = translations.pinSecurityView.newTitle
      subtitle = translations.pinSecurityView.newSubTitle
    } else if (props.step == PasscodeSetStep.NewReInput) {
      title = translations.pinSecurityView.newReTitle
      subtitle = translations.pinSecurityView.newReSubTitle
    }

    if (props.mode == PasscodeMode.Reset) {
      subtitle = ''
    }
  } else {
    title = translations.pinSecurityView.authTitle
  }

  return (
    <View style={{ marginTop: 60 }}>
      <Text
        style={{
          textAlign: 'center',
          marginTop: 0,
          fontFamily: Resources.Fonts.medium,
          fontSize: 24,
          letterSpacing: -0.3,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 11,
          textAlign: 'center',
          fontFamily: Resources.Fonts.book,
          fontSize: 14,
          lineHeight: 18,
          letterSpacing: -0.5,
          color: Resources.Colors.greyishBrown,
        }}
      >
        {subtitle}
      </Text>
    </View>
  )
}

function DotView(props: any) {
  let list = []
  for (let i = 0; i < 6; i++) {
    const selected = !(props.count <= i)
    list.push({ selected: selected })
  }

  return (
    <View
      style={{
        height: 14,
        alignItems: 'center',
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        {list.map((item, index) => {
          return (
            <View
              key={index}
              style={{
                width: 36,
                height: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: item.selected
                    ? Resources.Colors.brightTeal
                    : Resources.Colors.darkGrey,
                  borderRadius: 7,
                }}
              />
            </View>
          )
        })}
      </View>
    </View>
  )
}

function NumberButton(props: any) {
  const styles = StyleSheet.create({
    buttonNumber: {
      flex: 1,
      backgroundColor: 'transparent',
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 8,
    },
    buttonNumberText: {
      flex: 1,
      fontSize: 24,
      textAlign: 'center',
      color: Resources.Colors.veryLightPinkTwo,
      fontFamily: Resources.Fonts.medium,
    },
  })

  const index = props.index
  if (index == DUMMY) {
    return <View style={styles.buttonNumber} />
  } else {
    return (
      <RectButton
        style={styles.buttonNumber}
        onPress={() => {
          props.onPressed(index)
        }}
      >
        <Text style={styles.buttonNumberText}>
          {index == BACKSPACE ? '<' : index}
        </Text>
      </RectButton>
    )
  }
}

function successAuth(
  setPw: (pw: string) => void,
  route: any,
  navigation: any,
  masterKey: string
) {
  setPw(masterKey)
  gotoMain(navigation)
}

function ForgotPasswordView(props: { resetPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        marginBottom: Resources.getSafeLayoutInsets().bottom + 14,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 48,
      }}
    >
      <RectButton
        style={{ marginTop: -6, height: 36, justifyContent: 'center' }}
        onPress={() => {
          Alert.alert('', translations.pinSecurityView.forgotMessage, [
            {
              text: translations.pinSecurityView.forgotButton1,
              onPress: (value) => {},
              style: 'cancel',
            },
            {
              text: translations.pinSecurityView.forgotButton2,
              onPress: (value) => {
                props.resetPressed()
              },
              style: 'default',
            },
          ])
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 12,
            letterSpacing: -0.2,
            color: Resources.Colors.veryLightPink,
          }}
        >
          {translations.pinSecurityView.forgotPassword}
        </Text>
      </RectButton>
    </View>
  )
}

function CancelButton(props: { onPressed: () => void }) {
  return (
    <View style={{ height: 48 }}>
      <RectButton
        style={{
          marginLeft: 12,
          marginTop: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
        }}
        onPress={props.onPressed}
      >
        <Image
          source={Resources.Images.btnCloseW12}
          style={{ width: 12, height: 12 }}
        />
      </RectButton>
    </View>
  )
}

function BackButton(props: { onPressed: () => void }) {
  return (
    <View style={{ height: 48 }}>
      <RectButton
        style={{
          marginLeft: 13,
          marginTop: 7,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
        }}
        onPress={props.onPressed}
      >
        <Image
          source={Resources.Images.btnBackW}
          style={{ width: 10, height: 18 }}
        />
      </RectButton>
    </View>
  )
}

function NumberView(props: { numberPressed: (n: number) => void }) {
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <NumberButton index={1} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={2} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={3} onPressed={props.numberPressed} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <NumberButton index={4} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={5} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={6} onPressed={props.numberPressed} />
      </View>
      <View style={{ flexDirection: 'row', marginTop: 6 }}>
        <NumberButton index={7} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={8} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={9} onPressed={props.numberPressed} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          marginTop: 6,
        }}
      >
        <NumberButton index={DUMMY} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={0} onPressed={props.numberPressed} />
        <View style={{ width: 6 }} />
        <NumberButton index={BACKSPACE} onPressed={props.numberPressed} />
      </View>
    </View>
  )
}

function LockView(props: { navigation: any }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: Resources.getSafeLayoutInsets().top,
        width: '100%',
        height: '100%',
        backgroundColor: Resources.Colors.darkBackground,
      }}
    >
      <Text
        style={{
          marginTop: 104,
          fontFamily: Resources.Fonts.medium,
          fontSize: 24,
          letterSpacing: -0.3,
          color: Resources.Colors.veryLightPinkTwo,
          textAlign: 'center',
        }}
      >
        {translations.pinSecurityView.lockedTitle}
      </Text>
      <Text
        style={{
          marginTop: 11,
          fontFamily: Resources.Fonts.medium,
          fontSize: 14,
          lineHeight: 18,
          letterSpacing: -0.3,
          color: Resources.Colors.greyishBrown,
          textAlign: 'center',
        }}
      >
        {translations.pinSecurityView.lockedMessage}
      </Text>
      <View style={{ flex: 1 }} />
      <ForgotPasswordView
        resetPressed={() => {
          Keychain.reset()
          props.navigation.navigate('InitialView')
        }}
      />
    </View>
  )
}
