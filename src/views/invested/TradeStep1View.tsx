import React, { useState, useContext, useEffect, useRef } from 'react'
import { Text, View, StyleSheet, Animated } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import * as VibrationHelper from '../../component/VibrationHelper'
import {
  RectButton,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { NextButton } from './TradeInputView'

export function TradeStep1View(props: {
  type: string
  symbol: string
  token: string
  setStep: (step: number) => void
  setSend: (amount: BigNumber) => void
}) {
  const { translations } = useContext(ConfigContext)
  const isBuy = props.type == 'buy'

  const [maxAmount, setMaxAmount] = useState(new BigNumber(0))
  const [amount, setAmount] = useState(new BigNumber(0))
  const [formattedAmount, setFormattedAmount] = useState('0')
  const [nextEnable, setNextEnable] = useState(false)
  const [buttonEnable, setButtonEnable] = useState(true)

  const shakeAnimation = useRef(new Animated.Value(0)).current

  function startShake() {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -15,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 5,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start()
  }

  useEffect(() => {
    load().catch((error) => {
      setMaxAmount(new BigNumber(0))
    })
  }, [])

  async function load() {
    var maxAmount = new BigNumber(0)

    if (props.type == 'buy') {
      const remain = 1000000

      let amount: BigNumber = await Api.getUstBalance()
      amount = amount.minus(remain)
      maxAmount = amount.dividedBy(1000000)
    } else {
      const amount = new BigNumber((await Api.assetInfo(props.token)).amount)
      maxAmount = amount.dividedBy(1000000)
    }
    setMaxAmount(BigNumber.max(maxAmount, new BigNumber('0')))
  }

  useEffect(() => {
    setNextEnable(
      amount.isGreaterThan(0) && amount.isLessThanOrEqualTo(maxAmount)
    )
  }, [amount])

  function maxPressed() {
    setValues(
      Utils.textInputFilter(
        isBuy ? Utils.getFormatted(maxAmount, 2) : maxAmount.toString()
      )
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <HeaderLabel
        isBuy={isBuy}
        onPress={() => {
          maxPressed()
        }}
        maxValue={
          isBuy
            ? Utils.getFormatted(maxAmount, 2)
            : Utils.getFormatted(maxAmount, 6)
        }
        maxValueDenom={
          isBuy ? Keychain.baseCurrencyDenom : Utils.getDenom(props.symbol)
        }
        value1={Utils.getDenom(props.symbol)}
      />
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        <InputLabel
          textColor={isBuy ? Resources.Colors.black : Resources.Colors.white}
          denom={
            isBuy ? Keychain.baseCurrencyDenom : Utils.getDenom(props.symbol)
          }
          formattedAmount={formattedAmount}
        />
      </Animated.View>
      <View style={{ flex: 1 }} />
      <NumberPad
        buttonEnable={buttonEnable}
        textColor={
          isBuy ? Resources.Colors.black : Resources.Colors.veryLightPink
        }
        pressButton={(c: string) => {
          if (c == 'clear') {
            setValues('0')
          } else if (c == '<') {
            let amount = formattedAmount
            if (amount.length > 0) {
              amount = amount.substring(0, amount.length - 1)
              if (amount == '') {
                amount = '0'
              }
              setValues(Utils.textInputFilter(amount))
            }
          } else {
            let inputValue = isBuy
              ? Utils.textInputFilter(formattedAmount + c, 2)
              : Utils.textInputFilter(formattedAmount + c)

            if (isBuy) {
              if (inputValue == '0.') {
                startShake()
                VibrationHelper.Vibrate()
                inputValue = '0'
              }
            }
            setValues(inputValue)
          }
        }}
      />
      <View style={{ marginLeft: 24, marginRight: 24 }}>
        <NextButton
          type={props.type}
          title={translations.tradeStep1View.next}
          enable={nextEnable}
          onPress={() => {
            props.setSend(amount.multipliedBy(1000000))
            props.setStep(1)
          }}
        />
      </View>
    </View>
  )

  function setValues(value: string) {
    const n = new BigNumber(value.replace(/,/g, ''))
    if (n.isGreaterThan(maxAmount)) {
      startShake()
      VibrationHelper.Vibrate()

      setButtonEnable(false)
      setTimeout(() => {
        maxPressed()
        setButtonEnable(true)
      }, 200)
    } else {
      setAmount(n)
      setFormattedAmount(value)
    }
  }
}

function HeaderLabel(props: {
  isBuy: boolean
  onPress: () => void
  maxValue: string
  maxValueDenom: string
  value1: string
}) {
  const { translations } = useContext(ConfigContext)

  const text1Color = props.isBuy
    ? Resources.Colors.dark
    : Resources.Colors.veryLightPink
  const line1Color = props.isBuy
    ? Resources.Colors.sea
    : Resources.Colors.brownishGrey

  return (
    <View>
      {props.isBuy ? (
        <View>
          <View
            style={{
              marginTop: 49,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <RectButton
              onPress={() => {
                props.onPress()
              }}
            >
              <View style={{ flexDirection: 'row' }}>
                <Text
                  style={{
                    color: text1Color,
                    fontFamily: Resources.Fonts.medium,
                    fontSize: 14,
                    lineHeight: 19,
                    letterSpacing: -0.33,
                  }}
                >
                  {props.maxValue}
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    color: text1Color,
                    fontFamily: Resources.Fonts.medium,
                    fontSize: 10,
                    letterSpacing: -0.24,
                  }}
                >
                  {props.maxValueDenom}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: line1Color,
                }}
              />
            </RectButton>
            <Text
              style={{
                marginTop: 1,
                marginLeft: 4,
                color: text1Color,
                fontFamily: Resources.Fonts.medium,
                fontSize: 14,
                lineHeight: 19,
                letterSpacing: -0.33,
              }}
            >
              {translations.tradeStep1View.availableTo}
            </Text>
          </View>
          <Text
            style={{
              textAlign: 'center',
              color: text1Color,
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              lineHeight: 19,
              letterSpacing: -0.33,
            }}
          >
            {translations.tradeStep1View.buy + ' ' + props.value1}
          </Text>
        </View>
      ) : (
        <View>
          <View
            style={{
              marginTop: 49,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <RectButton
              onPress={() => {
                props.onPress()
              }}
            >
              <View style={{ flexDirection: 'row', marginTop: 4 }}>
                <Text
                  style={{
                    color: text1Color,
                    fontFamily: Resources.Fonts.medium,
                    fontSize: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  {props.maxValue}
                </Text>
                <Text
                  style={{
                    color: text1Color,
                    fontFamily: Resources.Fonts.medium,
                    fontSize: 14,
                    letterSpacing: -0.2,
                  }}
                >
                  {props.maxValueDenom}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: line1Color,
                }}
              />
            </RectButton>
            <Text
              style={{
                marginTop: 1,
                marginLeft: 4,
                color: text1Color,
                fontFamily: Resources.Fonts.medium,
                fontSize: 14,
                lineHeight: 19,
                letterSpacing: -0.33,
              }}
            >
              {translations.tradeStep1View.availableToSell}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

function InputLabel(props: {
  textColor: any
  formattedAmount: string
  denom: string
}) {
  const [bottom, setBottom] = useState(15)
  return (
    <View
      style={{
        marginLeft: 24,
        marginRight: 24,
        marginTop: 24,
        height: 84,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <Text
        onLayout={(e) => {
          setBottom(e.nativeEvent.layout.height * 0.1778)
        }}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        style={{
          marginLeft: 60,
          marginBottom: 0,
          color: props.textColor,
          fontFamily: Resources.Fonts.medium,
          fontSize: 84,
          letterSpacing: -1.11,
        }}
      >
        {props.formattedAmount}
      </Text>
      <Text
        style={{
          marginRight: 60,
          marginBottom: bottom,
          color: props.textColor,
          fontFamily: Resources.Fonts.bold,
          fontSize: 18,
          letterSpacing: 0,
        }}
      >
        {props.denom}
      </Text>
    </View>
  )
}

function NumberPad(props: {
  textColor: any
  pressButton: (n: string) => void
  buttonEnable: boolean
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'1'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'2'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'3'}
          onPress={props.pressButton}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'4'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'5'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'6'}
          onPress={props.pressButton}
        />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'7'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'8'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'9'}
          onPress={props.pressButton}
        />
      </View>

      <View style={{ flexDirection: 'row' }}>
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'.'}
          onPress={props.pressButton}
        />
        <ButtonView
          enable={props.buttonEnable}
          textColor={props.textColor}
          text={'0'}
          onPress={props.pressButton}
        />
        <LongPressGestureHandler
          onHandlerStateChange={({ nativeEvent }) => {
            if (nativeEvent.state == State.ACTIVE) {
              props.pressButton('clear')
            } else {
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <ButtonView
              enable={props.buttonEnable}
              textColor={props.textColor}
              text={'<'}
              onPress={props.pressButton}
            />
          </View>
        </LongPressGestureHandler>
      </View>
    </View>
  )
}

function ButtonView(props: {
  enable: boolean
  textColor: any
  text: string
  onPress: (number: string) => void
}) {
  const styles = StyleSheet.create({
    keybackground: {
      borderRadius: 8,
      flex: 1,
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    keybutton: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 24,
      letterSpacing: -0.75,
      color: props.textColor,
    },
  })

  return (
    <RectButton
      enabled={props.enable}
      style={styles.keybackground}
      onPress={() => {
        props.onPress(props.text)
      }}
    >
      <Text style={styles.keybutton}>{props.text}</Text>
    </RectButton>
  )
}
