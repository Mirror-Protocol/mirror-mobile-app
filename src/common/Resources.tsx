import { Dimensions } from 'react-native'
import { EdgeInsets } from 'react-native-safe-area-context/lib/typescript/src/SafeArea.types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Clipboard from '@react-native-community/clipboard'

export const Fonts = {
  medium: 'MirrorRounded-Medium',
  book: 'MirrorRounded-Book',
  light: 'MirrorRounded-Light',
  bold: 'MirrorRounded-Bold',
}

export const Colors = {
  darkBackground: '#1b1b1d',
  darkGrey: '#2c2c2e',
  darkGreyTwo: '#222224',
  darkGreyThree: '#161617',
  darkGreyFour: '#131314',
  black: '#1f1f1f',
  greyishBrown: '#555555',
  brownishGrey: '#6b6b6b',
  veryLightPink: '#cccccc',
  veryLightPinkTwo: '#eaeaea',
  white: '#ffffff',
  brightTeal: '#00edc7',
  brightTealTransparent: '#00edc766',
  aquamarine: '#01e0bc',
  sea: '#329f87',
  darkGreenBlue: '#296d60',
  dark: '#1f3b36',
  brightPink: '#ff00bd',

  dummyup: 'rgb(9,9,10)',
  dummydown: 'rgb(40,40,42)',
}

export const lotties = {
  main: require('../../assets/lotties/Mirror_splash.json'),
  loading: require('../../assets/lotties/Mirror_loading.json'),
}

export const Images = {
  iconWalletW: require('../../assets/images/iconWalletW.png'),
  iconSearch: require('../../assets/images/iconSearch.png'),
  iconDecreaseB: require('../../assets/images/iconDecreaseB.png'),
  iconIncreaseB: require('../../assets/images/iconIncreaseB.png'),
  iconDecrease: require('../../assets/images/iconDecrease.png'),
  iconIncrease: require('../../assets/images/iconIncrease.png'),
  btnBackW: require('../../assets/images/btnBackW.png'),
  btnBackB: require('../../assets/images/btnBackB.png'),
  iconSearchErase: require('../../assets/images/iconSearchErase.png'),
  btnCloseB10: require('../../assets/images/btnCloseB10.png'),
  btnCloseB12: require('../../assets/images/btnCloseB12.png'),
  btnCloseW10: require('../../assets/images/btnCloseW10.png'),
  btnCloseW12: require('../../assets/images/btnCloseW12.png'),
  btnClose16W: require('../../assets/images/btnClose16W.png'),
  btnCloseG10: require('../../assets/images/btnCloseG10.png'),
  btnResetG: require('../../assets/images/btnResetG.png'),
  btnResetW: require('../../assets/images/btnResetW.png'),
  iconNoticeW: require('../../assets/images/iconNoticeW.png'),
  iconNoticeB: require('../../assets/images/iconNoticeB.png'),
  iconMultiplicationG: require('../../assets/images/iconMultiplicationG.png'),
  iconMultiplicationB: require('../../assets/images/iconMultiplicationB.png'),
  iconPlusG: require('../../assets/images/iconPlusG.png'),
  iconMinusB: require('../../assets/images/iconMinusB.png'),
  iconEqualsW: require('../../assets/images/iconEqualsW.png'),
  iconHistoryW: require('../../assets/images/iconHistoryW.png'),
  iconSettingW: require('../../assets/images/iconSettingW.png'),
  iconQuestion: require('../../assets/images/iconQuestion.png'),
  iconBuyG: require('../../assets/images/iconBuyG.png'),
  iconSwitch: require('../../assets/images/iconSwitch.png'),
  iconCreditCard: require('../../assets/images/iconCreditCard.png'),
  iconExchange: require('../../assets/images/iconExchange.png'),
  iconSupport: require('../../assets/images/iconSupport.png'),
  iconError: require('../../assets/images/iconError.png'),
  iconSending: require('../../assets/images/iconSending.png'),

  onboarding01: require('../../assets/images/imgOnboarding01.png'),
  onboarding02: require('../../assets/images/imgOnboarding02.png'),
  onboarding03: require('../../assets/images/imgOnboarding03.png'),
  onboarding04: require('../../assets/images/imgOnboarding04.png'),
  onboarding05: require('../../assets/images/imgOnboarding05.png'),

  faceid: require('../../assets/images/faceid.png'),
  touchid: require('../../assets/images/touchid.png'),

  apple: require('../../assets/images/apple2.png'),
  google: require('../../assets/images/google2.png'),
  facebook: require('../../assets/images/facebook2.png'),

  language: require('../../assets/images/language.png'),
  version: require('../../assets/images/version.png'),
  privacy: require('../../assets/images/privacy.png'),
  biometrics: require('../../assets/images/biometrics.png'),
  password: require('../../assets/images/password.png'),
  details: require('../../assets/images/details.png'),

  logout: require('../../assets/images/logout.png'),

  chevronR10G: require('../../assets/images/chevronR10G.png'),
  chevronR11G: require('../../assets/images/chevronR11G.png'),
  btnSwapG24: require('../../assets/images/btnSwapG24.png'),
  btnSwapG26: require('../../assets/images/btnSwapG26.png'),
  iconWalletG18: require('../../assets/images/iconWalletG18.png'),

  switch_on: require('../../assets/images/switch_on.png'),
  switch_off: require('../../assets/images/switch_off.png'),
  btnExpandOpenG: require('../../assets/images/btnExpandOpenG.png'),
  btnExpandOpenB: require('../../assets/images/btnExpandOpenB.png'),
  iconCheckB: require('../../assets/images/iconCheckB.png'),

  logoKrt: require('../../assets/images/logoKrt.png'),
  logoMnt: require('../../assets/images/logoMnt.png'),
  logoSdt: require('../../assets/images/logoSdt.png'),
  logoUst: require('../../assets/images/logoUst.png'),
  logoLuna: require('../../assets/images/logoLuna.png'),

  iconCharge: require('../../assets/images/iconCharge.png'),
  iconMirror28: require('../../assets/images/iconMirror28.png'),

  logoBtc: require('../../assets/images/logoBtc.png'),
  logoEth: require('../../assets/images/logoEth.png'),
  logoMoonpay: require('../../assets/images/logoMoonpay.png'),
  LogoSimplex: require('../../assets/images/logoSimplex.png'),
  logoTransak: require('../../assets/images/logoTransak.png'),
  logoUsdc: require('../../assets/images/logoUsdc.png'),
  logoUsdt: require('../../assets/images/logoUsdt.png'),
}

export function getSafeLayoutInsets(): EdgeInsets {
  let insets = useSafeAreaInsets()
  return insets
}

export function windowSize(): { width: number; height: number } {
  return {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  }
}

export function setClipboard(text: string) {
  Clipboard.setString(text)
}

export async function pasteClipboard() {
  return await Clipboard.getString()
}
