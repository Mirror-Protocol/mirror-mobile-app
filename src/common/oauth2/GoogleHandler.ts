import OAuthHandler from './OAuthHandler'

export default class GoogleHandler extends OAuthHandler {
  private readonly RESPONSE_TYPE: string = 'token id_token'
  private readonly SCOPE: string = 'profile email openid'
  private readonly PROMPT: string = 'consent select_account'

  async getOAuthURL(): Promise<string> {
    const finalUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    finalUrl.searchParams.append('response_type', this.RESPONSE_TYPE)
    finalUrl.searchParams.append('client_id', this.clientId)
    finalUrl.searchParams.append('state', await this.getState())
    finalUrl.searchParams.append('scope', this.SCOPE)
    finalUrl.searchParams.append('redirect_uri', this.redirect_uri)
    finalUrl.searchParams.append('nonce', await this.createNonce())
    finalUrl.searchParams.append('prompt', this.PROMPT)
    return finalUrl.href
  }
}
