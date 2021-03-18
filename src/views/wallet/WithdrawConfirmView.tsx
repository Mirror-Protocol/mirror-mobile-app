import React, { useState, useCallback, useContext } from 'react'
import { Text, View, Image, StyleSheet } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { useFocusEffect } from '@react-navigation/native'
import { ProcessingType } from '../common/ProcessingView'
import { ConfigContext } from '../../common/provider/ConfigProvider'

export function WithdrawConfirmView(props: { route: any; navigation: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const address = props.route.params.address
  const amount = props.route.params.amount
  const memo = props.route.params.memo
  const symbol = props.route.params.symbol
  const ramp = props.route.params.ramp
  const rampPair = props.route.params.rampPair

  const [fee, setFee] = useState(new BigNumber(0))
  const [tax, setTax] = useState(new BigNumber(0))
  const [feeDenom, setFeeDenom] = useState('')

  const [feeEnough, setFeeEnough] = useState(false)

  useFocusEffect(
    useCallback(() => {
      calcFee()
    }, [])
  )

  async function calcFee() {
    let tax = new BigNumber(0)
    let fee = new BigNumber(0)
    let feeDenom = ''
    if (symbol == 'uluna') {
      fee = Api.fee
      feeDenom = symbol
      setFeeEnough(true)
    } else if (!symbol.toLowerCase().startsWith('m')) {
      fee = Api.feeFromDenom(symbol)
      const taxRate = await Api.getTaxRate()
      const taxCap = await Api.getTaxCap(symbol)
      tax = Utils.getCutNumber(
        BigNumber.min(
          new BigNumber(amount).multipliedBy(1000000).multipliedBy(taxRate),
          taxCap
        ),
        0
      )

      feeDenom = symbol
      setFeeEnough(true)
    } else {
      fee = Api.fee
      feeDenom = Keychain.baseCurrency
      const ustBalance = await Api.getUstBalance()
      if (ustBalance.isGreaterThanOrEqualTo(fee)) {
        setFeeEnough(true)
      } else {
        setFeeEnough(false)
      }
    }

    setFeeDenom(feeDenom)
    setFee(fee)
    setTax(tax)
  }

  function withdrawPressed() {
    props.navigation.push('ProcessingView', {
      type: ProcessingType.Withdraw,
      amount: Utils.getCutNumber(
        new BigNumber(amount).multipliedBy(1000000),
        0
      ).toString(),
      symbol: symbol,

      displayAmount: Utils.getCutNumber(
        new BigNumber(amount).multipliedBy(1000000),
        0
      )
        .dividedBy(1000000)
        .toString(),
      displaySymbol: symbol,

      address: address,
      fee: fee.toString(),
      feeDenom: feeDenom,
      tax: tax.toString(),
      memo: memo,
      rampPair: rampPair,
    })
  }
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.brightTeal,
        paddingTop: safeInsetTop,
      }}
    >
      <Nav
        backPressed={() => {
          if (ramp) {
            Keychain.removeSwitchainOffer(rampPair)
            props.navigation.popToTop()
          } else {
            props.navigation.pop()
          }
        }}
      />

      <View
        style={{
          marginLeft: 24,
          marginRight: 24,
          overflow: 'hidden',
          borderRadius: 8,
          marginTop: 48,
        }}
      >
        <Section
          title={
            symbol.startsWith('m')
              ? translations.withdrawDetailView.quantity
              : translations.withdrawDetailView.amount
          }
          subtitle1={Utils.getFormatted(amount, 6, true)}
          subtitle2={Utils.getDenom(symbol)}
        />
        <Section
          title={translations.withdrawDetailView.fees}
          subtitle1={Utils.getFormatted(
            fee.plus(tax).dividedBy(1000000),
            2,
            true
          )}
          subtitle2={Utils.getDenom(feeDenom)}
        />
        <Section
          title={translations.withdrawDetailView.address}
          subtitle1={address}
          subtitle2=''
        />
        <Section
          title={translations.withdrawDetailView.memo}
          subtitle1={memo}
          subtitle2=''
        />
      </View>

      <View style={{ flex: 1 }} />
      <Notice
        icon={Resources.Images.iconNoticeW}
        textColor={Resources.Colors.sea}
      />
      <RectButton
        enabled={feeEnough}
        style={{
          marginLeft: 24,
          marginRight: 24,
          marginBottom: 10 + safeInsetBottom,
          height: 48,
          backgroundColor: feeEnough
            ? Resources.Colors.darkGreyThree
            : 'rgba(0,0,0,0.2)',
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          withdrawPressed()
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.5,
            color: Resources.Colors.brightTeal,
          }}
        >
          {feeEnough
            ? translations.withdrawDetailView.withdraw
            : translations.withdrawDetailView.insufficientFunds}
        </Text>
      </RectButton>
    </View>
  )
}

function Section(props: {
  title: string
  subtitle1: string
  subtitle2: string
}) {
  const color1 = Resources.Colors.aquamarine
  const color2 = Resources.Colors.sea
  const color3 = Resources.Colors.dark

  const styles = StyleSheet.create({
    box: {
      minHeight: 60,
      backgroundColor: color1,
      flexDirection: 'row',
      paddingLeft: 24,
      paddingRight: 24,
    },
    title: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 12,
      letterSpacing: -0.3,
      color: color2,
    },
    box3: {
      marginTop: 7,
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    subtitle1: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 18,
      letterSpacing: -0.3,
      color: color3,
      marginBottom: 10,
    },
    subtitle2: {
      marginBottom: 11,
      fontFamily: Resources.Fonts.medium,
      fontSize: 10,
      letterSpacing: -0.3,
      color: color3,
    },
  })

  return (
    <View style={[styles.box, { marginTop: 1 }]}>
      <View style={{ flex: 1, marginTop: 13, marginRight: 24 }}>
        <Text style={styles.title}>{props.title}</Text>
        {props.subtitle2 == '' ? (
          <View style={styles.box3}>
            <Text style={styles.subtitle1}>{props.subtitle1}</Text>
          </View>
        ) : (
          <View style={styles.box3}>
            <Text style={styles.subtitle1}>{props.subtitle1}</Text>
            <Text style={styles.subtitle2}>{props.subtitle2}</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function Notice(props: { icon: any; textColor: any }) {
  const { translations } = useContext(ConfigContext)
  return (
    <View style={{ marginLeft: 24, marginRight: 24, marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Image source={props.icon} style={{ width: 15, height: 13 }} />
        <Text
          style={{
            marginLeft: 4,
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.3,
            color: props.textColor,
          }}
        >
          {translations.withdrawDetailView.notice}
        </Text>
      </View>
      <Text
        style={{
          marginTop: 7,
          marginBottom: 1,
          fontFamily: Resources.Fonts.book,
          fontSize: 12,
          lineHeight: 16,
          letterSpacing: -0.4,
          color: props.textColor,
        }}
      >
        {translations.withdrawDetailView.noticedesc}
      </Text>
    </View>
  )
}

function Nav(props: { backPressed: () => void }) {
  return (
    <View style={{ flexDirection: 'row', height: 52 }}>
      <TouchableOpacity
        style={{
          width: 36,
          height: 36,
          marginLeft: 11,
          marginTop: 10,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          props.backPressed()
        }}
      >
        <Image
          source={Resources.Images.btnBackB}
          style={{ width: 10, height: 18 }}
        />
      </TouchableOpacity>
    </View>
  )
}
