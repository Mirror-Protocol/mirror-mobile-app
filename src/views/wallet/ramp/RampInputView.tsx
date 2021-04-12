import React, { useEffect, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  RectButton,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedAddressInputView } from '../../common/AnimatedAddressInputView'
import { AnimatedInputView } from '../../common/AnimatedInputView'
import Nav from '../../common/Nav'
import SelectPopup, { SelectItem } from '../../common/SelectPopup'
import {
  getPairName,
  useSwitchainMarketInfo,
} from '../../../hooks/useSwitchain'
// @ts-ignore
import * as WAValidator from 'multicoin-address-validator'
import * as Resources from '../../../common/Resources'
import * as Keychain from '../../../common/Keychain'
import * as Config from '../../../common/Apis/Config'
import * as Api from '../../../common/Apis/Api'
import * as Utils from '../../../common/Utils'
import BigNumber from 'bignumber.js'
import RampInputForm from './RampInputForm'
import _ from 'lodash'
import { NotificationPopupView } from '../../common/NotificationPopupView'
import useGestureHandlerEventPrevent from '../../../hooks/useGestureHandlerPreventEvent'

const EXPIRE_TERM = 10 * 1000

const validateAddress = (address: string, denom: string): boolean => {
  let currency
  if (denom === 'USDT') {
    currency = WAValidator.findCurrency('ETH') // switchain - only erc20
  } else {
    currency = WAValidator.findCurrency(denom)
  }
  const valid =
    address &&
    currency &&
    WAValidator.validate(
      address,
      currency.name,
      Config.currentChain === 'columbus' ? 'prod' : 'testnet'
    )

  return valid
}

const RampInputView = (props: { navigation: any; route: any }) => {
  const insets = useSafeAreaInsets()

  const isWithdraw = props.route.params.withdraw

  const TITLE_LEFT = 24
  const TITLE_TOP = 100 + insets.top
  const TAB_ABS_TOP = isWithdraw ? 168 : 178

  const cryptoList: SelectItem[] = props.route.params.cryptoList
  const [selected, setSelected] = useState<SelectItem>(
    props.route.params.selected
  )

  const { pairOffer, updatePairOffer } = useSwitchainMarketInfo(isWithdraw)

  const signature = pairOffer && pairOffer.signature
  const quote = new BigNumber((pairOffer && pairOffer.quote) ?? '0')
  const minerFee = new BigNumber((pairOffer && pairOffer.minerFee) ?? '0')
  const minLimit = new BigNumber((pairOffer && pairOffer.minLimit) ?? '0')
  const maxLimit = new BigNumber((pairOffer && pairOffer.maxLimit) ?? '0')

  const [refundAddress, setRefundAddress] = useState('')
  const [memo, setMemo] = useState('')

  const [validAddress, setValidAddress] = useState(false)
  const [validAmount, setValidAmount] = useState(false)
  const [validMemo, setValidMemo] = useState(true)
  const [nextEnable, setNextEnable] = useState(false)

  const [showSelectPopup, setShowSelectPopup] = useState(false)
  const [showRefundNotification, setShowRefundNotification] = useState(false)

  const [whiteSpace, setWhiteSpace] = useState(0)
  const inputSpace = useRef(new Animated.Value(0)).current

  const ANIM_INPUT_SPACE_DURATION = 100
  const animInputSpace = (toValue: number, duration?: number) => {
    Animated.timing(inputSpace, {
      toValue,
      duration: duration ?? ANIM_INPUT_SPACE_DURATION,
      useNativeDriver: false,
    }).start()
  }

  const [positionAddress, setPositionAddress] = useState({ y: 0, height: 0 })
  const [positionMemo, setPositionMemo] = useState({ y: 0, height: 0 })
  const [positionPay, setPositionPay] = useState({ y: 0, height: 0 })

  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')

  const [ustBalance, setUstBalance] = useState<BigNumber>(new BigNumber(0))
  const [withdrawAmount, setWithdrawAmount] = useState<BigNumber>(
    new BigNumber(0)
  )

  const refScrollView = useRef<ScrollView>(null)
  const expireTimer = useRef<NodeJS.Timeout>()

  const { isPrevent, setPreventEvent } = useGestureHandlerEventPrevent()

  const loadUstBalance = async () => {
    let balance = new BigNumber(0)
    let fee = new BigNumber(0)

    const balances = await Api.getBalances()
    const item = balances.filter((item) => {
      return item.denom == 'uusd'
    })
    if (item.length > 0) {
      balance = new BigNumber(item[0].amount)
      const taxRate = await Api.getTaxRate()
      const taxCap = await Api.getTaxCap('uusd')
      const tax = Utils.getCutNumber(
        BigNumber.min(new BigNumber(balance).multipliedBy(taxRate), taxCap),
        0
      )
      balance = balance.minus(tax)
    }
    fee = Api.fee
    setUstBalance(BigNumber.max(balance.minus(fee), new BigNumber(0)))
  }

  const clearTimer = () => {
    expireTimer.current && clearTimeout(expireTimer.current)
  }

  useEffect(() => {
    const initShowNotification = async () => {
      const ret = await Keychain.getSkipRefundNotification()
      setShowRefundNotification(!ret)
    }
    !isWithdraw && initShowNotification()
  }, [])

  useEffect(() => {
    const scrollTop = () => {
      refScrollView.current?.scrollTo({
        y: 0,
      })
      animInputSpace(0, 500)
    }
    Platform.OS === 'ios'
      ? Keyboard.addListener('keyboardWillHide', scrollTop)
      : Keyboard.addListener('keyboardDidHide', scrollTop)
    return () => {
      Platform.OS === 'ios'
        ? Keyboard.removeListener('keyboardWillHide', scrollTop)
        : Keyboard.removeListener('keyboardDidHide', scrollTop)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = props.navigation.addListener('blur', clearTimer)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isWithdraw) {
      loadUstBalance()
    }
  }, [])

  useEffect(() => {
    setNextEnable(validAddress && validMemo && validAmount)
  }, [validAddress, validMemo, validAmount])

  useEffect(() => {
    selected && updatePairOffer(selected.value)
  }, [selected])

  useEffect(() => {
    const validCheck = async () => {
      try {
        setValidAddress(
          _.some(refundAddress) &&
            validateAddress(refundAddress, selected.value)
        )
      } catch (e) {}
    }
    validCheck()
  }, [selected, refundAddress])

  useEffect(() => {
    setValidMemo(!memo || memo.length > 1)
  }, [selected, memo])

  useEffect(() => {
    const amount = new BigNumber(Utils.stringNumberWithoutComma(fromAmount))
    const invalid =
      amount.lt(minLimit) ||
      amount.gt(maxLimit) ||
      amount.isEqualTo(0) ||
      amount.isNaN()
    setValidAmount(!invalid)
  }, [selected, fromAmount])

  useEffect(() => {
    if (pairOffer) {
      clearTimer()
      const remainExpire =
        pairOffer?.expiryTs * 1000 - new Date().getTime() - EXPIRE_TERM

      expireTimer.current = setTimeout(() => {
        selected && updatePairOffer(selected.value)
      }, remainExpire)
    }

    return () => clearTimer()
  }, [pairOffer])

  const RefreshCurrency = () => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={() => updatePairOffer(selected.value)}
    >
      <View style={styles.refreshCurrencyContainer}>
        <Image
          source={Resources.Images.iconExchange}
          style={{ width: 12, height: 12 }}
        />
      </View>
      <Text style={styles.refreshCurrencyText}>
        {`1 ${selected.value} ≈ ${quote} UST`}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        // paddingHorizontal: 24,
      }}
    >
      <ScrollView
        ref={refScrollView}
        overScrollMode={'never'}
        scrollToOverflowEnabled={false}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps={'always'}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (isPrevent()) {
              return
            }
            Keyboard.dismiss()
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                position: 'absolute',
                top: TITLE_TOP,
                left: TITLE_LEFT,
              }}
            >
              <Text
                style={[
                  styles.titleText,
                  styles.titleTextLight,
                  { marginBottom: Platform.OS === 'ios' ? 12 : 0 },
                ]}
              >
                {isWithdraw ? `Withdraw UST` : `Buy UST`}
                {/* {'Buy UST with'} */}
              </Text>

              {false && (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => setShowSelectPopup(true)}>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text
                        style={[
                          styles.titleText,
                          styles.titleTextLight,
                          { marginRight: 12 },
                        ]}
                      >
                        {selected.label}
                      </Text>
                      <Image
                        source={Resources.Images.btnExpandOpenG}
                        style={{ width: 16, height: 16, marginRight: 4 }}
                      />
                    </View>
                    <View
                      style={{
                        height: 3,
                        borderRadius: 14.5,
                        backgroundColor: Resources.Colors.brightTeal,
                      }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View
              onLayout={(e) => {
                const h =
                  Dimensions.get('window').height -
                  e.nativeEvent.layout.y -
                  e.nativeEvent.layout.height
                setWhiteSpace(h)
              }}
              style={{
                marginTop: TAB_ABS_TOP + insets.top,
                marginHorizontal: 24,
              }}
            >
              {isWithdraw && (
                <>
                  <View style={{ flexDirection: 'row', marginBottom: 29 }}>
                    <RectButton
                      onPress={() => {
                        setWithdrawAmount(ustBalance)
                      }}
                    >
                      <Text style={styles.withdrawAmountText}>
                        {Utils.getFormatted(
                          ustBalance.dividedBy(1000000),
                          6,
                          true
                        ) + `UST`}
                      </Text>
                    </RectButton>
                    <Text style={styles.withdrawAvailableText}>
                      {` available to withdraw`}
                    </Text>
                  </View>
                </>
              )}
              <AnimatedAddressInputView
                onLayout={(e) => {
                  setPositionAddress({
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  })
                }}
                onChangeText={(text) => {
                  setRefundAddress(text.trim().replace(/\s/g, ''))
                }}
                value={refundAddress}
                style={{ paddingVertical: 0 }}
                placeholder={isWithdraw ? `ADDRESS` : `REFUND ADDRESS`}
                focusChanged={(f) => {
                  if (f === true) {
                    refScrollView.current?.scrollTo({
                      y: positionAddress.y,
                    })
                    animInputSpace(positionAddress.y)
                  }
                }}
                setPreventEvent={setPreventEvent}
              />
              <AnimatedInputView
                onLayout={(e) => {
                  setPositionMemo({
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  })
                }}
                autoFocus={false}
                onChangeText={(text) => {
                  setMemo(text)
                }}
                value={memo}
                maxLength={999}
                keyboardType='default'
                numberOfLines={2}
                suffixTitle={''}
                placeholder={'MEMO'}
                placeholderSub={'Optional'}
                style={{}}
                focusChanged={(f) => {
                  if (f === true) {
                    animInputSpace(positionMemo.y + 55)
                    setTimeout(() => {
                      refScrollView.current?.scrollTo({
                        y: positionMemo.y + 55 + insets.top,
                      })
                    }, ANIM_INPUT_SPACE_DURATION + 10)
                  }
                }}
                setPreventEvent={setPreventEvent}
              />
              <RampInputForm
                onLayout={(e) => {
                  setPositionPay({
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  })
                }}
                selectedItem={selected}
                quote={quote}
                minerFee={minerFee}
                minLimit={minLimit}
                maxLimit={maxLimit}
                focusChanged={(f) => {
                  if (f === true) {
                    animInputSpace(positionPay.y + 55)
                    setTimeout(() => {
                      const y = positionPay.y + 55 + insets.top
                      refScrollView.current?.scrollTo({
                        y,
                      })
                    }, ANIM_INPUT_SPACE_DURATION + 10)
                  }
                }}
                onUpdate={() => {
                  updatePairOffer(selected.value)
                }}
                fromAmountChanged={setFromAmount}
                toAmountChanged={setToAmount}
                setPreventEvent={setPreventEvent}
                withdraw={isWithdraw}
                amount={withdrawAmount.dividedBy(1e6)}
                setAmount={setWithdrawAmount}
              />
              <RefreshCurrency />
            </View>
            <View
              style={{
                height: whiteSpace,
              }}
            />
            <Animated.View
              style={{
                height: inputSpace,
              }}
            />
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
      <Nav
        navigation={props.navigation}
        focused={0}
        symbol={''}
        nextEnable={nextEnable}
        nextPressed={() => {
          if (nextEnable) {
            isWithdraw
              ? props.navigation.replace('RampOfferView', {
                  denom: selected.value,
                  refundAddress,
                  memo,
                  pair: getPairName(selected.value, true),
                  fromAmount,
                  quote: quote.toString(),
                  minerFee: minerFee.toString(),
                  signature,
                  withdraw: true,
                })
              : props.navigation.replace('RampOfferView', {
                  denom: selected.value,
                  refundAddress,
                  memo,
                  pair: getPairName(selected.value),
                  fromAmount,
                  quote: quote.toString(),
                  minerFee: minerFee.toString(),
                  signature,
                  withdraw: false,
                })
          }
        }}
      />
      {showSelectPopup && (
        <SelectPopup
          titleText={'Buy UST'}
          list={cryptoList}
          selected={selected}
          setSelected={(item) => setSelected(item)}
          close={() => {
            setShowSelectPopup(false)
          }}
        />
      )}
      {showRefundNotification && (
        <NotificationPopupView
          navigation={props.navigation}
          route={props.route}
          title={'Refund Address'}
          content={
            'In case your transaction fails due to an unforeseen error, your initial deposit will be sent back to the refund address. Please make sure you enter the correct address that will receive your deposited funds.'
          }
          done={'Got It'}
          onDismissPressed={() => {
            setShowRefundNotification(false)
            Keychain.setSkipRefundNotification()
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  titleText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 32,
    letterSpacing: -0.5,
  },
  titleTextLight: {
    color: Resources.Colors.veryLightPinkTwo,
  },

  refreshCurrencyContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
    backgroundColor: Resources.Colors.darkGreyTwo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshCurrencyText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 14,
    letterSpacing: -0.35,
    color: Resources.Colors.greyishBrown,
  },

  withdrawAmountText: {
    fontFamily: Resources.Fonts.book,
    fontSize: 14,
    letterSpacing: -0.2,
    color: Resources.Colors.veryLightPink,
    textDecorationLine: 'underline',
  },
  withdrawAvailableText: {
    fontFamily: Resources.Fonts.book,
    fontSize: 14,
    letterSpacing: -0.2,
    color: Resources.Colors.veryLightPink,
  },
})

export default RampInputView
