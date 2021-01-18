import React, { useState, useContext, useEffect, useRef } from 'react'
import { Text, View, StyleSheet, Image, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import { RectButton } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { NextButton } from './TradeInputView'
import { ProcessingType } from '../common/ProcessingView'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { SpreadPopupView } from '../common/SpreadPopupView'

export function TradeStep2View(props: {
  navigation: any
  type: string
  symbol: string
  setStep: (step: number) => void
  amount: BigNumber
}) {
  const { translations } = useContext(ConfigContext)
  const isBuy = props.type == 'buy'

  const [loaded, setLoaded] = useState(false)
  const [sectionTitle, setSectionTitle] = useState(['', '', ''])
  const [showSpreadView, setShowSpreadView] = useState(false)
  let confirmClick = useRef(false).current

  const [info, setInfo] = useState({
    price: new BigNumber(0),
    shares: new BigNumber(0),
    amount: new BigNumber(0),
    fee: new BigNumber(0),
    tax: new BigNumber(0),
    sum: new BigNumber(0),
  })

  const [nextEnable, setNextEnable] = useState(false)

  useEffect(() => {
    const titles = isBuy
      ? [
          translations.tradeStep2View.buyingPrice,
          translations.tradeStep2View.amount,
          translations.tradeStep2View.fees,
        ]
      : [
          translations.tradeStep2View.amount,
          translations.tradeStep2View.sellingPrice,
          translations.tradeStep2View.fees,
        ]
    setSectionTitle(titles)
  }, [props.type])

  useEffect(() => {
    load()
      .then((e) => {
        setLoaded(true)
      })
      .catch((error) => {
        setLoaded(true)
        setNextEnable(false)
        setInfo({
          price: new BigNumber(0),
          shares: new BigNumber(0),
          amount: new BigNumber(0),
          fee: new BigNumber(0),
          tax: new BigNumber(0),
          sum: new BigNumber(0),
        })
      })
  }, [])

  async function load() {
    setNextEnable(false)
    if (isBuy) {
      const _amount = props.amount

      const calculated: {
        amount: BigNumber
        fee: BigNumber
        tax: BigNumber
      } = await Api.calcBuyFeeTax(_amount, props.symbol)

      const totalFee = calculated.fee.plus(calculated.tax)
      const sum = calculated.amount.plus(totalFee)

      const simulated = await Api.buysellSimulate(
        true,
        props.symbol,
        calculated.amount
      )
      const return_amount = new BigNumber(simulated.return_amount)

      let price = new BigNumber(0)
      if (!return_amount.isEqualTo(0)) {
        price = calculated.amount.dividedBy(return_amount)
      }

      setInfo({
        price: price,
        shares: return_amount.dividedBy(1000000),
        amount: calculated.amount,
        fee: calculated.fee,
        tax: calculated.tax,
        sum: sum.dividedBy(1000000),
      })
      if (return_amount.isGreaterThan(0)) {
        setNextEnable(true)
      }
    } else {
      const _amount = props.amount as BigNumber

      const simulated = await Api.buysellSimulate(false, props.symbol, _amount)
      const return_amount = new BigNumber(simulated.return_amount)
      const sum = return_amount.minus(Api.fee)
      const price = return_amount.dividedBy(_amount)

      setInfo({
        price: price,
        shares: new BigNumber(0),
        amount: _amount,
        sum: Utils.getCutNumber(sum.dividedBy(1000000), 2),
        fee: Api.fee,
        tax: new BigNumber(0),
      })

      if (sum.isGreaterThan(0)) {
        setNextEnable(true)
      }
    }
  }

  return (
    <>
      <View
        style={{
          flex: 1,
          marginTop: 28,
          marginLeft: 24,
          marginRight: 24,
          display: loaded ? 'flex' : 'none',
        }}
      >
        <View style={{ borderRadius: 6, overflow: 'hidden' }}>
          {isBuy ? (
            <SectionHeader
              isBuy={isBuy}
              title={sectionTitle[0]}
              subtitle={translations.tradeStep2View.inclSpread}
              balance={Utils.getFormatted(info.price, 2)}
              denom={Keychain.baseCurrencyDenom}
            />
          ) : (
            <Section
              isBuy={isBuy}
              icon={null}
              title={sectionTitle[0]}
              balance={Utils.getFormatted(info.amount.dividedBy(1000000), 6)}
              denom={Utils.getDenom(props.symbol)}
            />
          )}
          <Section
            isBuy={isBuy}
            icon={
              isBuy
                ? Resources.Images.iconMultiplicationG
                : Resources.Images.iconMultiplicationB
            }
            title={sectionTitle[1]}
            balance={
              isBuy
                ? Utils.getFormatted(info.shares, 6)
                : Utils.getFormatted(info.price, 2)
            }
            denom={
              isBuy ? Utils.getDenom(props.symbol) : Keychain.baseCurrencyDenom
            }
          />
          <Section
            isBuy={isBuy}
            icon={
              isBuy ? Resources.Images.iconPlusG : Resources.Images.iconMinusB
            }
            title={sectionTitle[2]}
            balance={Utils.getFormatted(
              info.fee.plus(info.tax).dividedBy(1000000),
              2
            )}
            denom={Keychain.baseCurrencyDenom}
          />
          <SectionResult
            isBuy={isBuy}
            sum={info.sum}
            loaded={loaded}
            denom={Keychain.baseCurrencyDenom}
          />
        </View>
        <ResetButton
          isBuy={isBuy}
          bgColor={isBuy ? Resources.Colors.sea : Resources.Colors.darkGreyTwo}
          textColor={
            isBuy ? Resources.Colors.sea : Resources.Colors.greyishBrown
          }
          icon={isBuy ? Resources.Images.btnResetG : Resources.Images.btnResetW}
          setStep={props.setStep}
          setShowSpreadView={setShowSpreadView}
        />
        <View style={{ flex: 1 }} />
        <Notice
          icon={
            isBuy ? Resources.Images.iconNoticeW : Resources.Images.iconNoticeB
          }
          textColor={
            isBuy ? Resources.Colors.sea : Resources.Colors.greyishBrown
          }
        />
        <NextButton
          type={props.type}
          title={translations.tradeStep2View.confirm}
          enable={nextEnable}
          onPress={() => {
            if (!confirmClick) {
              confirmClick = true
              props.navigation.push('ProcessingView', {
                type: isBuy ? ProcessingType.Buy : ProcessingType.Sell,
                price: info.price.toString(),
                amount: info.amount.toString(),
                fee: info.fee.toString(),
                tax: info.tax.toString(),
                symbol: props.symbol,
                displayAmount: isBuy
                  ? info.shares.toString()
                  : info.sum.toString(),
                displaySymbol: isBuy ? props.symbol : Keychain.baseCurrency,
              })
            }
          }}
        />
      </View>
      {showSpreadView && (
        <SpreadPopupView
          onDismissPressed={() => {
            setShowSpreadView(false)
          }}
        />
      )}
    </>
  )
}

function SectionHeader(props: {
  isBuy: boolean
  title: string
  subtitle: string
  balance: string
  denom: string
}) {
  const color1 = props.isBuy
    ? Resources.Colors.aquamarine
    : Resources.Colors.darkBackground
  const color2 = props.isBuy
    ? Resources.Colors.sea
    : Resources.Colors.greyishBrown
  const color3 = props.isBuy
    ? Resources.Colors.dark
    : Resources.Colors.veryLightPink

  const styles = StyleSheet.create({
    box: {
      height: 78,
      backgroundColor: color1,
      flexDirection: 'row',
    },
    title: {
      textAlign: 'right',
      fontFamily: Resources.Fonts.medium,
      fontSize: 12,
      letterSpacing: -0.3,
      color: color2,
    },
    subtitle: {
      textAlign: 'right',
      marginTop: 4,
      fontFamily: Resources.Fonts.medium,
      fontSize: 10,
      letterSpacing: -0.3,
      color: color2,
    },
    box3: {
      marginTop: Platform.OS === 'ios' ? 11 : 4,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    amount: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 18,
      letterSpacing: -0.3,
      color: color3,
    },
    denom: {
      marginBottom: 1,
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
        <Text style={styles.subtitle}>{props.subtitle}</Text>
        <View style={styles.box3}>
          <Text style={styles.amount}>{props.balance}</Text>
          <Text style={styles.denom}>{props.denom}</Text>
        </View>
      </View>
    </View>
  )
}

function Section(props: {
  isBuy: boolean
  icon: any
  title: string
  balance: string
  denom: string
}) {
  const color1 = props.isBuy
    ? Resources.Colors.aquamarine
    : Resources.Colors.darkBackground
  const color2 = props.isBuy
    ? Resources.Colors.sea
    : Resources.Colors.greyishBrown
  const color3 = props.isBuy
    ? Resources.Colors.dark
    : Resources.Colors.veryLightPink

  const styles = StyleSheet.create({
    box: {
      height: 60,
      backgroundColor: color1,
      flexDirection: 'row',
    },
    icon: {
      marginTop: 21,
      marginLeft: 16,
      width: 18,
      height: 18,
    },
    title: {
      textAlign: 'right',
      fontFamily: Resources.Fonts.medium,
      fontSize: 12,
      letterSpacing: -0.3,
      color: color2,
    },
    box3: {
      marginTop: Platform.OS === 'ios' ? 7 : 0,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    amount: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 18,
      letterSpacing: -0.3,
      color: color3,
    },
    denom: {
      marginBottom: 1,
      fontFamily: Resources.Fonts.medium,
      fontSize: 10,
      letterSpacing: -0.3,
      color: color3,
    },
  })

  return (
    <View style={[styles.box, { marginTop: 1 }]}>
      {props.icon ? (
        <Image source={props.icon} style={styles.icon} />
      ) : (
        <View style={styles.icon} />
      )}
      <View style={{ flex: 1, marginTop: 13, marginRight: 24 }}>
        <Text style={styles.title}>{props.title}</Text>
        <View style={styles.box3}>
          <Text style={styles.amount}>{props.balance}</Text>
          <Text style={styles.denom}>{props.denom}</Text>
        </View>
      </View>
    </View>
  )
}

function SectionResult(props: {
  isBuy: boolean
  loaded: boolean
  sum: BigNumber
  denom: string
}) {
  const { translations } = useContext(ConfigContext)
  const color1 = props.isBuy ? Resources.Colors.white : Resources.Colors.white
  const color2 = props.isBuy ? Resources.Colors.dark : Resources.Colors.dark
  const icon = props.isBuy
    ? Resources.Images.iconEqualsW
    : Resources.Images.iconEqualsW

  const styles = StyleSheet.create({
    box2: {
      height: 60,
      flexDirection: 'row',
    },
    icon: {
      marginTop: 21,
      marginLeft: 16,
      width: 18,
      height: 18,
    },
    amount: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 18,
      letterSpacing: -0.3,
    },
    denom: {
      marginBottom: 1,
      fontFamily: Resources.Fonts.medium,
      fontSize: 10,
      letterSpacing: -0.3,
    },
  })

  return (
    <View style={[styles.box2, { backgroundColor: color1, marginTop: 1 }]}>
      <Image source={icon} style={styles.icon} />
      <View style={{ flex: 1, marginTop: 22, marginRight: 24 }}>
        <View
          style={{
            marginTop: Platform.OS === 'ios' ? 0 : -7,
          }}
        >
          {props.sum.isLessThanOrEqualTo(0) && props.loaded ? (
            <Text
              style={{
                textAlign: 'right',
                fontFamily: Resources.Fonts.medium,
                fontSize: 14,
                color: Resources.Colors.brightPink,
              }}
            >
              {translations.tradeStep2View.exceed}
            </Text>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              <Text style={[styles.amount, { color: color2 }]}>
                {props.sum.isGreaterThanOrEqualTo(0)
                  ? Utils.getFormatted(props.sum, 2)
                  : '-' + Utils.getFormatted(props.sum, 2)}
              </Text>
              <Text style={[styles.denom, { color: color2 }]}>
                {props.denom}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

function Notice(props: { icon: any; textColor: any }) {
  const { translations } = useContext(ConfigContext)
  return (
    <View>
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
          {translations.tradeStep2View.notice}
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
        {translations.tradeStep2View.noticedesc}
      </Text>
    </View>
  )
}

function ResetButton(props: {
  isBuy: boolean
  bgColor: any
  textColor: any
  icon: any
  setStep: (step: number) => void
  setShowSpreadView: (v: boolean) => void
}) {
  const { translations } = useContext(ConfigContext)

  return (
    <View style={{ marginTop: 32, flexDirection: 'row' }}>
      <RectButton
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingRight: 8,
          borderRadius: 12,
        }}
        onPress={() => {
          props.setStep(0)
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            backgroundColor: props.bgColor,
            borderRadius: 12,
          }}
        >
          <Image
            source={props.icon}
            style={{
              marginLeft: 6,
              marginTop: 6,
              width: 12,
              height: 12,
            }}
          />
        </View>
        <Text
          style={{
            marginLeft: 6,
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            letterSpacing: -0.3,
            color: props.textColor,
          }}
        >
          {props.isBuy
            ? translations.tradeStep2View.editBuyOrder
            : translations.tradeStep2View.editSellOrder}
        </Text>
      </RectButton>
      <View style={{ flex: 1 }} />
      {props.isBuy ? (
        <RectButton
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: -4,
            paddingLeft: 4,
            paddingRight: 4,
            borderRadius: 12,
          }}
          onPress={() => {
            props.setShowSpreadView(true)
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.3,
              color: props.textColor,
            }}
          >
            {translations.tradeStep2View.spread}
          </Text>
          <Image
            style={{
              marginLeft: 2,
              width: 12,
              height: 12,
            }}
            source={Resources.Images.iconQuestion}
          />
        </RectButton>
      ) : (
        <View />
      )}
    </View>
  )
}
