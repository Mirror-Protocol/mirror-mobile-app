import React, { useState, useContext, useEffect, useRef } from 'react'
import { Text, View, StyleSheet, Image, Animated, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import * as VibrationHelper from '../../component/VibrationHelper'
import {
  TouchableOpacity,
  RectButton,
  LongPressGestureHandler,
  State,
} from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { ProcessingType } from '../common/ProcessingView'
import { ConfigContext } from '../../common/provider/ConfigProvider'

export function SwapView(props: { navigation: any; route: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const symbol = props.route.params.symbol

  const [maxAmount, setMaxAmount] = useState(new BigNumber(0))
  const [amount, setAmount] = useState(new BigNumber(0))
  const [formattedAmount, setFormattedAmount] = useState('0')
  const [estimated, setEstimated] = useState(new BigNumber(0))
  const [fee, setFee] = useState(new BigNumber(0))

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
    const balances = (await Api.getBalances()).filter((item) => {
      return item.denom == symbol
    })
    const balance = new BigNumber(balances[0].amount).dividedBy(1000000)

    setMaxAmount(BigNumber.max(maxAmount, balance))
  }

  useEffect(() => {
    if (amount.isLessThanOrEqualTo(new BigNumber(0))) {
      setEstimated(new BigNumber(0))
      setFee(new BigNumber(0))
      return
    }

    Api.getSwapEstimate(amount.multipliedBy(1000000), symbol)
      .then((estimated) => {
        const estimatedValue = new BigNumber(estimated.estimate.toString())
        setEstimated(estimatedValue)
        setFee(estimated.spread.plus(Api.fee.dividedBy(1000000)))

        setNextEnable(
          amount.isGreaterThan(0) &&
            amount.isLessThanOrEqualTo(maxAmount) &&
            Utils.getCutNumber(
              estimatedValue.dividedBy(1000000),
              2
            ).isGreaterThan(0)
        )
      })
      .catch((error) => {
        setNextEnable(false)
      })
  }, [amount])

  function swap() {
    props.navigation.push('ProcessingView', {
      type: ProcessingType.Swap,
      amount: amount.multipliedBy(1000000).toString(),
      symbol: symbol,

      displayAmount: estimated.dividedBy(1000000).toString(),
      displaySymbol: Keychain.baseCurrency,
    })
  }

  function maxPressed() {
    setValues(Utils.textInputFilter(maxAmount.toString()))
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: Resources.getSafeLayoutInsets().top,
      }}
    >
      <HeaderLabel
        onPress={() => {
          maxPressed()
        }}
        maxValue={Utils.getFormatted(maxAmount, 6)}
        maxValueDenom={Utils.getDenom(symbol)}
      />
      <RectButton
        style={{
          position: 'absolute',
          right: 18,
          top: safeInsetTop + 10,
          width: 36,
          height: 36,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          props.navigation.pop()
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            backgroundColor: Resources.Colors.veryLightPink,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={Resources.Images.btnCloseB10}
            style={{ width: 10, height: 10 }}
          />
        </View>
      </RectButton>
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        <InputLabel
          textColor={Resources.Colors.white}
          denom={Utils.getDenom(symbol)}
          formattedAmount={formattedAmount}
        />
      </Animated.View>
      <View style={{ flex: 1 }} />
      <NumberPad
        buttonEnable={buttonEnable}
        textColor={Resources.Colors.veryLightPink}
        pressButton={(c: string) => {
          if (c == 'clear') {
            setValues('0')
          } else if (c == '<') {
            var a = formattedAmount
            if (a.length > 0) {
              a = a.substring(0, a.length - 1)

              if (a == '') {
                a = '0'
              }
              setValues(Utils.textInputFilter(a))
            }
          } else {
            let inputValue = Utils.textInputFilter(formattedAmount + c)

            if (inputValue == '0.') {
              startShake()
              VibrationHelper.Vibrate()
              inputValue = '0'
            }

            setValues(inputValue)
          }
        }}
      />

      <View style={{ marginLeft: 24, marginRight: 24 }}>
        <NextButton
          title={Utils.getFormatted(estimated.dividedBy(1000000), 2, true)}
          enable={nextEnable}
          onPress={() => {
            swap()
          }}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginTop: 16,
          justifyContent: 'center',
          alignItems: 'flex-end',
          marginBottom: safeInsetBottom + 16,
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 12,
            letterSpacing: -0.17,
            color: Resources.Colors.veryLightPink,
          }}
        >
          {translations.swapView.fees + ' ' + fee}
        </Text>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 10,
            letterSpacing: -0.2,
            color: Resources.Colors.veryLightPink,
          }}
        >
          {Keychain.baseCurrencyDenom}
        </Text>
      </View>
    </View>
  )

  function setValues(value: string) {
    const parsed = parseFloat(
      (value + '.0').replace('..', '.').split(',').join('')
    )
    const n = new BigNumber(parsed)
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
  onPress: () => void
  maxValue: string
  maxValueDenom: string
}) {
  const { translations } = useContext(ConfigContext)
  const text1Color = Resources.Colors.veryLightPink
  const line1Color = Resources.Colors.brownishGrey

  return (
    <View>
      <View
        style={{
          marginTop: 88,
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
          <View style={{ height: 1, backgroundColor: line1Color }} />
        </RectButton>
        <Text
          style={{
            marginTop: Platform.OS === 'ios' ? 1 : 4,
            marginLeft: 4,
            color: text1Color,
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            lineHeight: 19,
            letterSpacing: -0.33,
          }}
        >
          {translations.swapView.availableToSwap}
        </Text>
      </View>
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
          marginLeft: 24,
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
          marginRight: 24,
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

function NextButton(props: {
  title: string
  enable: boolean
  onPress: () => void
}) {
  const { translations } = useContext(ConfigContext)
  const color1 = Resources.Colors.brightTeal
  const color2 = Resources.Colors.darkGreyTwo
  const color3 = Resources.Colors.black
  const color4 = Resources.Colors.greyishBrown

  const bgColor = props.enable ? color1 : color2
  const textColor = props.enable ? color3 : color4

  return (
    <TouchableOpacity
      style={{
        marginTop: 24,
        backgroundColor: bgColor,
        borderRadius: 24,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => {
        if (!props.enable) {
          return
        }

        props.onPress()
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.5,
            color: textColor,
          }}
        >
          {translations.swapView.swapTo + ' ' + props.title}
        </Text>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 10,
            marginTop: Platform.OS === 'ios' ? 6 : 8,
            letterSpacing: -0.28,
            color: textColor,
          }}
        >
          {Keychain.baseCurrencyDenom}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
