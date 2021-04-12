import * as Config from '../Apis/Config'
import { encodeQueryData } from '../Utils'
import _ from 'lodash'

export type SwitchainMarketInfo = {
  pair: string
  quote: string
  minerFee: string
  signature: string
  maxLimit: string
  minLimit: string
  expiryTs: number
}

export type SwitchainOrder = {
  toAddress: string
  toAddressTag?: string
  refundAddress: string
  refundAddressTag?: string
  pair: string
  fromAmount: string
  toAmount?: string
  signature?: string
  slippage: string
}

export type SwitchainProgressStatus =
  | 'waiting'
  | 'received'
  | 'exchanging'
  | 'confirming'
export type SwitchainFinalStatus =
  | 'confirmed'
  | 'refunded'
  | 'failed'
  | 'expired'

const req = {
  marketInfo: {
    method: 'GET',
    url: '/marketinfo',
  },
  pairOffer: {
    method: 'GET',
    url: '/offer',
  },
  createOrder: {
    method: 'POST',
    url: '/order',
  },
  orderStatus: {
    method: 'GET',
    url: '/order',
  },
}

export const request = async (method: string, req: string, query?: string) => {
  const init = {
    method,
    body: method === 'POST' && query ? query : '',
    headers: {
      Authorization: `Bearer ${Config.getSwitchainApiKey()}`,
      'Content-Type': 'application/json',
    },
  }
  if (method === 'GET' && query) {
    return await fetch(Config.getSwitchainUrl() + req + '?' + query, init)
  } else {
    return await fetch(Config.getSwitchainUrl() + req, init)
  }
}

export const requestMarketInfo = async () => {
  return await (await request(req.marketInfo.method, req.marketInfo.url)).json()
}

export const requestPairOffer = async (query: {
  pair: string
  sendingAddress?: string
}) => {
  return await (
    await request(
      req.pairOffer.method,
      req.pairOffer.url,
      encodeQueryData(query)
    )
  ).json()
}

export const requestCreateOrder = async (order: SwitchainOrder) => {
  try {
    return await (
      await request(
        req.createOrder.method,
        req.createOrder.url,
        JSON.stringify(order)
      )
    ).json()
  } catch (e) {}
}

export const requestOrderStatus = async (orderId: string) => {
  try {
    const ret = await (
      await request(req.orderStatus.method, `${req.orderStatus.url}/${orderId}`)
    ).json()
    return ret
  } catch (e) {}
}

export const getMarketInfo = async (): Promise<SwitchainMarketInfo[]> => {
  try {
    const ret = await requestMarketInfo()
    return ret
  } catch (e) {}

  return []
}

export const getPairOffer = async (
  pair: string
): Promise<SwitchainMarketInfo | undefined> => {
  try {
    const ret = await requestPairOffer({ pair })
    return ret
  } catch (e) {}

  return undefined
}

export const findCryptoPair = (
  marketInfo: SwitchainMarketInfo[],
  denom: string,
  withdraw?: boolean
): SwitchainMarketInfo | undefined => {
  return _.find(marketInfo, (item) => item.pair === `${denom}-UST`)
}

export const getCryptoQuote = (
  marketInfo: SwitchainMarketInfo[],
  denom: string,
  withdraw?: boolean
): string => {
  const quote = findCryptoPair(marketInfo, denom, withdraw)?.quote
  return quote ? quote?.slice(0, quote?.indexOf('.') + 3) : '0.00'
}
