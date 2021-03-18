import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useContext,
} from 'react'
import { Text, View, Keyboard, Animated } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as WalletUtils from '../../common/WalletUtils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import {
  RectButton,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { AnimatedInputView } from '../common/AnimatedInputView'
import { AnimatedAddressInputView } from '../common/AnimatedAddressInputView'
import { useFocusEffect } from '@react-navigation/native'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import Nav from '../common/Nav'
import useGestureHandlerEventPrevent from '../../hooks/useGestureHandlerPreventEvent'

export function WithdrawView(props: { route: any; navigation: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const { isPrevent, setPreventEvent } = useGestureHandlerEventPrevent()

  const symbol = props.route.params.symbol

  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const [focused, setFocused] = useState(0)
  const [balance, setBalance] = useState(new BigNumber(0))

  const [nextEnable, setNextEnable] = useState(false)

  const field1Height = useRef(0)
  const field2Height = useRef(0)
  const field3Height = useRef(0)

  const duration = 200
  const anim = useRef(new Animated.Value(0)).current
  const animationStyles = {
    transform: [{ translateY: anim }],
  }

  function keyboardHide(e: any) {
    setFocused(0)
  }

  useEffect(() => {
    Keyboard.addListener('keyboardWillHide', keyboardHide)
    return () => {
      Keyboard.removeListener('keyboardWillHide', keyboardHide)
    }
  }, [keyboardHide])

  useEffect(() => {
    checkValid()
  }, [address, amount, memo])

  async function checkValid() {
    const addressValid = await WalletUtils.isValidAddress(address)
    const _amount = new BigNumber(amount.split(',').join(''))

    if (
      addressValid &&
      _amount.isGreaterThan(new BigNumber(0)) &&
      _amount.isLessThanOrEqualTo(balance.dividedBy(1000000))
    ) {
      setNextEnable(true)
    } else {
      setNextEnable(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      load().catch((error) => {
        setBalance(new BigNumber(0))
      })
    }, [])
  )

  async function load() {
    let balance = new BigNumber(0)
    let fee = new BigNumber(0)

    if (!symbol.toLowerCase().startsWith('m')) {
      const balances = await Api.getBalances()
      const item = balances.filter((item) => {
        return item.denom == symbol
      })
      if (item.length > 0) {
        balance = new BigNumber(item[0].amount)
        if (symbol != 'uluna') {
          const taxRate = await Api.getTaxRate()
          const taxCap = await Api.getTaxCap(symbol)
          const tax = Utils.getCutNumber(
            BigNumber.min(new BigNumber(balance).multipliedBy(taxRate), taxCap),
            0
          )
          balance = balance.minus(tax)
        }
      }
      fee = Api.fee
    } else {
      const item = await Api.assetInfo(symbol)
      balance = new BigNumber(item.amount)
      fee = new BigNumber(0)
    }
    setBalance(BigNumber.max(balance.minus(fee), new BigNumber(0)))
  }

  useEffect(() => {
    if (focused != -1) {
      const toValue =
        focused == 0
          ? 0
          : focused == 1
          ? -field1Height.current
          : -(field1Height.current + field2Height.current)

      Animated.timing(anim, {
        toValue: toValue,
        duration: duration,
        useNativeDriver: true,
      }).start(() => {
        if (focused > 0) {
        }
      })
    }
  }, [focused])

  useEffect(() => {}, [address])

  return (
    <View
      style={{
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      <TouchableWithoutFeedback
        onPress={() => {
          if (isPrevent()) {
            return
          }
          Keyboard.dismiss()
        }}
      >
        <Animated.View
          style={[
            animationStyles,
            {
              marginTop: 52 + safeInsetTop,
              paddingLeft: 24,
              paddingRight: 24,
            },
          ]}
        >
          <Text
            style={{
              marginTop: 48,
              fontFamily: Resources.Fonts.medium,
              fontSize: 32,
              letterSpacing: -0.5,
              color: Resources.Colors.white,
            }}
          >
            {translations.withdrawView.withdraw + ' ' + Utils.getDenom(symbol)}
          </Text>
          <View style={{ flexDirection: 'row', marginTop: 32 }}>
            <RectButton
              onPress={() => {
                setAmount(balance.dividedBy(1000000).toString())
              }}
            >
              <Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 14,
                  letterSpacing: -0.2,
                  color: Resources.Colors.veryLightPink,
                  textDecorationLine: 'underline',
                }}
              >
                {Utils.getFormatted(balance.dividedBy(1000000), 6, true) +
                  Utils.getDenom(symbol)}
              </Text>
            </RectButton>
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 14,
                letterSpacing: -0.2,
                color: Resources.Colors.veryLightPink,
              }}
            >
              {' ' + translations.withdrawView.availableToWithdraw}
            </Text>
          </View>
          <AnimatedInputView
            onLayout={(e) => {
              field1Height.current = e.nativeEvent.layout.height
            }}
            autoFocus={true}
            onChangeText={(text) => {
              setAmount(
                Utils.textInputFilter(text, 6, balance.dividedBy(1000000))
              )
            }}
            value={amount}
            maxLength={999}
            keyboardType='decimal-pad'
            numberOfLines={2}
            suffixTitle={Utils.getDenom(symbol)}
            placeholder={
              symbol.startsWith('m')
                ? translations.withdrawView.quantity
                : translations.withdrawView.amount
            }
            style={{ marginTop: 24 }}
            focusChanged={(f) => {
              if (f) {
                setFocused(0)
              }
            }}
            setPreventEvent={setPreventEvent}
          />
          <AnimatedAddressInputView
            onLayout={(e) => {
              field2Height.current = e.nativeEvent.layout.height
            }}
            onChangeText={(text) => {
              setAddress(text)
            }}
            value={address}
            placeholder={translations.withdrawView.address}
            style={{ marginTop: 24 }}
            focusChanged={(f) => {
              if (f) {
                setFocused(1)
              }
            }}
            setPreventEvent={setPreventEvent}
          />
          <AnimatedInputView
            onLayout={(e) => {
              field3Height.current = e.nativeEvent.layout.height
            }}
            autoFocus={false}
            onChangeText={(text) => {
              text = text.replace('\n', '')
              setMemo(text)
            }}
            value={memo}
            maxLength={50}
            keyboardType='default'
            numberOfLines={3}
            suffixTitle={''}
            placeholder={translations.withdrawView.memo}
            style={{ marginTop: 24 }}
            focusChanged={(f) => {
              if (f) {
                setFocused(2)
              }
            }}
            setPreventEvent={setPreventEvent}
          />
        </Animated.View>
        <Nav
          navigation={props.navigation}
          focused={focused}
          symbol={symbol}
          nextEnable={nextEnable}
          nextPressed={() => {
            if (!nextEnable) {
              return
            }

            props.navigation.push('WithdrawConfirmView', {
              address: address,
              amount: amount.split(',').join(''),
              memo: memo,
              symbol: symbol,
              ramp: false,
              rampPair: '',
            })
          }}
        />
      </TouchableWithoutFeedback>
    </View>
  )
}
