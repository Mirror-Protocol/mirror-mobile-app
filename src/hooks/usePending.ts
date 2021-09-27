import _ from 'lodash'
import { useContext, useEffect, useState } from 'react'
import useMoonpay from './useMoonpay'
import { SwitchainOfferPending, useSwitchainState } from './useSwitchain'
import * as Utils from '../common/Utils'
import * as Config from '../common/Apis/Config'
import BigNumber from 'bignumber.js'
import { TransakContext } from '../common/provider/TransakProvider'

export interface PendingData {
  key: string
  title?: string
  from: string
  to: string
}

export interface CompleteData {
  key: string
  from: string
  to: string
  fromAmount: string
  toAmount: string
  state: string
}

const usePending = () => {
  const [pendingData, setPendingData] = useState<PendingData[]>([])
  const [withdrawData, setWithdrawData] = useState<PendingData[]>([])

  const [switchainPendingData, setSwitchainPendingData] = useState<
    PendingData[]
  >([])
  const [moonpayPendingData, setMoonpayPendingData] = useState<PendingData[]>(
    []
  )
  const [transakPendingData, setTransakPendingData] = useState<PendingData[]>(
    []
  )

  const [completeData, setCompleteData] = useState<CompleteData[]>([])

  const moonpay = useMoonpay()
  const switchain = useSwitchainState()

  const makeComplete = (i: SwitchainOfferPending) => {
    const complete = {
      key: i.key,
      from: i.from,
      to: i.to,
      fromAmount: i.fromAmount,
      toAmount: i.toAmount,
      state: i.state!,
    }
    return complete
  }

  const checkSwitchainComplete = async (key: string) => {
    const completeData: CompleteData[] = []
    _.forEach(switchain.completeOffers, (i: SwitchainOfferPending) => {
      if (key !== i.key) {
        completeData.push(makeComplete(i))
      }
      setCompleteData([...completeData])
    })
    await switchain.checkCompleteOffer(key)
  }

  useEffect(() => {
    const updatePending = async () => {
      const pendingData: PendingData[] = []
      const withdrawData: PendingData[] = []
      _.forEach(switchain.pendingOffers, (i: SwitchainOfferPending) => {
        const from = new BigNumber(i.fromAmount).toString()
        const to = new BigNumber(i.toAmount)
          .times(Config.slippageMinus)
          .toString()
        const pending = {
          key: `${i.from}-${i.to}`,
          from: `${Utils.stringNumberWithComma(from)} ${i.from}`,
          to: `${Utils.stringNumberWithComma(to)} ${i.to}`,
        }
        i.from === 'UST'
          ? withdrawData.push(pending)
          : pendingData.push(pending)
      })

      setWithdrawData([...withdrawData])
      setSwitchainPendingData([...pendingData])
    }
    const updateComplete = async () => {
      const completeData: CompleteData[] = []
      _.forEach(switchain.completeOffers, (i: SwitchainOfferPending) => {
        completeData.push(makeComplete(i))
      })
      setCompleteData([...completeData])
    }
    // updatePending()
    // updateComplete()
  }, [switchain.pendingOffers, switchain.completeOffers])

  useEffect(() => {
    if (moonpay.enableMoonpay !== undefined && !moonpay.enableMoonpay) {
      const already = moonpayPendingData.find((p) => p.key === 'moonpay')
      !already &&
        setMoonpayPendingData([
          {
            key: 'moonpay',
            title: 'Moonpay',
            from: `${moonpay.moonpayAmount} USD`,
            to: `${moonpay.moonpayQuoteAmount} UST`,
          },
        ])
    } else {
      setMoonpayPendingData(
        moonpayPendingData.filter((p) => p.key !== 'moonpay')
      )
    }
  }, [moonpay.enableMoonpay])

  const transak = useContext(TransakContext)

  useEffect(() => {
    if (transak.enableTransak !== undefined && !transak.enableTransak) {
      const already = transakPendingData.find((p) => p.key === 'transak')
      !already &&
        transak.getOrder().then((order) => {
          order &&
            setTransakPendingData([
              {
                key: 'transak',
                title: 'transak',
                from: `${order.from} ${order.fromCurrency}`,
                to: `${order.to} ${order.toCurrency}`,
              },
            ])
        })
    } else {
      setTransakPendingData(
        transakPendingData.filter((p) => p.key !== 'transak')
      )
    }
  }, [transak.enableTransak])

  useEffect(() => {
    setPendingData([
      ...switchainPendingData,
      ...moonpayPendingData,
      ...transakPendingData,
    ])
  }, [switchainPendingData, moonpayPendingData, transakPendingData])

  return {
    withdrawData,
    pendingData,
    completeData,
    moonpay,
    transak,
    switchain,
    checkSwitchainComplete,
  }
}

export default usePending
