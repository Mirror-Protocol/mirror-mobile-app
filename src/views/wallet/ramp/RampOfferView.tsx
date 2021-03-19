import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import * as Keychain from '../../../common/Keychain'
import * as Resources from '../../../common/Resources'
import * as Utils from '../../../common/Utils'
import {
  requestCreateOrder,
  requestOrderStatus,
  SwitchainOrder,
} from '../../../common/Apis/Switchain'
import { getPairName } from '../../../hooks/useSwitchain'
import _ from 'lodash'
import { LoadingView } from '../../common/LoadingView'

const RampOfferView = (props: { navigation: any; route: any }) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>()
  const [sendAddress, setSendAddress] = useState<string>('')

  const isWithdraw = props.route.params.withdraw

  const refundAddress = props.route.params.refundAddress
  const memo = _.isEmpty(props.route.params.memo)
    ? undefined
    : props.route.params.memo
  const pair = props.route.params.pair
  const fromAmount = props.route.params.fromAmount
  const signature = props.route.params.signature
  const denom = props.route.params.denom

  const order = async () => {
    const terraAddress = await Keychain.getDefaultAddress()
    try {
      const switchainOrder: SwitchainOrder = {
        toAddress: isWithdraw ? refundAddress : terraAddress,
        refundAddress: isWithdraw ? terraAddress : refundAddress,
        toAddressTag: memo,
        refundAddressTag: memo,
        pair: pair,
        fromAmount: Utils.stringNumberWithoutComma(fromAmount),
        signature: signature,
      }
      const order = await requestCreateOrder(switchainOrder)
      if (order.error) {
        setError(order.reason)
      } else {
        setError('')
        setSendAddress(order.exchangeAddress)

        const orderStatus = await requestOrderStatus(order.orderId)
        await Keychain.addSwitchainOffer(
          getPairName(denom, isWithdraw),
          orderStatus
        )
      }
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    order()
  }, [])

  useEffect(() => {
    if (loading === false && error !== undefined) {
      if (error !== '') {
        props.navigation.push('RampErrorView', {
          message: error,
        })
      } else {
        isWithdraw
          ? props.navigation.push('WithdrawConfirmView', {
              address: sendAddress,
              amount: fromAmount.split(',').join(''),
              memo: memo,
              symbol: 'uusd',
              ramp: true,
              rampPair: pair,
            })
          : props.navigation.push('RampQrView', {
              address: sendAddress,
              denom,
            })
      }
    }
  }, [loading, error])

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: Resources.Colors.darkBackground,
          paddingHorizontal: 24,
        }}
      >
        <LoadingView />
      </View>
    </>
  )
}

export default RampOfferView
