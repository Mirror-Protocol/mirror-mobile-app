import { Buffer } from 'buffer'
import { generateSecureRandom } from 'react-native-securerandom'
import deepmerge from 'deepmerge'

export default abstract class OAuthHandler {
  constructor(
    readonly pubK: string,
    readonly clientId: string,
    readonly verifier: string,
    readonly redirect_uri: string,
    readonly typeOfLogin: string,
    readonly jwtParams?: any
  ) {}

  async getState(attachment?: any): Promise<string> {
    const state = {
      pubK: this.pubK,
      typeOfLogin: this.typeOfLogin,
      clientId: this.clientId,
      instanceId: await this.createNonce(),
      verifier: this.verifier,
      redirectToOpener: false,
    }

    let stateJson = JSON.stringify(state)
    if (attachment) {
      stateJson = JSON.stringify(deepmerge(state, attachment))
    }

    return encodeURIComponent(
      Buffer.from(stateJson, 'utf-8').toString('base64')
    )
  }

  protected async createNonce(): Promise<string> {
    // 256-bit of randomness
    const buf = Buffer.from(await generateSecureRandom(32))
    return buf.toString('base64')
  }

  abstract async getOAuthURL(): Promise<string>
}
