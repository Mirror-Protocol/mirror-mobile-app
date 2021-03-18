import React, {
  useState,
  useCallback,
  useContext,
  useRef,
  useEffect,
} from 'react'
import {
  Text,
  View,
  Image,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native'
import * as Resources from '../../../common/Resources'
import * as BioAuth from '../../../common/BioAuth'
import * as Keychain from '../../../common/Keychain'
import * as Config from '../../../common/Apis/Config'
import { ScrollView, RectButton } from 'react-native-gesture-handler'
import { PasscodeMode } from '../../common/PinSecurityView'
import { useFocusEffect } from '@react-navigation/native'
import { NavigationView } from '../../common/NavigationView'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import ReactNativePickerModule from 'react-native-picker-module'
import RNRestart from 'react-native-restart'
import ThrottleButton from '../../../component/ThrottleButton'
import DeviceInfo from 'react-native-device-info'

export function SettingView(props: { navigation: any }) {
  const { translations, pw } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const [bioAuthTitle, setBioAuthTitle] = useState('')
  const [bioSupport, setBioSupport] = useState(false)
  const [useBio, setUseBio] = useState(false)

  const [changeConfig, setChangeConfig] = useState(false)

  const touchIdTitle = translations.settingView.useTouchId
  const faceIdTitle = translations.settingView.useFaceId

  useFocusEffect(
    useCallback(() => {
      loadBio()

      return () => {}
    }, [])
  )

  useEffect(() => {
    return () => {
      if (Config.isDev && changeConfig) {
        reset()
      }
    }
  })

  async function loadBio() {
    const type = await BioAuth.getSupportType()

    if (type != BioAuth.BioType.none) {
      const title = type == BioAuth.BioType.faceID ? faceIdTitle : touchIdTitle
      setBioAuthTitle(title)
      setBioSupport(true)
    } else {
      const title =
        Platform.OS == 'ios' && safeInsetTop > 0 ? faceIdTitle : touchIdTitle

      setBioAuthTitle(title)
      setBioSupport(false)
    }

    const value = await Keychain.getUseBio()
    setUseBio(value)
  }

  return (
    <View
      style={{
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
        paddingTop: safeInsetTop,
      }}
    >
      <ScrollView
        style={{
          paddingTop: 0,
          flex: 1,
          paddingLeft: 24,
          paddingRight: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 52 }} />
        <Text
          style={{
            marginTop: 48,
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.5,
            color: Resources.Colors.white,
          }}
        >
          {translations.settingView.setting}
        </Text>
        <WalletInfo
          onPressed={() => {
            props.navigation.push('WalletInfoView')
          }}
        />
        <View
          style={{
            marginTop: 32,
            height: 1,
            backgroundColor: Resources.Colors.dummyup,
          }}
        />
        <View
          style={{
            height: 1,
            backgroundColor: Resources.Colors.dummydown,
          }}
        />
        <ChangePw
          onPressed={() => {
            const param = {
              mode: PasscodeMode.Reset,
            }
            props.navigation.push('PinSecurityView', param)
          }}
        />
        <BioAuthView
          title={bioAuthTitle}
          useBio={useBio}
          bioSupport={bioSupport}
          onPressed={() => {
            if (!bioSupport) {
              const msg =
                Platform.OS === 'ios'
                  ? translations.settingView.biometricAuthHintIOS
                  : translations.settingView.biometricAuthHintAndroid

              Alert.alert('Mirror', msg)
              return
            }

            if (!useBio) {
              Keychain.setUseBio(
                pw,
                true,
                translations.bioAuthView.authTitle
              ).then(() => {
                setUseBio(true)
              })
            } else {
              Keychain.setUseBio(pw, false).then(() => {
                setUseBio(false)
              })
            }
          }}
        />
        <Privacy
          onPressed={() => {
            props.navigation.navigate('PrivacyView')
          }}
        />
        <Version
          onPressed={() => {
            props.navigation.navigate('VersionView')
          }}
        />
        <ContactUs
          onPressed={() => {
            const supportEmail = 'support@mirrorwallet.com'
            try {
              Linking.openURL(`mailto:${supportEmail}`)
            } catch (e) {}
          }}
        />
        <Language />
        {Config.isDev && (
          <>
            <SelectChain setChangeConfig={setChangeConfig} />
            <ResetApp />
          </>
        )}
        <View style={{ height: 52 }} />
      </ScrollView>
      <NavigationView navigation={props.navigation} />
    </View>
  )
}

function WalletInfo(props: { onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View style={{ marginTop: 12, flexDirection: 'row' }}>
      <ThrottleButton
        type='TouchableOpacity'
        onPress={() => {
          props.onPressed()
        }}
        style={{
          height: 28,
          borderRadius: 14,
          paddingLeft: 14,
          paddingRight: 14,

          backgroundColor: Resources.Colors.darkGreyTwo,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode={'tail'}
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.15,
            color: Resources.Colors.brightTeal,
          }}
        >
          {translations.settingView.account}
        </Text>
      </ThrottleButton>
      <View style={{ flex: 1 }} />
    </View>
  )
}

function ChangePw(props: { onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <RectButton
      style={styles.buttonbg}
      onPress={() => {
        props.onPressed()
      }}
    >
      <Image source={Resources.Images.password} style={styles.buttonimg} />
      <Text style={styles.buttonlabel}>
        {translations.settingView.changePassword}
      </Text>
      <Image
        source={Resources.Images.details}
        style={{ width: 7, height: 13 }}
      />
    </RectButton>
  )
}

function BioAuthView(props: {
  onPressed: () => void
  title: string
  useBio: boolean
  bioSupport: boolean
}) {
  return (
    <RectButton
      style={styles.buttonbg}
      onPress={() => {
        props.onPressed()
      }}
    >
      <Image source={Resources.Images.biometrics} style={styles.buttonimg} />
      <Text style={styles.buttonlabel}>{props.title}</Text>
      <View style={{ width: 52, height: 32 }}>
        <View
          style={{
            width: 52,
            height: 32,
            borderRadius: 16,
            backgroundColor: Resources.Colors.darkGrey,
          }}
        />

        <View
          style={{
            position: 'absolute',
            top: 4,
            left: props.useBio && props.bioSupport ? 22 : 4,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor:
              props.useBio && props.bioSupport
                ? Resources.Colors.brightTeal
                : Resources.Colors.brownishGrey,
            shadowColor: Resources.Colors.darkBackground,
            shadowOpacity: 0.1,
            shadowRadius: 2,
            shadowOffset: {
              width: 3,
              height: 0,
            },
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {props.useBio && props.bioSupport ? (
            <Image
              source={Resources.Images.iconCheckB}
              style={{ width: 12, height: 12 }}
            />
          ) : (
            <View />
          )}
        </View>
      </View>
    </RectButton>
  )
}

function Privacy(props: { onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)
  return (
    <RectButton
      style={styles.buttonbg}
      onPress={() => {
        props.onPressed()
      }}
    >
      <Image source={Resources.Images.privacy} style={styles.buttonimg} />
      <Text style={styles.buttonlabel}>
        {translations.settingView.privacyAndTerms}
      </Text>
      <Image
        source={Resources.Images.details}
        style={{ width: 7, height: 13 }}
      />
    </RectButton>
  )
}

function Version(props: { onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)
  return (
    <RectButton
      style={styles.buttonbg}
      onPress={() => {
        props.onPressed()
      }}
    >
      <Image source={Resources.Images.version} style={styles.buttonimg} />
      <Text style={styles.buttonlabel}>{translations.settingView.version}</Text>
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 18,
          letterSpacing: -0.22,
          color: Resources.Colors.greyishBrown,
          marginRight: 6,
        }}
      >
        {'V.' + DeviceInfo.getVersion()}
      </Text>
      <Image
        source={Resources.Images.details}
        style={{ width: 7, height: 13 }}
      />
    </RectButton>
  )
}

function ContactUs(props: { onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)
  return (
    <RectButton
      style={styles.buttonbg}
      onPress={() => {
        props.onPressed()
      }}
    >
      <Image source={Resources.Images.iconSupport} style={styles.buttonimg} />
      <Text style={styles.buttonlabel}>
        {translations.settingView.contactUs}
      </Text>
      <Image
        source={Resources.Images.details}
        style={{ width: 7, height: 13 }}
      />
    </RectButton>
  )
}

function Language() {
  return null
}

function reset() {
  try {
    Keychain.reset()
  } finally {
    RNRestart.Restart()
  }
}

function ResetApp() {
  const { translations } = useContext(ConfigContext)

  return (
    <>
      <RectButton style={styles.buttonbg} onPress={() => reset()}>
        <View style={styles.buttonimg} />
        <Text style={styles.buttonlabel}>
          {translations.settingView.resetApp}
        </Text>
        <Image
          source={Resources.Images.details}
          style={{ width: 7, height: 13 }}
        />
      </RectButton>
    </>
  )
}

// DEV ONLY
function SelectChain(props: { setChangeConfig: (b: boolean) => void }) {
  const { translations } = useContext(ConfigContext)
  const pickerRef = useRef<ReactNativePickerModule | undefined>(undefined)

  const [currentChain, setCurrentChain] = useState('')
  useEffect(() => {
    Keychain.getCurrentChain().then((chain) => {
      setCurrentChain(chain)
    })
  }, [currentChain])

  return (
    <>
      <RectButton
        style={styles.buttonbg}
        onPress={() => {
          pickerRef.current?.show()
        }}
      >
        <View style={styles.buttonimg} />
        <Text style={styles.buttonlabel}>
          {translations.settingView.selectChain + '\n > ' + currentChain}
        </Text>
        <Image
          source={Resources.Images.details}
          style={{ width: 7, height: 13 }}
        />
      </RectButton>
      <ReactNativePickerModule
        pickerRef={pickerRef as any}
        value={currentChain}
        items={['columbus', 'tequila']}
        onValueChange={(value) => {
          setCurrentChain(value)
          Keychain.setCurrentChain(value).then(() => {
            props.setChangeConfig(true)
            Keychain.reset()
          })
        }}
      />
    </>
  )
}

const styles = StyleSheet.create({
  buttonbg: {
    marginTop: 24,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonimg: {
    width: 24,
    height: 24,
  },
  buttonlabel: {
    flex: 1,
    marginLeft: 12,
    fontFamily: Resources.Fonts.book,
    fontSize: 18,
    letterSpacing: -0.3,
    color: Resources.Colors.veryLightPinkTwo,
  },
})
