import nacl from 'tweetnacl'
import { Buffer } from 'buffer'
import URL from 'url'

import { generateSecureRandom } from 'react-native-securerandom'

import { launchAuth } from '../common/InAppBrowserHelper'
import * as Config from '../common/Apis/Config'
import OAuthHandler from './oauth2/OAuthHandler'
import GoogleHandler from './oauth2/GoogleHandler'
import Auth0Handler from './oauth2/Auth0Handler'
import FacebookHandler from './oauth2/FacebookHandler'
import Axios from 'axios'

class HackedPRNG {
  isInitialized: boolean
  _offset: number
  _entropy: Uint8Array

  constructor() {
    this.isInitialized = false
    this._offset = 0
  }

  async init() {
    this.isInitialized = true
    this._entropy = await generateSecureRandom(4096)
  }

  getRandom(x, n) {
    if (!this.isInitialized) {
      throw new Error('HackedPRNG is not initialized!')
    }

    if (this._offset + n >= this._entropy.length) {
      throw new Error('Out of bound!')
    }

    for (let i = this._offset; i < this._offset + n; i++) {
      x[i - this._offset] = this._entropy[i]
    }
    this._offset += n
  }
}

export class TorusLoginError extends Error {
  public errorType: string
  public errorMsg: string
  constructor(errorType: string, errorMsg: string) {
    super(`${errorType}: ${errorMsg}`)
    this.errorType = errorType
    this.errorMsg = errorMsg
  }
}

async function initializeHackedRNG() {
  const hackedPRNG = new HackedPRNG()
  await hackedPRNG.init()
  nacl.setPRNG(hackedPRNG.getRandom.bind(hackedPRNG))
}

export async function getAuthUrl(authProvider: string): Promise<string> {
  await initializeHackedRNG()

  const kp = nacl.box.keyPair()
  const pubK = Buffer.from(kp.publicKey).toString('base64')

  const baseUrl = Config.loginPage
  const url = `${baseUrl}/?authUsing=${encodeURIComponent(
    authProvider
  )}&appAuth=true&pubK=${encodeURIComponent(pubK)}`

  return url
}

export async function getNaclKeyPair() {
  await initializeHackedRNG()
  const kp = nacl.box.keyPair()
  return kp
}

export function decrypt(authblob: any, privK: Uint8Array) {
  if (authblob) {
    const encdata = Buffer.from(authblob.data, 'base64')
    const nonce = Buffer.from(authblob.nonce, 'base64')
    const browserPubK = Buffer.from(authblob.pubK, 'base64')

    const msgbin = nacl.box.open(encdata, nonce, browserPubK, privK)

    const msg = JSON.parse(Buffer.from(msgbin).toString('utf-8'))
    const privKey: string = msg.privateKey

    let accessToken = msg.userInfo
      ? msg.userInfo.access_token
      : (null as string | null)
    if (accessToken == null) {
      accessToken = msg.userInfo
        ? msg.userInfo.accessToken
        : (null as string | null)
    }

    return {
      email: (msg.userInfo ? msg.userInfo.email : '') as string,
      verifier: (msg.userInfo ? msg.userInfo.verifier : 'unknown') as string,
      typeOfLogin: (msg.userInfo
        ? msg.userInfo.typeOfLogin
        : 'unknown') as string,
      accessToken: accessToken,
      privateKey: privKey,
    }
  }
}

async function handlePlatformQuirk(result: {
  typeOfLogin: string
  accessToken: string | null
}) {
  // Platform-specific quirks
  try {
    if (result?.typeOfLogin === 'facebook' && result?.accessToken != null) {
      await Axios.delete('https://graph.facebook.com/me/permissions', {
        headers: {
          Authorization: `Bearer ${result.accessToken}`,
        },
      })
    }
  } catch (e) {
    // For now, ignore error...
  }
}

let keyPair: nacl.BoxKeyPair
export async function initKey() {
  await initializeHackedRNG()
  const kp = nacl.box.keyPair()
  const pubK = Buffer.from(kp.publicKey).toString('base64')
  return { kp, pubK }
}

export async function doAuth(authProvider: string) {
  const { kp, pubK } = await initKey()
  keyPair = kp
  const url = await getOAuthURL(authProvider, pubK)
  const ret = await launchAuth(url)

  return await processAuth(ret)
}

export async function processAuth(ret: any) {
  if (ret === null || ret === undefined) {
    throw new TorusLoginError('InAppBrowserError', 'InappBrowser unavailable')
  }
  if (typeof ret === 'object' && 'type' in ret) {
    if (ret.type === 'success') {
      const authblob = URL.parse(ret.url, true).query

      if (authblob.error != null) {
        const errorType = authblob.error as string
        const errorMsg = authblob.msg as string

        throw new TorusLoginError(errorType, errorMsg)
      }
      const result = decrypt(authblob, keyPair.secretKey)
      await handlePlatformQuirk(result as any)
      return result
    }

    if (ret.type === 'cancel') {
      throw new TorusLoginError(
        'UserCancelationError',
        'User canceled auth req'
      )
    }
  }

  throw new TorusLoginError('UnknownError', JSON.stringify(ret))
}

export async function getOAuthURL(authProvider: string, pubK: string) {
  let Handler = OAuthHandler
  switch (authProvider) {
    case 'google':
      Handler = GoogleHandler
      break
    case 'apple':
      Handler = Auth0Handler
      break
    case 'facebook':
      Handler = FacebookHandler
      break
    default:
      throw new Error('Invalid authProvider')
  }

  const authCfg = Config.torusConfig[authProvider]
  const url = await (new (Handler as any)(
    pubK,
    authCfg.clientId,
    authCfg.verifier,
    Config.loginPage + '/loading',
    authProvider,
    authCfg.jwtParams
  ) as OAuthHandler).getOAuthURL()

  if (authProvider === 'apple') {
    return `${Config.loginPage}/auth0redirect?redirect=${encodeURIComponent(
      url
    )}`
  }

  return url
}
