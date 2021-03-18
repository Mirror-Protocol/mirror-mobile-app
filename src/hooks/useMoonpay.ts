import { useEffect, useState } from 'react'
import * as Keychain from '../common/Keychain'
import * as Api from '../common/Apis/Api'
import * as gql from '../common/Apis/gql'
import { launchBrowser } from '../common/InAppBrowserHelper'
import { AppState, AppStateStatus } from 'react-native'
import _ from 'lodash'

export type MoonpayProps = {
  enableMoonpay: boolean | undefined
  showMoonpayDepositPopup: boolean
  moonpayStatus: 'completed' | 'failed'
  moonpayAmount: string
  moonpayQuoteAmount: string
  moonpayDeposit: () => void
  setShowMoonpayDepositPopup: (b: boolean) => void
}

const useMoonpay = () => {
  const [enableMoonpay, setEnableMoonpay] = useState<boolean | undefined>(
    undefined
  )
  const [showMoonpayDepositPopup, setShowMoonpayDepositPopup] = useState(false)
  const [moonpayStatus, setMoonpayStatus] = useState<'completed' | 'failed'>(
    'completed'
  )
  const [moonpayAmount, setMoonpayAmount] = useState('')
  const [moonpayQuoteAmount, setMoonpayQuoteAmount] = useState('')

  const getMoonpayStatus = async () => {
    const showPopup = (status: 'completed' | 'failed') => {
      setMoonpayStatus(status)
      setShowMoonpayDepositPopup(true)

      Keychain.clearMoonpayLastOpen()
      Keychain.clearMoonpayLastStatus()
    }

    const checkStatus = async (status: string) => {
      if (status === null || status === undefined) {
        setEnableMoonpay(true)
      } else if (status === 'failed' || status === 'completed') {
        setEnableMoonpay(true)

        const lastStatus = await Keychain.getMoonpayLastStatus()
        if (lastStatus !== '' && lastStatus !== status) {
          showPopup(status)
        }
      } else {
        setEnableMoonpay(false)
        Keychain.setMoonpayLastStatus(status)
      }
    }

    const checkCompleteDate = async (
      status: string,
      historyDateString: string
    ) => {
      const lastOpenTimestamp = await Keychain.getMoonpayLastOpen()
      if (lastOpenTimestamp === '') {
        return
      }
      if (status !== 'completed' && status !== 'failed') {
        return
      }

      const lastStatus = await Keychain.getMoonpayLastStatus()
      const historyDate = new Date(historyDateString).getTime()
      const lastOpenDate = parseInt(lastOpenTimestamp)
      if (historyDate > lastOpenDate && lastStatus === '') {
        showPopup(status)
      }
    }

    Api.getAddress().then((address) => {
      gql.getMoonpayHistory(address).then(async (data) => {
        // const status = 'pending' //data.moonpayHistory[0]?.status
        const status = data.moonpayHistory[0]?.status
        const amount = data.moonpayHistory[0]?.baseCurrencyAmount
        const quoteAmount = data.moonpayHistory[0]?.quoteCurrencyAmount

        await Keychain.setMoonpayLastHistory(
          JSON.stringify(data.moonpayHistory[0])
        )

        setMoonpayAmount(amount)
        setMoonpayQuoteAmount(quoteAmount)
        await checkCompleteDate(status, data.moonpayHistory[0]?.createdAt)
        await checkStatus(status)
      })
    })
  }

  const moonpayDeposit = _.debounce(() => {
    try {
      Api.getMoonpayUrl(null).then((url) => {
        launchBrowser(url).then(() => {
          getMoonpayStatus()
        })
        const openDate = new Date().getTime()
        Keychain.setMoonpayLastOpen(openDate.toString())
      })
    } catch {}
  }, 500)

  // const moonpayDeposit = () => {
  //   try {
  //     Api.getMoonpayUrl(null).then((url) => {
  //       launchBrowser(url).then(() => {
  //         getMoonpayStatus()
  //       })
  //       const openDate = new Date().getTime()
  //       Keychain.setMoonpayLastOpen(openDate.toString())
  //     })
  //   } catch {}
  // }

  useEffect(() => {
    getMoonpayStatus()

    const resumeAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        getMoonpayStatus()
      }
    }
    AppState.addEventListener('change', resumeAppState)

    return () => {
      AppState.removeEventListener('change', resumeAppState)
    }
  }, [])

  return {
    enableMoonpay,
    showMoonpayDepositPopup,
    moonpayStatus,
    moonpayAmount,
    moonpayQuoteAmount,
    moonpayDeposit,
    setShowMoonpayDepositPopup,
  }
}

export default useMoonpay
