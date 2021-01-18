import { Platform } from 'react-native'
import * as PlatformKeychain from 'react-native-keychain'
import TouchID from 'react-native-touch-id'

const RNTouchIDCfg = undefined

export enum BioType {
  faceID,
  touchID,
  none,
}

export async function getSupportType(): Promise<BioType> {
  if (Platform.OS === 'ios') {
    try {
      await TouchID.isSupported()
    } catch (e) {
      return BioType.none
    }
  }

  const biometryType = await PlatformKeychain.getSupportedBiometryType()

  if (biometryType == PlatformKeychain.BIOMETRY_TYPE.FACE_ID) {
    return BioType.faceID
  } else if (
    biometryType == PlatformKeychain.BIOMETRY_TYPE.FACE ||
    biometryType == PlatformKeychain.BIOMETRY_TYPE.IRIS ||
    biometryType == PlatformKeychain.BIOMETRY_TYPE.TOUCH_ID ||
    biometryType == PlatformKeychain.BIOMETRY_TYPE.FINGERPRINT
  ) {
    return BioType.touchID
  }

  return BioType.none
}

export async function isSupport(): Promise<boolean> {
  const biometryType = await getSupportType()
  return biometryType != BioType.none
}

export async function auth(reason?: string): Promise<boolean> {
  const supportedBiometric = await getSupportType()
  if (supportedBiometric !== BioType.none) {
    try {
      await TouchID.authenticate(reason, RNTouchIDCfg)
    } catch (e) {
      return false
    }
    return true
  } else {
    return false
  }
}

export async function storeMasterKey(
  masterKey: string,
  title?: string
): Promise<void> {
  await PlatformKeychain.setGenericPassword('placeholder', masterKey, {
    accessControl: PlatformKeychain.ACCESS_CONTROL.BIOMETRY_ANY,
    accessible: PlatformKeychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    authenticationPrompt: {
      title: title ?? 'Verify your fingerprint',
    },
  })
}

export async function getMasterKey(title?: string): Promise<string> {
  let credentials = null
  try {
    credentials = await PlatformKeychain.getGenericPassword({
      accessControl: PlatformKeychain.ACCESS_CONTROL.BIOMETRY_ANY,
      accessible: PlatformKeychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      authenticationPrompt: {
        title: title ?? 'Verify your fingerprint',
      },
    })
  } catch (e) {
    throw new Error('Unauthorized.')
  }

  if (credentials) {
    return credentials.password
  } else {
    throw new Error('Password retrieval failed!')
  }
}
