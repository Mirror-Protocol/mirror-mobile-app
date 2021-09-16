import BigNumber from 'bignumber.js'
import React, { useEffect, useContext, useState, useRef } from 'react'
import { Text, View, BackHandler, Image, Modal, Platform } from 'react-native'
import { RectButton } from 'react-native-gesture-handler'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { AnimatedTextView } from './AnimatedTextView'
import { QueueContext } from '../../common/provider/QueueProvider'

export enum ProcessingType {
  Buy = 0,
  Sell = 1,
  Withdraw = 2,
  Swap = 3,
  Burn = 4,
}

export function ProcessingPopup(props: {
  showPopup: boolean
  closePopup: () => void
}) {
  const { translations, pw, setPw } = useContext(ConfigContext)
  const queue = useContext(QueueContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const [subMessage, setSubMessage] = useState('')
  const [subMessageColor, setSubMessageColor] = useState('transparent')
  const [confirmEnable, setConfirmEnable] = useState(0)

  const [data, setData] = useState<any | undefined>()
  useEffect(() => {
    Keychain.getTxQueueData().then((d) => {
      setData(JSON.parse(d))
    })

    const callback = () => {
      return true
    }
    BackHandler.addEventListener('hardwareBackPress', callback)
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', callback)
    }
  }, [])

  const pollingTimer = useRef<number>()
  const pollingHash = (txhash: string, event?: any) => {
    pollingTimer.current = setTimeout(() => {
      Api.getTxInfo(txhash)
        .then((txinfo) => {
          if (txinfo === undefined) {
            pollingHash(txhash)
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

  useEffect(() => {
    if (data === undefined) {
      return
    }

    Api.getTxInfo(data.txhash)
      .then((txinfo) => {
        if (txinfo === undefined) {
          pollingHash(data.txhash)
        } else {
          success()
        }
      })
      .catch((error) => {
        fail(error)
      })

    setSubMessageColor(
      data.type === ProcessingType.Sell
        ? Resources.Colors.brightTeal
        : Resources.Colors.black
    )
    setSubMessage(`This transaction is in process`)

    if (data.type == ProcessingType.Buy) {
      pollingHash(data.txhash)
    } else if (data.type == ProcessingType.Sell) {
      pollingHash(data.txhash)
    } else if (data.type == ProcessingType.Withdraw) {
      pollingHash(data.txhash)
    } else if (data.type == ProcessingType.Swap) {
      pollingHash(data.txhash)
    } else if (data.type === ProcessingType.Burn) {
      pollingHash(data.txhash)
    }
  }, [data])

  function success() {
    setConfirmEnable(1)
    setSubMessageColor(
      data.type === ProcessingType.Sell
        ? Resources.Colors.brightTeal
        : Resources.Colors.black
    )
    if (data.type == ProcessingType.Buy) {
      setSubMessage(translations.processingView.buySuccess)
    } else if (data.type === ProcessingType.Sell) {
      setSubMessage(translations.processingView.sellSuccess)
    } else if (data.type === ProcessingType.Withdraw) {
      setSubMessage(translations.processingView.withdrawSuccess)
    } else if (data.type === ProcessingType.Swap) {
      setSubMessage(translations.processingView.swapSuccess)
    } else if (data.type === ProcessingType.Burn) {
      setSubMessage(translations.processingView.burnSuccess)
    }
  }

  function fail(error: any) {
    setSubMessageColor(Resources.Colors.brightPink)
    setSubMessage(error.toString())
    setConfirmEnable(2)

    if (data.rampPair) {
      Keychain.removeSwitchainOffer(data.rampPair)
    }
  }

  function confirmPressed() {
    queue.setShowTxQueued(false)
    props.closePopup()
  }

  function Processing() {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor:
            data.type === ProcessingType.Sell
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
              type={data.type}
              complete={confirmEnable !== 0}
              amount={
                data.type === ProcessingType.Buy ||
                data.type === ProcessingType.Withdraw
                  ? Utils.getFormatted(
                      new BigNumber(data.displayAmount),
                      6,
                      true
                    )
                  : Utils.getFormatted(
                      new BigNumber(data.displayAmount),
                      2,
                      true
                    )
              }
              symbol={Utils.getDenom(data.displaySymbol)}
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
            type={data.type}
            confirmEnable={confirmEnable != 0}
            confirmPressed={confirmPressed}
          />
        </View>
        <MinimizeButton
          type={data.type}
          safeInsetTop={safeInsetTop}
          closePopup={props.closePopup}
        />
      </View>
    )
  }

  return data === undefined ? (
    <View />
  ) : Platform.OS === 'ios' ? (
    <Modal visible={props.showPopup} animationType={'slide'}>
      <Processing />
    </Modal>
  ) : props.showPopup ? (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <Processing />
    </View>
  ) : (
    <View />
  )
}

function MinimizeButton(props: {
  type: ProcessingType
  safeInsetTop: number
  closePopup: () => void
}) {
  const { setShowTxQueued: setTxQueued } = useContext(QueueContext)
  return (
    <View
      style={{ position: 'absolute', right: 24, top: 16 + props.safeInsetTop }}
    >
      <RectButton
        onPress={() => {
          setTxQueued(true)
          props.closePopup()
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
