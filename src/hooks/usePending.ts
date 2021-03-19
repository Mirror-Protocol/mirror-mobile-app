import _ from 'lodash'
import { useEffect, useState } from 'react'
import useMoonpay from './useMoonpay'
import { SwitchainOfferPending, useSwitchainState } from './useSwitchain'
import * as Utils from '../common/Utils'

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
        const pending = {
          key: `${i.from}-${i.to}`,
          from: `${Utils.stringNumberWithComma(i.fromAmount)} ${i.from}`,
          to: `${Utils.stringNumberWithComma(i.toAmount)} ${i.to}`,
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
    updatePending()
    updateComplete()
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

  useEffect(() => {
    setPendingData([...switchainPendingData, ...moonpayPendingData])
  }, [switchainPendingData, moonpayPendingData])

  return {
    withdrawData,
    pendingData,
    completeData,
    moonpay,
    switchain,
    checkSwitchainComplete,
  }
}

export default usePending
