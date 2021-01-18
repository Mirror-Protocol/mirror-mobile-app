import OAuthHandler from './OAuthHandler'

export default class FacebookHandler extends OAuthHandler {
  private readonly RESPONSE_TYPE: string = 'token'
  private readonly SCOPE: string = 'public_profile email'

  async getOAuthURL(): Promise<string> {
    const finalUrl = new URL('https://www.facebook.com/v6.0/dialog/oauth')
    finalUrl.searchParams.append('response_type', this.RESPONSE_TYPE)
    finalUrl.searchParams.append('client_id', this.clientId)
    finalUrl.searchParams.append('state', await this.getState())
    finalUrl.searchParams.append('scope', this.SCOPE)
    finalUrl.searchParams.append('redirect_uri', this.redirect_uri)
    finalUrl.searchParams.append('auth_type', 'rerequest')
    return finalUrl.href
  }
}
