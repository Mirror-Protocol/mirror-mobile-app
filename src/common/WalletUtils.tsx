import { NativeModules } from 'react-native'

export async function isValidAddress(address: string) {
  const result = await NativeModules.TerraWallet.isValidAddress(address)
  return result
}
