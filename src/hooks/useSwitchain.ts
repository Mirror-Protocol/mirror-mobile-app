import { useCallback, useEffect, useState } from 'react'
import {
  getMarketInfo,
  getPairOffer,
  requestOrderStatus,
  SwitchainMarketInfo,
} from '../common/Apis/Switchain'
import _ from 'lodash'
import { getSwitchainOffer, modifySwitchainOffer } from '../common/Keychain'
import { useFocusEffect } from '@react-navigation/native'

export type SwitchainOrderResponse = {
  pair: string
  orderId: string
  status: string
  fromAmount: string
  exchangeAddress: string
  exchangeAddressTag?: string
  toAddress: string
  toAddressTag?: string
  refundAddress: string
  refundAddressTag?: string
  createdAt: string
  rate: string
}

export type SwitchainOrderState = {
  [key: string]: {
    order: SwitchainOrderResponse
    progress: string
  }
}

export type SwitchainOfferPending = {
  key: string
  from: string
  to: string
  fromAmount: string
  toAmount: string
  state?: 'completed' | 'failed'
}

export const getPairName = (denom: string, withdraw?: boolean) => {
  return withdraw ? `UST-${denom}` : `${denom}-UST`
}

export const useSwitchainMarketInfo = (withdraw?: boolean, denom?: string) => {
  const [marketInfo, setMarketInfo] = useState<SwitchainMarketInfo[]>([])
  const [pairOffer, setPairOffer] = useState<SwitchainMarketInfo | undefined>()

  const updateMarketInfo = async () => {
    setMarketInfo(await getMarketInfo())
  }

  const updatePairOffer = _.debounce((denom: string) => {
    const _updatePairOffer = async (denom: string) => {
      setPairOffer(await getPairOffer(getPairName(denom, withdraw)))
    }
    _updatePairOffer(denom)
  }, 500)

  useEffect(() => {
    updateMarketInfo()
    denom && updatePairOffer(getPairName(denom, withdraw))
  }, [])

  return { marketInfo, updateMarketInfo, pairOffer, updatePairOffer }
}

export const useSwitchainState = () => {
  const [pendingOffers, setPendingOffers] = useState<SwitchainOfferPending[]>(
    []
  )
  const [completeOffers, setCompleteOffers] = useState<SwitchainOfferPending[]>(
    []
  )

  const init = async () => {
    const offer = await getSwitchainOffer()
    return offer
  }

  const get = async () => {
    const offers = await init()

    const completes: SwitchainOfferPending[] = []
    const pendings: SwitchainOfferPending[] = []
    _.forEach(offers, (i: SwitchainOrderState) => {
      const keys = Object.keys(i)
      if (keys.length > 0) {
        const offer: SwitchainOfferPending = {
          key: keys[0],
          from: keys[0].split('-')[0],
          to: keys[0].split('-')[1],
          fromAmount: i[keys[0]].order.fromAmount,
          toAmount: i[keys[0]].order.rate,
        }

        if (
          i[keys[0]].progress === 'completed' ||
          i[keys[0]].progress === 'failed'
        ) {
          offer.state =
            i[keys[0]].progress === 'completed' ? 'completed' : 'failed'
          completes.push(offer)
        } else if (i[keys[0]].progress === 'progress') {
          pendings.push(offer)
        }
      }
    })

    setCompleteOffers(completes)
    setPendingOffers(pendings)
  }

  const update = async () => {
    const offer = await getSwitchainOffer()
    await Promise.all(
      _.map(offer, async (i: SwitchainOrderState) => {
        const keys = Object.keys(i)
        if (keys.length > 0 && i[keys[0]].progress === 'progress') {
          const currentStatus: SwitchainOrderResponse = await requestOrderStatus(
            i[keys[0]].order.orderId
          )

          if (
            currentStatus.status === 'confirmed' ||
            currentStatus.status === 'refunded' ||
            currentStatus.status === 'failed' ||
            currentStatus.status === 'expired'
          ) {
            currentStatus.status === 'confirmed'
              ? (i[keys[0]].progress = 'completed')
              : (i[keys[0]].progress = 'failed')

            i[keys[0]].order = currentStatus

            await modifySwitchainOffer(
              keys[0],
              i[keys[0]].order,
              i[keys[0]].progress
            )
          }
        }
      })
    )
  }

  const checkCompleteOffer = async (key: string) => {
    await modifySwitchainOffer(key, undefined, 'done')
    await get()
  }

  useFocusEffect(
    useCallback(() => {
      get().then(() => update().then(() => get()))
    }, [])
  )

  return { pendingOffers, completeOffers, checkCompleteOffer }
}
