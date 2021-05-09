import React, { useContext } from 'react'
import {
  Alert,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Resources from '../../common/Resources'
import BtnBack from '../../component/BtnBack'
import Separator from '../common/Separator'
import {
  checkMultiple,
  openSettings,
  PERMISSIONS,
  request,
} from 'react-native-permissions'

type PermissionResult =
  | 'unavailable'
  | 'blocked'
  | 'denied'
  | 'granted'
  | 'limited'

export const RecoverWalletView = (props: { navigation: any; route: any }) => {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const requestPermission = async (): Promise<PermissionResult> => {
    const permissions =
      Platform.OS === 'ios' ? PERMISSIONS.IOS : PERMISSIONS.ANDROID

    return request(permissions.CAMERA)
  }

  const openPermissionSettings = (): void => {
    openSettings().catch(() => {
      // error handling
    })
  }

  const checkCameraPermission = async (): Promise<PermissionResult> => {
    const permissions =
      Platform.OS === 'ios' ? PERMISSIONS.IOS : PERMISSIONS.ANDROID

    const statuses = await checkMultiple([permissions.CAMERA])
    return statuses[permissions.CAMERA]
  }

  const onQrPress = async (): Promise<void> => {
    const requestResult = await requestPermission()
    if (requestResult === 'granted') {
      const permission = await checkCameraPermission()
      if (permission === 'granted') {
        props.navigation.navigate('RecoverQrView')
        return
      }
    }

    Alert.alert(
      'Camera not authorized',
      'Move to settings to enable camera permissions?',
      [
        { text: 'Cancel', onPress: () => {} },
        { text: 'OK', onPress: () => openPermissionSettings() },
      ],
      { cancelable: true }
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeInsetTop,
        },
      ]}
    >
      <BtnBack onPress={() => props.navigation.pop()} />
      <View style={{ paddingHorizontal: 24 }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.5,
            marginTop: 44,
            marginBottom: 28,
            color: Resources.Colors.white,
          }}
        >{`Restore wallet`}</Text>
        <Item
          image={undefined}
          title={`Seed phrase`}
          onPress={() => {
            props.navigation.navigate('RecoverSeedView')
          }}
        />
        <Separator />
        <Item
          image={undefined}
          title={`QR code`}
          onPress={() => {
            onQrPress()
          }}
        />
        <Separator />
        <Item
          image={undefined}
          title={`Private key`}
          onPress={() => {
            props.navigation.navigate('RecoverPrivateKeyView')
          }}
        />
      </View>
    </View>
  )
}

const Item = (props: {
  image?: ImageSourcePropType
  title: String
  onPress: () => void
}) => {
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
      }}
      onPress={props.onPress}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          backgroundColor: Resources.Colors.darkGrey,
        }}
      >
        {/** IMAGE */}
      </View>
      <Text
        style={{
          flex: 1,
          marginLeft: 12,
          fontFamily: Resources.Fonts.medium,
          fontSize: 18,
          letterSpacing: -0.3,
          color: Resources.Colors.veryLightPink,
        }}
      >
        {props.title}
      </Text>
      <Image
        source={Resources.Images.chevronR11G}
        style={{ width: 6, height: 12 }}
      />
    </TouchableOpacity>
  )
}

// const Separator = (props: {}) => {
//   return (
//     <>
//       <View
//         style={{
//           flex: 1,
//           height: 1,
//           borderRadius: 100,
//           borderColor: 'rgb(9, 9, 10)',
//         }}
//       />
//       <View
//         style={{
//           flex: 1,
//           height: 1,
//           borderRadius: 100,
//           borderColor: 'rgb(40, 40, 42)',
//         }}
//       />
//     </>
//   )
// }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Resources.Colors.darkBackground,
  },
})
