import BigNumber from 'bignumber.js'
import React, {
  useEffect,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react'
import { Text, View, BackHandler, Image } from 'react-native'
import { RectButton } from 'react-native-gesture-handler'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { useFocusEffect } from '@react-navigation/native'
import { AnimatedTextView } from './AnimatedTextView'
import { QueueContext } from '../../common/provider/QueueProvider'

export enum ProcessingType {
  Buy = 0,
  Sell = 1,
  Withdraw = 2,
  Swap = 3,
  Burn = 4,
}

export function ProcessingView(props: { route: any; navigation: any }) {
  const { translations, pw, setPw } = useContext(ConfigContext)
  const queue = useContext(QueueContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const type = props.route.params.type
  const amount = new BigNumber(props.route.params.amount)
  const symbol = props.route.params.symbol
  const displayAmount = new BigNumber(props.route.params.displayAmount)
  const displaySymbol = props.route.params.displaySymbol
  const burnPositions = props.route.params.positions

  const rampPair = props.route.params.rampPair

  const [subMessage, setSubMessage] = useState('')
  const [subMessageColor, setSubMessageColor] = useState('transparent')
  const [confirmEnable, setConfirmEnable] = useState(0)

  const pollingTimer = useRef<number>()
  const pollingHash = (txhash: string, type: ProcessingType) => {
    if (queue.hash !== txhash) {
      queue.setHash(txhash)

      Keychain.setTxQueueData(
        JSON.stringify({
          type,
          amount: amount.toString(),
          symbol,
          displayAmount: displayAmount.toString(),
          displaySymbol,
          burnPositions,
          rampPair,
          txhash,
        })
      )
    }

    pollingTimer.current = setTimeout(() => {
      Api.getTxInfo(txhash)
        .then((txinfo) => {
          if (txinfo === undefined) {
            pollingHash(txhash, type)
          } else {
            success()
          }
        })
        .catch((error) => {
          fail(error)
        })
    }, 1400)
  }

  useEffect(() => {
    return () => {
      pollingTimer.current && clearTimeout(pollingTimer.current)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      const callback = () => {
        return true
      }
      BackHandler.addEventListener('hardwareBackPress', callback)
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', callback)
      }
    }, [])
  )

  useEffect(() => {
    setSubMessageColor(
      type === ProcessingType.Sell
        ? Resources.Colors.brightTeal
        : Resources.Colors.black
    )
    setSubMessage(`This transaction is in process`)

    if (type == ProcessingType.Buy) {
      const price = new BigNumber(props.route.params.price)
      const fee = new BigNumber(props.route.params.fee)
      const tax = new BigNumber(props.route.params.tax)
      Api.buy(pw, price, symbol, amount, fee, tax)
        .then((result) => {
          pollingHash(result.txhash, type)
        })
        .catch((error) => {
          fail(error)
        })
    } else if (type == ProcessingType.Sell) {
      const price = new BigNumber(props.route.params.price)
      const fee = new BigNumber(props.route.params.fee)

      Api.sell(pw, price, symbol, amount, fee)
        .then((result) => {
          pollingHash(result.txhash, type)
        })
        .catch((error) => {
          fail(error)
        })
    } else if (type == ProcessingType.Withdraw) {
      const address = props.route.params.address
      const fee = new BigNumber(props.route.params.fee)
      const feeDenom = props.route.params.feeDenom
      const tax = new BigNumber(props.route.params.tax)
      const memo = props.route.params.memo
      Api.transfer(
        pw,
        address,
        Utils.getCutNumber(amount, 0),
        symbol,
        fee,
        feeDenom,
        tax,
        memo
      )
        .then((result) => {
          pollingHash(result.txhash, type)
        })
        .catch((error) => {
          fail(error)
        })
    } else if (type == ProcessingType.Swap) {
      Api.swap(pw, symbol, amount)
        .then((result) => {
          pollingHash(result.txhash, type)
        })
        .catch((error) => {
          fail(error)
        })
    } else if (type === ProcessingType.Burn) {
      const fee = new BigNumber(props.route.params.fee)
      Api.burn(pw, burnPositions, symbol, fee)
        .then((result) => {
          pollingHash(result.txhash, type)
        })
        .catch((error) => {
          fail(error)
        })
    }
  }, [])

  function success() {
    setConfirmEnable(1)
    setSubMessageColor(
      type === ProcessingType.Sell
        ? Resources.Colors.brightTeal
        : Resources.Colors.black
    )
    if (type == ProcessingType.Buy) {
      setSubMessage(translations.processingView.buySuccess)
    } else if (type === ProcessingType.Sell) {
      setSubMessage(translations.processingView.sellSuccess)
    } else if (type === ProcessingType.Withdraw) {
      setSubMessage(translations.processingView.withdrawSuccess)
    } else if (type === ProcessingType.Swap) {
      setSubMessage(translations.processingView.swapSuccess)
    } else if (type === ProcessingType.Burn) {
      setSubMessage(translations.processingView.burnSuccess)
    }
  }

  function fail(error: any) {
    setSubMessageColor(Resources.Colors.brightPink)
    setSubMessage(error.toString())
    setConfirmEnable(2)

    if (rampPair) {
      Keychain.removeSwitchainOffer(rampPair)
    }
  }

  function confirmPressed() {
    queue.setShowTxQueued(false)

    navigateView()
  }

  function navigateView() {
    if (type == ProcessingType.Buy) {
      props.navigation.navigate('InvestedDetail')
    } else if (type == ProcessingType.Sell) {
      props.navigation.navigate('InvestedDetail')
    } else if (type == ProcessingType.Withdraw) {
      if ((symbol as string).startsWith('m')) {
        props.navigation.navigate('WalletDetailView')
      } else {
        props.navigation.navigate('WalletSummary')
      }
    } else if (type == ProcessingType.Swap) {
      props.navigation.navigate('WalletSummary')
    } else if (type === ProcessingType.Burn) {
      props.navigation.navigate('Main')
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          type === ProcessingType.Sell
            ? Resources.Colors.darkGreyFour
            : Resources.Colors.brightTeal,
        paddingTop: safeInsetTop,
      }}
    >
      <View
        style={{
          marginBottom: Resources.windowSize().height * 0.14,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            marginLeft: 24,
            marginRight: 24,
            marginBottom: 16,
            justifyContent: 'center',
          }}
        >
          <AnimatedTextView
            type={type}
            complete={confirmEnable !== 0}
            amount={
              type === ProcessingType.Buy || type === ProcessingType.Withdraw
                ? Utils.getFormatted(displayAmount, 6, true)
                : Utils.getFormatted(displayAmount, 2, true)
            }
            symbol={Utils.getDenom(displaySymbol)}
          />
        </View>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            letterSpacing: -0.3,
            lineHeight: 21,
            marginLeft: 24,
            marginRight: 24,
            color: subMessageColor,
            textAlign: 'center',
          }}
        >
          {subMessage}
        </Text>
      </View>
      <View
        style={{
          marginBottom: safeInsetBottom + 20,
          marginLeft: 24,
          marginRight: 24,
        }}
      >
        <ButtonView
          type={type}
          confirmEnable={confirmEnable != 0}
          confirmPressed={confirmPressed}
        />
      </View>
      <MinimizeButton
        type={type}
        safeInsetTop={safeInsetTop}
        minimize={() => {
          navigateView()
        }}
      />
    </View>
  )
}

function MinimizeButton(props: {
  type: ProcessingType
  safeInsetTop: number
  minimize: () => void
}) {
  const queue = useContext(QueueContext)
  return (
    <View
      style={{ position: 'absolute', right: 24, top: 16 + props.safeInsetTop }}
    >
      <RectButton
        onPress={() => {
          queue.setShowTxQueued(true)
          props.minimize()
        }}
      >
        <Image
          source={
            props.type === ProcessingType.Sell
              ? Resources.Images.iconMinimizeG
              : Resources.Images.iconMinimizeB
          }
          style={{ width: 24, height: 24 }}
        />
      </RectButton>
    </View>
  )
}

function ButtonView(props: {
  type: ProcessingType
  confirmEnable: boolean
  confirmPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)
  return (
    <RectButton
      enabled={props.confirmEnable}
      style={{
        height: 48,
        borderRadius: 24,
        backgroundColor: props.confirmEnable
          ? props.type == ProcessingType.Sell
            ? Resources.Colors.brightTeal
            : Resources.Colors.darkGreyThree
          : props.type == ProcessingType.Sell
          ? Resources.Colors.darkBackground
          : Resources.Colors.aquamarine,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={props.confirmPressed}
    >
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 18,
          letterSpacing: -0.5,
          color: props.confirmEnable
            ? props.type == ProcessingType.Sell
              ? Resources.Colors.black
              : Resources.Colors.brightTeal
            : props.type == ProcessingType.Sell
            ? Resources.Colors.greyishBrown
            : Resources.Colors.sea,
        }}
      >
        {translations.processingView.done}
      </Text>
    </RectButton>
  )
}
