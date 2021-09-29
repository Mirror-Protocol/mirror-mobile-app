import BigNumber from 'bignumber.js'
import { get } from '../request'

export const isDev = false
export const logEnabled = true
export const reviewApp = false

export const hideOnboarding = reviewApp
export const hideBuysellButton = reviewApp
export const hideMoonpay = reviewApp
export const useOtherAgreement = reviewApp
export const hideMassetDetail = reviewApp
export const hideAppleAsset = reviewApp
export const changeBuyingPowerToBalance = reviewApp
export const changeInvestWithMirrorToDepositToMirror = reviewApp
export const changeInvestToMarket = reviewApp
export const hideWalletCategory = reviewApp
export const changeLoginButton = reviewApp

export type Chain = 'mainnet' | 'testnet' | 'moonshine' | 'bombay' | 'tequila'
export let currentChain: Chain | undefined = undefined
export async function setCurrentChain(chain: Chain): Promise<void> {
  currentChain = isDev ? chain : 'mainnet'
  await setChains()
  setDomain()
}

export const APPSTORE_URL = 'https://apps.apple.com/app/id1540542362'
export const PLAYSTORE_URL =
  'https://play.google.com/store/apps/details?id=io.kysenpool.mirror.android'

export const version = isDev
  ? 'https://mirror.finance/assets/json/version_staging_v2.json'
  : 'https://mirror.finance/assets/json/version_v2.json'
export const agreement = useOtherAgreement
  ? 'https://mirror.finance/assets/json/agreement_other.json'
  : 'https://mirror.finance/assets/json/agreement_v1.json'
export const maintenance = 'https://mirror.finance/assets/json/maintenance.json'
export const assetIconAddress = 'https://mirror.finance/assets/icon/$1@3x.png'
export const spreadPage = 'https://docs.mirror.finance/protocol/terraswap'
export const protocolDocumentation = 'https://help.mirrorwallet.com/'
const chains = 'https://assets.terra.money/chains.json'

let domain = {
  moonshine: {
    chainDomain: 'https://moonshine-lcd.terra.dev',
    chainId: 'moonshine',

    gqlMantleClientDomain: 'https://moonshine-mantle.terra.dev/',
    gqlPriceClientDomain: 'https://moonshine-graph.mirror.finance/graphql',

    assetsAddress: 'https://whitelist.mirror.finance/moonshine.json',

    gasPrices: 'https://moonshine-fcd.terra.dev/v1/txs/gas_prices',
  },
  tequila: {
    chainDomain: 'https://tequila-lcd.terra.dev',
    chainId: 'tequila-0004',

    gqlMantleClientDomain: 'https://tequila-mantle.terra.dev',
    gqlPriceClientDomain: 'https://tequila-graph.mirror.finance/graphql',

    assetsAddress: 'https://whitelist.mirror.finance/tequila.json',

    gasPrices: 'https://tequila-fcd.terra.dev/v1/txs/gas_prices',
  },
  bombay: {
    chainDomain: 'https://bombay-lcd.terra.dev',
    chainId: 'bombay-12',

    gqlMantleClientDomain: 'https://bombay-mantle.terra.dev',
    gqlPriceClientDomain: 'https://bombay-mirror-graph.terra.dev/graphql', // temporary

    assetsAddress: 'https://whitelist.mirror.finance/tequila.json', // same as tequila

    gasPrices: 'https://bombay-fcd.terra.dev/v1/txs/gas_prices',
  },
  testnet: {
    chainDomain: 'https://tequila-lcd.terra.dev',
    chainId: 'tequila-0004',

    gqlMantleClientDomain: 'https://tequila-mantle.terra.dev',
    gqlPriceClientDomain: 'https://tequila-graph.mirror.finance/graphql',

    assetsAddress: 'https://whitelist.mirror.finance/tequila.json',

    gasPrices: 'https://tequila-fcd.terra.dev/v1/txs/gas_prices',
  },
  mainnet: {
    chainDomain: 'https://lcd.terra.dev',
    chainId: 'columbus-4',

    gqlMantleClientDomain: 'https://mantle.terra.dev/',
    gqlPriceClientDomain: 'https://graph.mirror.finance/graphql',

    assetsAddress: 'https://whitelist.mirror.finance/columbus.json',

    gasPrices: 'https://fcd.terra.dev/v1/txs/gas_prices',
  },
}

async function setChains(): Promise<void> {
  try {
    const response = await get(chains)
    if (response.status === 200) {
      const responseToJson = await response.json()
      domain.mainnet.chainId = responseToJson.mainnet.chainID
      domain.mainnet.chainDomain = responseToJson.mainnet.lcd

      domain.testnet.chainId = responseToJson.testnet.chainID
      domain.testnet.chainDomain = responseToJson.testnet.lcd
    }
  } catch (e) {
    console.error(e)
  }
}

export let currentDomain: any = undefined
export let assetsAddress: any = undefined
function setDomain() {
  switch (currentChain as string) {
    case 'testnet':
      currentDomain = domain.testnet
      break
    case 'moonshine':
      currentDomain = domain.moonshine
      break
    case 'tequila':
      currentDomain = domain.tequila
      break
    case 'bombay':
      currentDomain = domain.bombay
      break
    case 'columbus':
    default:
      currentDomain = domain.mainnet
      break
  }

  assetsAddress = currentDomain.assetsAddress
}

const moonpayConfig = {
  main: {
    pk: '',
    url: '',
    urlsigner: '',
    currency: 'UST',
  },
  test: {
    pk: '',
    url: '',
    urlsigner: '',
    currency: 'UST',
  },
}
export const moonpay = moonpayConfig.main

export let loginPage: any = undefined
export let torusConfig: any = undefined

const auth0JwtParams = {
  testnet: {
    domain: '',
  },
  mainnet: {
    domain: '',
  },
}

export const _loginPage = {
  testnet: '',
  mainnet: '',
}

export const _torusConfig = {
  testnet: {
    google: {
      name: 'Google',
      typeOfLogin: '',
      clientId: '',
      verifier: '',
      jwtParams: null,
    },
    facebook: {
      name: 'Facebook',
      typeOfLogin: '',
      clientId: '',
      verifier: '',
      jwtParams: null,
    },
    apple: {
      name: 'Apple',
      typeOfLogin: '',
      clientId: '',
      verifier: '',
      jwtParams: null,
    },
  },
  mainnet: {
    google: {
      name: 'Google',
      typeOfLogin: '',
      clientId: '',
      verifier: '',
      jwtParams: null,
    },
    facebook: {
      name: 'Facebook',
      typeOfLogin: '',
      clientId: '',
      verifier: '',
      jwtParams: null,
    },
    apple: {
      name: 'Apple',
      typeOfLogin: 'apple',
      clientId: '',
      verifier: '',
      jwtParams: null,
    },
  },
}

export function setTorusNetwork(net: string) {
  let torusNetwork
  if (net === undefined || net === '')
    torusNetwork = isDev ? 'testnet' : 'mainnet'
  else torusNetwork = isDev ? net : 'mainnet'

  loginPage =
    torusNetwork === 'testnet' ? _loginPage.testnet : _loginPage.mainnet
  torusConfig =
    torusNetwork === 'testnet' ? _torusConfig.testnet : _torusConfig.mainnet
}

export const switchainConfig = {
  mainnet: {
    url: 'https://api.switchain.com/rest/v1',
    apiKey: '',
    slippage: new BigNumber(2.5),
  },
  testnet: {
    url: 'https://api-testnet.switchain.com/rest/v1',
    apiKey: '',
    slippage: new BigNumber(2.5),
  },
}

export const transakConfig = {
  mainnet: {
    url: 'https://global.transak.com',
    apiUrl: 'https://api.transak.com/api/v2',
    apiKey: '',
    apiSecret: '',
    environment: 'PRODUCTION',
    pusherAppKey: '',
  },
  testnet: {
    url: 'https://staging-global.transak.com',
    apiUrl: 'https://staging-api.transak.com/api/v2',
    apiKey: '',
    apiSecret: '',
    environment: 'STAGING',
    pusherAppKey: '',
  },
}

// export const rampNetworkConfig = {
//   mainnet: {
//     api: 'https://api.ramp.network/api',
//     url: 'https://buy.ramp.network',
//     hostApiKey: '',
//   },
//   testnet: {
//     api: 'https://api-instant-staging.supozu.com/api',
//     url: 'https://ri-widget-staging.firebaseapp.com/',
//     hostApiKey: '',
//   },
// }

export const getSwitchainUrl = (): string => {
  return currentChain === 'mainnet'
    ? switchainConfig.mainnet.url
    : switchainConfig.testnet.url
}
export const getSwitchainApiKey = (): string => {
  return currentChain === 'mainnet'
    ? switchainConfig.mainnet.apiKey
    : switchainConfig.testnet.apiKey
}

export const getSwitchainSlippage = (): BigNumber => {
  return currentChain === 'mainnet'
    ? switchainConfig.mainnet.slippage
    : switchainConfig.testnet.slippage
}

export const slippageMinus = new BigNumber(1).minus(
  getSwitchainSlippage().div(100)
)
export const slippagePlus = new BigNumber(1).plus(
  getSwitchainSlippage().div(100)
)
