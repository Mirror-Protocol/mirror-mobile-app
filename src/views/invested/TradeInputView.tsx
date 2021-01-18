import React, { useState, useEffect } from 'react'
import { Text, View, Image } from 'react-native'
import * as Resources from '../../common/Resources'
import { TradeStep1View } from './TradeStep1View'
import { TouchableOpacity } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { TradeStep2View } from './TradeStep2View'

export function TradeInputView(props: { route: any; navigation: any }) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const [type, setType] = useState('')
  const [symbol, setSymbol] = useState('')
  const [step, setStep] = useState(0)

  const [amount, setAmount] = useState(new BigNumber(0))

  useEffect(() => {
    setType(props.route.params.type)
    setSymbol(props.route.params.symbol)
  }, [])

  useEffect(() => {
    if (step == 0) {
      setAmount(new BigNumber(0))
    }
  }, [step])

  const bgColor =
    type == 'buy' ? Resources.Colors.brightTeal : Resources.Colors.darkGreyThree
  const navIcon =
    type == 'buy' ? Resources.Images.btnCloseG10 : Resources.Images.btnCloseB10

  return (
    <View
      style={{
        paddingTop: safeInsetTop,
        backgroundColor: bgColor,
        flex: 1,
      }}
    >
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={{
            width: 36,
            height: 36,
            marginTop: -6,
            marginRight: 18,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            props.navigation.pop()
          }}
        >
          <View
            style={{
              borderRadius: 12,
              backgroundColor:
                type == 'buy'
                  ? Resources.Colors.darkGreyThree
                  : Resources.Colors.veryLightPink,
              width: 24,
              height: 24,
            }}
          >
            <Image
              style={{
                width: 10,
                height: 10,
                marginLeft: 7,
                marginTop: 7,
              }}
              source={navIcon}
            />
          </View>
        </TouchableOpacity>
      </View>
      {type != '' ? (
        step == 0 ? (
          <TradeStep1View
            type={type}
            symbol={symbol}
            setStep={setStep}
            setSend={setAmount}
          />
        ) : (
          <TradeStep2View
            type={type}
            symbol={symbol}
            setStep={setStep}
            navigation={props.navigation}
            amount={amount}
          />
        )
      ) : (
        <View />
      )}
    </View>
  )
}

export function NextButton(props: {
  type: string
  title: string
  enable: boolean
  onPress: () => void
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const isBuy = props.type == 'buy'

  const color1 = isBuy
    ? Resources.Colors.darkGreyThree
    : Resources.Colors.brightTeal
  const color2 = isBuy
    ? Resources.Colors.aquamarine
    : Resources.Colors.darkBackground
  const color3 = isBuy ? Resources.Colors.brightTeal : Resources.Colors.black
  const color4 = isBuy ? Resources.Colors.sea : Resources.Colors.greyishBrown

  const bgColor = props.enable ? color1 : color2
  const textColor = props.enable ? color3 : color4

  return (
    <TouchableOpacity
      style={{
        marginTop: 24,
        marginBottom: 8 + safeInsetBottom,
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
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 18,
          letterSpacing: -0.5,
          color: textColor,
        }}
      >
        {props.title}
      </Text>
    </TouchableOpacity>
  )
}
