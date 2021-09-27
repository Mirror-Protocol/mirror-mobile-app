import React, { createContext, useEffect, useState } from 'react'

import * as Config from '../Apis/Config'
import * as Keychain from '../Keychain'
import Pusher from 'pusher-js/react-native'
import { TransakOrder } from '../Keychain'
import { AppState, AppStateStatus } from 'react-native'

let pusher: Pusher | undefined = undefined

interface Props {
  children: JSX.Element | Array<JSX.Element>
}

interface ITransakContext {
  enableTransak?: boolean
  partnerOrderId?: string
  onEvent: (eventId: any, orderData: any) => void
  showTransakDepositPopup?: boolean
  setShowTransakDepositPopup: (v: boolean) => void
  transakAmount?: string
  transakStatus?: 'completed' | 'failed'
  getOrder: () => Promise<TransakOrder | undefined>
}

export const TransakContext = createContext<ITransakContext>({
  enableTransak: undefined,
  partnerOrderId: undefined,
  onEvent: (eventId: any, orderData: any) => {},
  showTransakDepositPopup: undefined,
  setShowTransakDepositPopup: (v: boolean) => {},
  transakAmount: undefined,
  transakStatus: 'completed',
  getOrder: async (): Promise<TransakOrder | undefined> => {
    return undefined
  },
})

export const TransakProvider = ({ children }: Props) => {
  const config = Config.isDev
    ? Config.transakConfig.testnet
    : Config.transakConfig.mainnet

  const [enableTransak, setEnableTransak] = useState<boolean>()
  const [showTransakDepositPopup, setShowTransakDepositPopup] =
    useState<boolean>()

  const [transakStatus, setTransakStatus] = useState<'completed' | 'failed'>(
    'completed'
  )
  const [transakAmount, setTransakAmount] = useState<string>('')
  const [partnerOrderId, setPartnerOrderId] = useState<string>()

  const setOrder = (order: TransakOrder) => {
    Keychain.setTransakOrder(order)
  }
  const getOrder = async (): Promise<TransakOrder | undefined> => {
    return await Keychain.getTransakOrder()
  }

  const getOrderStatus = async () => {
    const order = await getOrder()
    const orderId = order?.id
    if (orderId === undefined) return undefined

    const partnerAPISecret = config.apiSecret

    const url = `${config.apiUrl}/partners/order/${orderId}?partnerAPISecret=${partnerAPISecret}`
    const ret = (await fetch(url)).json()
    return ret
  }

  const initTransak = async (): Promise<void> => {
    if (pusher === undefined) {
      pusher = new Pusher(config.pusherAppKey, {
        cluster: 'ap2',
      })
      let apiKey = config.apiKey
      let partnerOrderId = await Keychain.getDefaultAddress()
      let channelName = `${apiKey}_${partnerOrderId}`

      pusher.subscribe(channelName)
      pusher.bind_global((eventId: any, orderData: any) => {
        if (eventId === 'pusher:pong') {
          return
        }
        onEvent(eventId, orderData)
      })
    }
  }

  const onEvent = (eventId: any, orderData: any) => {
    try {
      const id = orderData.id
      const status = orderData.status
      const from = orderData.fiatAmount
      const fromCurrency = orderData.fiatCurrency
      const to = orderData.cryptoAmount
      const toCurrency = orderData.cryptoCurrency

      switch (eventId) {
        case 'ORDER_CREATED':
          Keychain.setTransakLastOrderId(id)
          setOrder({ id, status, from, fromCurrency, to, toCurrency })
          setEnableTransak(true)
          Keychain.setTransakLastStatus(status)
          break
        case 'ORDER_COMPLETED':
          Keychain.setTransakLastOrderId(id)
          setOrder({ id, status, from, fromCurrency, to, toCurrency })
          setEnableTransak(true)
          setShowTransakDepositPopup(true)
          setTransakStatus('completed')
          setTransakAmount(to)
          Keychain.setTransakLastStatus(status)
          break
        case 'ORDER_FAILED':
          Keychain.setTransakLastOrderId(id)
          setOrder({ id, status, from, fromCurrency, to, toCurrency })
          setEnableTransak(true)
          setShowTransakDepositPopup(true)
          setTransakStatus('failed')
          setTransakAmount(to)
          Keychain.setTransakLastStatus(status)
          break
        case 'ORDER_PAYMENT_VERIFYING':
        case 'ORDER_PROCESSING':
          setEnableTransak(false)
          Keychain.setTransakLastStatus(status)
          break
      }
    } catch (e) {}
  }

  useEffect(() => {
    Keychain.getDefaultAddress().then((address) => {
      setPartnerOrderId(address)
    })
    initTransak()
  }, [])

  useEffect(() => {
    const checkStatus = async () => {
      const orderStatus = await getOrderStatus()
      if (orderStatus === undefined) return

      try {
        const historyLength = orderStatus.response.statusHistories.length
        const lastHistory =
          orderStatus.response.statusHistories[historyLength - 1]

        const lastStatus = await Keychain.getTransakLastStatus()
        if (lastStatus !== lastHistory.partnerEventId) {
          const lastOrderId = Keychain.getTransakLastOrderId()

          switch (lastHistory.partnerEventId) {
            case 'ORDER_CREATED':
              Keychain.setTransakLastOrderId(orderStatus.response.id)
              break
            case 'ORDER_COMPLETED':
              if (lastOrderId !== orderStatus.response.id) {
                Keychain.setTransakLastOrderId(orderStatus.response.id)

                setTransakAmount(orderStatus.response.cryptoAmount)
                setTransakStatus('completed')
                setEnableTransak(true)
                setShowTransakDepositPopup(true)
                Keychain.setTransakLastStatus(lastHistory.partnerEventId)
              }
              break
            case 'ORDER_FAILED':
              if (lastOrderId !== orderStatus.response.id) {
                Keychain.setTransakLastOrderId(orderStatus.response.id)

                setTransakAmount(orderStatus.response.cryptoAmount)
                setTransakStatus('failed')
                setEnableTransak(true)
                setShowTransakDepositPopup(true)
                Keychain.setTransakLastStatus(lastHistory.partnerEventId)
              }
              break
            case 'ORDER_PAYMENT_VERIFYING':
            case 'ORDER_PROCESSING':
              setEnableTransak(false)
              Keychain.setTransakLastStatus(lastHistory.partnerEventId)
              break
          }
        } else {
          switch (lastHistory.partnerEventId) {
            case 'ORDER_PAYMENT_VERIFYING':
            case 'ORDER_PROCESSING':
              setEnableTransak(false)
              break
          }
        }
      } catch (e) {}
    }
    checkStatus()

    const resumeAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        checkStatus()
      }
    }
    AppState.addEventListener('change', resumeAppState)

    return () => {
      AppState.removeEventListener('change', resumeAppState)
    }
  }, [])

  return (
    <TransakContext.Provider
      value={{
        enableTransak,
        partnerOrderId,
        onEvent,
        showTransakDepositPopup,
        setShowTransakDepositPopup,
        transakAmount,
        transakStatus,
        getOrder,
      }}
    >
      {children}
    </TransakContext.Provider>
  )
}
