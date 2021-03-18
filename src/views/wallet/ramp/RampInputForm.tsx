import React, { RefObject, useEffect, useRef, useState } from 'react'
import {
  ColorValue,
  Image,
  LayoutChangeEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import * as Utils from '../../../common/Utils'
import * as Resources from '../../../common/Resources'
import BigNumber from 'bignumber.js'
import { SelectItem } from '../../common/SelectPopup'
import { RectButton } from 'react-native-gesture-handler'

const InputForm = ({
  refObject,
  editable,
  color,
  denom,
  value,
  onChangeText,
  focusChanged,
}: {
  refObject: RefObject<TextInput>
  editable?: boolean
  color: ColorValue
  denom: string
  value?: string
  onChangeText?: (text: string) => void
  focusChanged?: (b: boolean) => void
}) => (
  <View style={{ flexDirection: 'row' }}>
    <TextInput
      ref={refObject}
      style={[inputFormStyles.input, { color }]}
      keyboardAppearance='dark'
      defaultValue={value}
      value={value}
      editable={editable}
      keyboardType={'decimal-pad'}
      onChangeText={onChangeText}
      onFocus={() => {
        focusChanged && focusChanged(true)
      }}
      onEndEditing={() => {
        focusChanged && focusChanged(false)
      }}
    />
    <Text style={[inputFormStyles.denom, { color }]}>{denom}</Text>
  </View>
)

const inputFormStyles = StyleSheet.create({
  input: {
    flex: 1,
    textAlign: 'right',
    fontFamily: Resources.Fonts.medium,
    fontSize: 18,
    letterSpacing: -0.3,
    paddingVertical: 0,
  },
  denom: {
    fontFamily: Resources.Fonts.bold,
    fontSize: 10,
    letterSpacing: -0.3,
    paddingLeft: Platform.OS === 'ios' ? 3 : 0,
    paddingBottom: 3,
    alignSelf: 'flex-end',
  },
})

const RampInputForm = ({
  selectedItem,
  quote,
  minerFee,
  minLimit,
  maxLimit,
  focusChanged,
  onLayout,
  onUpdate,
  fromAmountChanged,
  setPreventEvent,
  withdraw,
  amount,
  setAmount,
}: {
  selectedItem: SelectItem
  quote: BigNumber
  minerFee: BigNumber
  minLimit: BigNumber
  maxLimit: BigNumber
  focusChanged: (b: boolean) => void
  onLayout: (e: LayoutChangeEvent) => void
  onUpdate: () => void
  fromAmountChanged: (v: string) => void
  setPreventEvent?: () => void
  withdraw?: boolean
  amount: BigNumber
  setAmount: (n: BigNumber) => void
}) => {
  // BTC, ETH - 4
  // USDC, USDT - 4
  const precision =
    selectedItem.value === 'BTC' || selectedItem.value === 'ETH' ? 4 : 2
  const strZero = '0.' + '0'.repeat(precision)

  const [inputTop, setInputTop] = useState<string>(strZero)
  const [calcTop, setCalcTop] = useState<string>(strZero)
  const [inputBottom, setInputBottom] = useState<string>(strZero)
  const [calcBottom, setCalcBottom] = useState<string>(strZero)
  const [height, setHeight] = useState<number>(0)

  const [topFocus, setTopFocus] = useState<boolean>(false)
  const [bottomFocus, setBottomFocus] = useState<boolean>(false)
  const [isFocus, setFocus] = useState<boolean>(false)

  const clear = () => {
    setInputTop(strZero)
    setCalcTop(strZero)
    setInputBottom(strZero)
    setCalcBottom(strZero)
  }

  const checkEmptyValue = (
    focus: boolean,
    value: string,
    setValue: (v: string) => void
  ) => {
    if (focus && new BigNumber(value).isEqualTo(0)) {
      setValue('')
    } else if (!focus && value === '') {
      setValue(strZero)
    }
  }

  const calcInput = (
    input: string,
    cal: (c: BigNumber) => string,
    set: (c: string) => void
  ) => {
    const conv = new BigNumber(input.split(',').join(''))
    const calc = input === '' || conv.isEqualTo(0) ? strZero : cal(conv)
    set(calc)
  }

  const calcTo = (c: BigNumber) => {
    const ret = c.times(quote).minus(minerFee)
    return Utils.getFormatted(
      ret.lt(0) ? new BigNumber(0) : ret,
      precision,
      true
    )
  }

  const calcFrom = (c: BigNumber) => {
    const ret = c.dividedBy(quote).plus(minerFee.dividedBy(quote))
    return Utils.getFormatted(
      ret.lt(0) ? new BigNumber(0) : ret,
      precision,
      true
    )
  }

  const toUstRangeString = () => {
    return `Range ${Utils.getFormatted(
      minLimit,
      precision,
      true
    )} ~ ${Utils.getFormatted(maxLimit, precision, true)}`
  }

  const fromUstRangeString = () => {
    return `Range ${Utils.getFormatted(
      minLimit.times(quote).minus(minerFee),
      precision,
      true
    )} ~ ${Utils.getFormatted(
      maxLimit.times(quote).minus(minerFee),
      precision,
      true
    )}`
  }

  useEffect(() => {
    bottomFocus
      ? calcInput(calcBottom, calcFrom, setCalcTop)
      : calcInput(calcTop, calcTo, setCalcBottom)
  }, [quote.toString()])

  useEffect(() => {
    if (!amount.isEqualTo(0)) {
      onUpdate()
      amount.gte(maxLimit)
        ? setInputTop(Utils.textInputFilter(maxLimit.toString()))
        : setInputTop(Utils.textInputFilter(amount.toString()))
      setAmount(new BigNumber(0))
    }
  }, [amount])

  useEffect(() => {
    fromAmountChanged(inputTop)
    setCalcTop(inputTop)
    calcInput(inputTop, calcTo, setCalcBottom)
  }, [inputTop])

  useEffect(() => {
    setCalcBottom(inputBottom)
    calcInput(inputBottom, calcFrom, setCalcTop)
  }, [inputBottom])

  useEffect(() => {
    setFocus(topFocus || bottomFocus)
  }, [topFocus, bottomFocus])

  const refTopInput = useRef<TextInput>(null)
  const refBottomInput = useRef<TextInput>(null)

  return (
    <View
      style={[payFormStyles.container, { marginBottom: 18 }]}
      onLayout={(e) => {
        onLayout(e)
        setHeight(e.nativeEvent.layout.height)
      }}
    >
      <RectButton
        style={{ flex: 1 }}
        onPress={() => {
          setPreventEvent && setPreventEvent()
          refTopInput.current?.focus()
        }}
      >
        <View
          style={[
            payFormStyles.fromContainer,
            topFocus && {
              borderColor: Resources.Colors.darkGreyThree,
              backgroundColor: Resources.Colors.darkGreyThree,
            },
            { justifyContent: 'space-between' },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={[payFormStyles.fromTitle]}>
              {withdraw ? `Withdraw Amount` : `Pay ${selectedItem.value}`}
            </Text>
            <Text style={payFormStyles.rangeText}>
              {topFocus && toUstRangeString()}
            </Text>
          </View>
          <InputForm
            refObject={refTopInput}
            editable={true}
            color={Resources.Colors.veryLightPink}
            denom={withdraw ? `UST` : selectedItem.value}
            onChangeText={(text) => {
              onUpdate()
              setInputTop(Utils.textInputFilter(text.toString()))
            }}
            focusChanged={(focus) => {
              focusChanged(focus)
              setTopFocus(focus)
              checkEmptyValue(focus, calcTop, setCalcTop)
            }}
            value={calcTop}
          />
        </View>
      </RectButton>
      <RectButton
        style={{ flex: 1 }}
        onPress={() => {
          setPreventEvent && setPreventEvent()
          refBottomInput.current?.focus()
        }}
      >
        <View
          style={[
            payFormStyles.toContainer,
            (topFocus || bottomFocus) && {
              borderColor: Resources.Colors.darkGreyTwo,
              backgroundColor: Resources.Colors.darkGreyTwo,
            },
            bottomFocus && {
              borderColor: Resources.Colors.darkGreyThree,
              backgroundColor: Resources.Colors.darkGreyThree,
            },
            { justifyContent: 'space-between' },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text style={payFormStyles.toTitle}>
              {withdraw ? `Get ${selectedItem.value}` : `Get UST`}
            </Text>
            <Text style={payFormStyles.rangeText}>
              {bottomFocus && fromUstRangeString()}
            </Text>
          </View>
          <InputForm
            refObject={refBottomInput}
            editable={true}
            color={Resources.Colors.brownishGrey}
            denom={withdraw ? selectedItem.value : `UST`}
            onChangeText={(text) => {
              onUpdate()
              setInputBottom(Utils.textInputFilter(text.toString()))
            }}
            focusChanged={(focus) => {
              focusChanged(focus)
              setBottomFocus(focus)
              checkEmptyValue(focus, calcBottom, setCalcBottom)
            }}
            value={calcBottom}
          />
        </View>
      </RectButton>
      {isFocus && (
        <RectButton
          style={[payFormStyles.arrow, { top: height / 2 - 24 / 2 - 4 }]}
          onPress={() => {
            setPreventEvent && setPreventEvent()
            if (topFocus) {
              refTopInput.current?.focus()
            } else if (bottomFocus) {
              refBottomInput.current?.focus()
            }
          }}
        >
          <Image
            source={Resources.Images.iconSwitch}
            style={{ width: 12, height: 12 }}
          />
        </RectButton>
      )}
    </View>
  )
}

const payFormStyles = StyleSheet.create({
  container: {
    height: 162,
    overflow: 'hidden',
  },
  fromContainer: {
    flex: 1,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 24,
    backgroundColor: Resources.Colors.darkGreyTwo,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: Resources.Colors.darkGreyTwo,
  },
  fromTitle: {
    fontFamily: Resources.Fonts.book,
    fontSize: 12,
    letterSpacing: -0.17,
    color: Resources.Colors.veryLightPink,
  },
  toContainer: {
    flex: 1,
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 24,
    backgroundColor: Resources.Colors.darkBackground,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderColor: Resources.Colors.darkGreyTwo,
  },
  toTitle: {
    fontFamily: Resources.Fonts.book,
    fontSize: 12,
    letterSpacing: 0.2,
    color: Resources.Colors.brownishGrey,
  },

  rangeText: {
    fontFamily: Resources.Fonts.book,
    fontSize: 12,
    letterSpacing: -0.17,
    color: Resources.Colors.sea,
  },
  arrow: {
    position: 'absolute',
    left: 24,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Resources.Colors.brownishGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default RampInputForm
