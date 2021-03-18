import { NativeModules, Platform } from 'react-native'
import nacl from 'tweetnacl'
// @ts-ignore
import argon2 from 'react-native-argon2'
import { scrypt } from 'scrypt-js'
import { generateSecureRandom } from 'react-native-securerandom'
import * as PlatformKeychain from 'react-native-keychain'
import { Buffer } from 'buffer'
import { RawKey } from '@terra-money/terra.js'
import * as Api from '../common/Apis/Api'
import * as BioAuth from '../common/BioAuth'
import * as Config from '../common/Apis/Config'

import { InvalidKeyError, InvalidAlgorithmError } from './CryptographicErrors'
import _ from 'lodash'
import { SwitchainOrderResponse } from '../hooks/useSwitchain'

enum KeychainKeys {
  Wallet = 'wallet',
  Address = 'address',
  Email = 'email',
}

enum PrefKeys {
  AppIsInititialized = 'AppIsInititialized',
  Locale = 'Locale',
  UseBio = 'UseBio',
  LoginType = 'LoginType',
  MainChartType = 'MainChartType',
  InvestDetailChartType = 'InvestDetailChartType',

  favoriteList = 'favoriteList',
  PasswordLock = 'password_lock',
  welcomePageShow = 'welcomePageShow',
  refundNotiShow = 'refundNotiShow',
  hideBalance = 'hideBalance',
  loginAddress = 'loginAddress',
  skipOnboarding = 'skipOnboarding',
  currentChain = 'currentChain',
  currentTorusNet = 'currentTorusNet',
  lastMoonpayHistory = 'lastMoonpayHistory',
  lastMoonpayStatus = 'lastMoonpayStatus',
  lastMoonpayOpen = 'lastMoonpayOpen',
  switchainStatus = 'switchainStatus',
}

export const baseCurrency = 'uusd'
export const baseCurrencyDenom = 'UST'

const preferences = NativeModules.RnPreferences
const keystore = NativeModules.RnKeystore

export async function setCurrentTorusNet(net: string) {
  await preferences.setString(PrefKeys.currentTorusNet, net)
}

export async function getCurrentTorusNet() {
  const net = await preferences.getString(PrefKeys.currentTorusNet)
  if (net === undefined || net === '') {
    return Config.isDev ? 'testnet' : 'mainnet'
  }

  return Config.isDev ? net : 'mainnet'
}

export async function setCurrentChain(chain: string) {
  await preferences.setString(PrefKeys.currentChain, chain)
}

export async function getCurrentChain() {
  const chain = await preferences.getString(PrefKeys.currentChain)
  if (chain === undefined || chain === '') {
    return Config.isDev ? 'tequila' : 'columbus'
  }

  return chain
}

export async function setMoonpayLastHistory(history: string) {
  if (history !== undefined) {
    await preferences.setString(PrefKeys.lastMoonpayHistory, history)
  }
}

export async function getMoonpayLastHistory() {
  const history = await preferences.getString(PrefKeys.lastMoonpayHistory)
  if (history === undefined || history === null) return ''

  return history
}

export async function setMoonpayLastStatus(status: string) {
  await preferences.setString(PrefKeys.lastMoonpayStatus, status)
}

export async function clearMoonpayLastStatus() {
  await preferences.setString(PrefKeys.lastMoonpayStatus, '')
}

export async function getMoonpayLastStatus() {
  const status = await preferences.getString(PrefKeys.lastMoonpayStatus)
  if (status === undefined || status === null) return ''

  return status
}

export async function setMoonpayLastOpen(date: string) {
  await preferences.setString(PrefKeys.lastMoonpayOpen, date)
}

export async function clearMoonpayLastOpen() {
  await preferences.setString(PrefKeys.lastMoonpayOpen, '')
}

export async function getMoonpayLastOpen() {
  const date = await preferences.getString(PrefKeys.lastMoonpayOpen)
  if (date === undefined || date === null) return ''

  return date
}

export async function getSwitchainOffer(key?: string) {
  const status = await preferences.getString(PrefKeys.switchainStatus)
  if (status === undefined || status === null || status === '') {
    return []
  }

  const parse = JSON.parse(status)
  if (key) {
    const ret = _.find(parse, (i) => {
      const keys = Object.keys(i)
      return keys.length > 0 && keys[0] === key
    })
    return ret
  } else {
    return parse
  }
}

export async function addSwitchainOffer(
  key: string,
  order: SwitchainOrderResponse,
  progress: string = 'progress'
) {
  const status = await getSwitchainOffer()
  const newOffer = { [key]: { order, progress } }
  const filter = [
    ..._.filter(status, (i) => {
      const keys = Object.keys(i)
      return keys.length > 0 && keys[0] !== key
    }),
    newOffer,
  ]

  preferences.setString(PrefKeys.switchainStatus, JSON.stringify(filter))
}

export async function modifySwitchainOffer(
  key: string,
  order?: SwitchainOrderResponse,
  progress?: string
) {
  const modify = await getSwitchainOffer(key)
  if (modify) {
    if (order) modify[key].order = order
    if (progress) modify[key].progress = progress
  }

  const status = await getSwitchainOffer()
  const filter = [
    ..._.filter(status, (i) => {
      const keys = Object.keys(i)
      return keys.length > 0 && keys[0] !== key
    }),
    modify,
  ]

  preferences.setString(PrefKeys.switchainStatus, JSON.stringify(filter))
}

export async function removeSwitchainOffer(key: string) {
  const status = await getSwitchainOffer()
  const filter = [
    ..._.filter(status, (i) => {
      const keys = Object.keys(i)
      return keys.length > 0 && keys[0] !== key
    }),
  ]

  preferences.setString(PrefKeys.switchainStatus, JSON.stringify(filter))
}

export function setLocalePref(index: number) {
  preferences.setInt(PrefKeys.Locale, index)
}

export async function getLocalePref() {
  return await preferences.getInt(PrefKeys.Locale)
}

export async function setUseBio(pw: string, value: boolean, title?: string) {
  if (value) {
    await activateBioAuth(pw, title)
  } else {
    deactivateBioAuth()
  }
  await preferences.setBool(PrefKeys.UseBio, value)
}

export async function getUseBio() {
  return await preferences.getBool(PrefKeys.UseBio)
}

export async function setLoginType(name: string): Promise<void> {
  return await preferences.setString(PrefKeys.LoginType, name)
}

export async function getLoginType() {
  return preferences.getString(PrefKeys.LoginType)
}

export async function activateBioAuth(
  masterKey: string,
  title?: string
): Promise<void> {
  if (Platform.OS === 'ios') {
    const success = await BioAuth.auth(title)
    if (!success) {
      throw new Error('Bio authentication failed')
    }
  }
  await BioAuth.storeMasterKey(masterKey, title)
}

export async function deactivateBioAuth(): Promise<void> {
  await PlatformKeychain.resetGenericPassword()
}

export async function loadBiometricKey(
  setPw: (pw: string) => void,
  title?: string
): Promise<void> {
  const key = await getBiometricKey(title)
  setPw(key)
}

export async function getBiometricKey(title?: string): Promise<string> {
  const key = await BioAuth.getMasterKey(title)

  try {
    const flag = await checkPassword(key)
    if (!flag) {
      throw new Error('Invalid biometric keystore value')
    }
  } catch (e) {
    throw e
  }

  return key
}

export function setPasswordLock(time: number) {
  preferences.setString(PrefKeys.PasswordLock, time.toString())
}

export async function getPasswordLock() {
  const response = await preferences.getString(PrefKeys.PasswordLock)
  if (response == null || response == undefined || response == '') {
    return 0
  }
  return response
}

export async function setSkipOnboarding() {
  await preferences.setBool(PrefKeys.skipOnboarding, true)
}

export async function getSkipOnboarding() {
  const response = await preferences.getBool(PrefKeys.skipOnboarding)
  if (response === null || response === undefined) return false
  else return response
}

export async function setSkipRefundNotification() {
  preferences.setBool(PrefKeys.refundNotiShow, true)
}
export async function getSkipRefundNotification() {
  const response = await preferences.getBool(PrefKeys.refundNotiShow)
  if (response == null || response == undefined) {
    return false
  }
  return response
}

export function setWelcomeDone() {
  preferences.setBool(PrefKeys.welcomePageShow, true)
}

export async function isWelcomePageDone() {
  const response = await preferences.getBool(PrefKeys.welcomePageShow)
  if (response == null || response == undefined) {
    return false
  }
  return response
}

export async function getHideBalance() {
  const response = await preferences.getString(PrefKeys.hideBalance)
  if (response === null || response === undefined || response === '') {
    return true
  }
  return response === 'true' ? true : false
}

export async function toggleHideBalance() {
  const hideBalance = await getHideBalance()
  await preferences.setString(PrefKeys.hideBalance, (!hideBalance).toString())
}

export async function toggleFavorite(value: string) {
  var s = await preferences.getString(PrefKeys.favoriteList)

  var json = { list: [] as any[] }
  if (s != null && s != undefined && s != '') {
    json = JSON.parse(s)
  }

  const denom = value.toLowerCase()

  var list: string[] = json.list
  if (list.includes(denom)) {
    list = list.filter((v) => {
      return v != denom
    })
  } else {
    list.push(denom)
  }
  json.list = list
  preferences.setString(PrefKeys.favoriteList, JSON.stringify(json))
}

export async function isFavorite(value: string): Promise<boolean> {
  const s = await preferences.getString(PrefKeys.favoriteList)
  var json = { list: [] }
  if (s != null && s != undefined && s != '') {
    json = JSON.parse(s)
  }
  const list: string[] = json.list
  return list.includes(value.toLowerCase())
}

export async function getWalletAddressFromPk(privateKey: string) {
  let pk = privateKey
  if (pk.startsWith('0x')) {
    pk = pk.replace('0x', '')
  }

  if (pk.length != 64) {
    throw new Error('pk wrong. it must 64 characters.')
  }

  const pkbin = Buffer.from(pk, 'hex')
  const rk = new RawKey(pkbin)
  const address = rk.accAddress

  return address
}

export async function setPrivateKeyToKeystore(
  setPw: (pw: string) => void,
  privateKey: string,
  pw: string
) {
  setPw(pw)
  let pk = privateKey
  if (pk.startsWith('0x')) {
    pk = pk.replace('0x', '')
  }

  if (pk.length != 64) {
    throw new Error('pk wrong. it must 64 characters.')
  }

  const pkbin = Buffer.from(pk, 'hex')
  const rk = new RawKey(pkbin)
  const address = rk.accAddress

  try {
    if (Platform.OS === 'ios') {
      preferences.setBool(PrefKeys.AppIsInititialized, true)
    }
    const encrypted = JSON.stringify(await encryptData(pw, pk))
    await keystore.write(KeychainKeys.Wallet, encrypted)
    await keystore.write(KeychainKeys.Address, address)
  } catch (e) {
    console.error(e)
  }
}

async function getPrivateKeyFromKeystore(pw: string): Promise<string> {
  try {
    const object = await keystore.read(KeychainKeys.Wallet)

    const cryptodata = JSON.parse(object)
    const decrypted = await decryptData(cryptodata.meta, pw, cryptodata.data)
    if (decrypted == null || decrypted == undefined) {
      return ''
    } else {
      return decrypted
    }
  } catch (error) {
    if (error instanceof InvalidKeyError) {
      throw error
    } else {
      throw error
    }
  }
}

export async function getDefaultPrivateKey(masterKey: string): Promise<string> {
  return await getPrivateKeyFromKeystore(masterKey)
}

export async function isHaveAddress(): Promise<boolean> {
  const address = await keystore.read(KeychainKeys.Address)

  return address == null || address == undefined || address == '' ? false : true
}

export async function getDefaultAddress(): Promise<string> {
  const address = await keystore.read(KeychainKeys.Address)

  if (address == null || address == undefined || address == '') {
    throw new Error('Wallet is not initialized!')
  }

  return address
}

export function setMainChartType(type: Api.ChartDataType) {
  preferences.setString(PrefKeys.MainChartType, type)
}

export async function getMainChartType() {
  const response = await preferences.getString(PrefKeys.MainChartType)

  if (response == null || response == undefined || response == '') {
    return Api.ChartDataType.month
  } else {
    return response
  }
}

export function setInvestDetailChartType(type: string) {
  preferences.setString(PrefKeys.InvestDetailChartType, type)
}

export async function getInvestDetailChartType() {
  const response = await preferences.getString(PrefKeys.InvestDetailChartType)

  if (response == null || response == undefined || response == '') {
    return Api.ChartDataType.month
  } else {
    return response
  }
}

export function setUserEmail(email: string) {
  keystore.write(KeychainKeys.Email, email)
}

export async function getUserEmail() {
  return keystore.read(KeychainKeys.Email)
}

export async function updatePassword(
  setPw: (pw: string) => void,
  oldpw: string,
  newpw: string
) {
  const pk = await getPrivateKeyFromKeystore(oldpw)
  setPrivateKeyToKeystore(setPw, pk, newpw)
}

export async function addUserAddress(address: string) {
  if (await isHaveUserAddress(address)) return

  let addressList = await preferences.getString(PrefKeys.loginAddress)
  if (addressList === undefined || addressList === null || addressList === '')
    addressList = [address]
  else {
    addressList = addressList.substring(0, addressList.length).split(',')
    addressList.push(address)
  }

  preferences.setString(PrefKeys.loginAddress, addressList.toString())
}

export async function isHaveUserAddress(address: string): Promise<boolean> {
  let addressList = await preferences.getString(PrefKeys.loginAddress)

  if (addressList.length === 0) return false

  addressList = addressList.substring(0, addressList.length).split(',')
  for (let i = 0; i < addressList.length; ++i) {
    if (addressList[i] === address) return true
  }
  return false
}

export async function isFirstRun(): Promise<boolean> {
  const address = await keystore.read(KeychainKeys.Address)
  return address == null || address == undefined || address == ''
}

export async function checkPassword(pw: string): Promise<boolean> {
  let flag = true
  try {
    await getPrivateKeyFromKeystore(pw)
  } catch (e) {
    if (e instanceof InvalidKeyError) {
      flag = false
    } else {
      throw e
    }
  }

  return flag
}

export async function isAppInitialized() {
  return await preferences.getBool(PrefKeys.AppIsInititialized)
}

export async function reset() {
  try {
    await preferences.setBool(PrefKeys.AppIsInititialized, false)

    await preferences.remove(PrefKeys.Locale)
    await preferences.remove(PrefKeys.UseBio)
    await preferences.remove(PrefKeys.favoriteList)
    await preferences.remove(PrefKeys.MainChartType)
    await preferences.remove(PrefKeys.InvestDetailChartType)
    await preferences.remove(PrefKeys.welcomePageShow)

    await preferences.remove(PrefKeys.PasswordLock)

    await preferences.remove(PrefKeys.switchainStatus)
    await clearMoonpayLastOpen()
    await clearMoonpayLastStatus()

    await keystore.remove(KeychainKeys.Address)
    await keystore.remove(KeychainKeys.Wallet)
    await keystore.remove(KeychainKeys.Email)
  } catch (e) {
    throw e
  }
}

async function deriveCryptoKey(meta: any, password: string): Promise<Buffer> {
  if (meta.kdf == null || meta.params == null) {
    throw new Error('Invalid metadata!')
  }

  if (meta.kdf == 'signal-argon2') {
    const salt = Buffer.from(meta.params.salt, 'base64')
    const result = await argon2(password, salt.toString('utf-8'))
    return Buffer.from(result.rawHash, 'hex')
  } else if (meta.kdf == 'scrypt') {
    const N = meta.params.kdf.N
    const r = meta.params.kdf.r
    const p = meta.params.kdf.p

    const data = await scrypt(
      Buffer.from(password),
      Buffer.from(meta.params.salt, 'base64'),
      N,
      r,
      p,
      32
    )
    return Buffer.from(data)
  } else {
    throw new InvalidAlgorithmError('Unsupported KDF algorithm')
  }
}

async function encryptData(password: string, data: string) {
  const salt = await generateSecureRandom(16)
  for (let i = 0; i < salt.length; i++) {
    salt[i] = salt[i] % 0x80

    if (salt[i] == 0x00) {
      salt[i] = 0x01
    }
  }

  const nonce = await generateSecureRandom(nacl.secretbox.nonceLength)

  const meta = {
    kdf: 'scrypt',
    crypto: 'tweetnacl-secretbox',
    params: {
      kdf: {
        N: 128,
        r: 8,
        p: 1,
      },
      salt: Buffer.from(salt).toString('base64'),
      nonce: Buffer.from(nonce).toString('base64'),
    },
  }

  const key = await deriveCryptoKey(meta, password)
  const encData = nacl.secretbox(
    Buffer.from(data, 'utf-8'),
    Buffer.from(nonce),
    key
  )
  return {
    meta: meta,
    data: Buffer.from(encData).toString('base64'),
  }
}

async function decryptData(
  meta: any,
  password: string,
  data: string
): Promise<string> {
  const key = await deriveCryptoKey(meta, password)

  if (meta.crypto == 'tweetnacl-secretbox') {
    const binData = Buffer.from(data, 'base64')
    const nonce = Buffer.from(meta.params.nonce, 'base64')
    const clearData = nacl.secretbox.open(binData, nonce, key)

    if (!clearData) {
      throw new InvalidKeyError('Failed to open nacl strongbox')
    }

    return Buffer.from(clearData).toString('utf-8')
  } else {
    throw new InvalidAlgorithmError('Unsupported crypto algorithm')
  }
}
