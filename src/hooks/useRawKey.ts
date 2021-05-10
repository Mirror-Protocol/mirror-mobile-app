import { Buffer } from 'buffer'
import URL from 'url'
import querystring from 'querystring'
import { RawKey } from '@terra-money/terra.js'
import { decrypt } from '../common/crypto'

type DecodePrivateKey = { name: string; address: string; encrypted_key: string }

export const parseImportKeyScheme = async (
  schemeBuffer: string
): Promise<string | undefined> => {
  try {
    const query = URL.parse(schemeBuffer).query
    if (query) {
      const payload = querystring.parse(query).payload as string
      return payload
    }
  } catch (e) {}
  // cannot find payload
}

export const parseImportKey = async (
  encodedBuffer: string
): Promise<DecodePrivateKey | undefined> => {
  try {
    const decodedBuffer = JSON.parse(
      Buffer.from(encodedBuffer.trim(), 'base64').toString()
    )

    return decodedBuffer
  } catch (e) {}
  // invalid buffer
}

export const decryptPrivateKey = async (
  encryptedPrivateKey: string,
  password: string
): Promise<string | undefined> => {
  try {
    return decrypt(encryptedPrivateKey, password)
  } catch (e) {}
  // incorrect password
}

export const recoverWalletFromPrivateKey = async (
  privateKey: string
): Promise<RawKey | undefined> => {
  try {
    return new RawKey(Buffer.from(privateKey, 'hex'))
  } catch (e) {}
}
