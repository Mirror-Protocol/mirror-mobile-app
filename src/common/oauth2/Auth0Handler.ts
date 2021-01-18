import OAuthHandler from './OAuthHandler'
import deepmerge from 'deepmerge'
import * as Config from '../../common/Apis/Config'

export default class Auth0Handler extends OAuthHandler {
  private readonly SCOPE: string = 'openid profile email'
  private readonly RESPONSE_TYPE: string = 'token id_token'
  private readonly PROMPT: string = 'login'

  async getOAuthURL(): Promise<string> {
    const { domain } = this.jwtParams
    const finalUrl = new URL(domain)
    finalUrl.pathname = '/authorize'
    const clonedParams = JSON.parse(JSON.stringify(this.jwtParams))
    delete clonedParams.domain
    const connection = Config.torusConfig[this.typeOfLogin].jwtParams
    if (connection == null) {
      throw new Error('Invalid typeOfLogin value!')
    }
    const finalJwtParams: any = deepmerge(
      {
        state: await this.getState({ jwtParams: this.jwtParams }),
        response_type: this.RESPONSE_TYPE,
        client_id: this.clientId,
        prompt: this.PROMPT,
        redirect_uri: this.redirect_uri,
        scope: this.SCOPE,
        connection: 'apple',
        nonce: await this.createNonce(),
      },
      clonedParams
    )

    Object.keys(finalJwtParams).forEach((key) => {
      if (finalJwtParams[key])
        finalUrl.searchParams.append(key, finalJwtParams[key])
    })

    return finalUrl.href
  }
}
