import React, {
  useState,
  useContext,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
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
import _ from 'lodash'

export function TradeStep2View(props: {
  navigation: any
  type: string
  symbol: string
  token: string
  setStep: (step: number) => void
  amount: BigNumber
}) {
  const { translations } = useContext(ConfigContext)
  const isBuy = props.type === 'buy'

  const [loaded, setLoaded] = useState(false)
  const [sectionTitle, setSectionTitle] = useState(['', '', ''])
  const [showSpreadView, setShowSpreadView] = useState(false)
  const [burnPositions, setBurnPositions] =
    useState<
      | {
          position: string
          amount: string
          collateralToken: string
          symbol: string
        }[]
      | undefined
    >(undefined)
  let confirmClick = useRef(false).current

  const [info, setInfo] = useState({
    price: new BigNumber(0),
    shares: new BigNumber(0),
    amount: new BigNumber(0),
    fee: new BigNumber(0),
    tax: new BigNumber(0),
    sum: new BigNumber(0),
  })

  const [nextEnable, setNextEnable] = useState<boolean>(false)
  const [feeEnough, setFeeEnough] = useState<boolean>(true)

  useEffect(() => {
    if (props.type === 'burn') {
      setSectionTitle([`BURN AMOUNT`, ``, translations.tradeStep2View.fees])
    } else {
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
    }
  }, [props.type])

  useEffect(() => {
    const initBurn = async () => {
      const endPrice = await Api.getEndPrice(props.token)

      if (endPrice) {
        const assetInfo = await Api.assetInfo(props.token)
        const maxAmount = new BigNumber(assetInfo.amount)
        const cdps = await Api.getDelistedCollateralPositions(props.token)

        let sortedCdps: CDP[] = []
        try {
          sortedCdps = [
            ...cdps.cdps
              .filter((cdp: CDP) => {
                return cdp.collateralToken === 'uusd'
              })
              .sort((a: CDP, b: CDP) => {
                return new BigNumber(a.mintAmount).lte(
                  new BigNumber(b.mintAmount)
                )
              }),
            ...cdps.cdps
              .filter((cdp: CDP) => {
                return cdp.collateralToken !== 'uusd'
              })
              .sort((a: CDP, b: CDP) => {
                return new BigNumber(a.mintAmount).lte(
                  new BigNumber(b.mintAmount)
                )
              }),
          ]
        } catch (e) {}

        let positions = []
        let amount = maxAmount
        for (let i = 0; i < sortedCdps.length; ++i) {
          const position = sortedCdps[i].id
          const collateralToken = sortedCdps[i].collateralToken
          const symbol =
            collateralToken === Keychain.baseCurrency
              ? Keychain.baseCurrencyDenom
              : await Api.getSymbol(sortedCdps[i].collateralToken)
          const mintAmount =
            collateralToken === Keychain.baseCurrency
              ? new BigNumber(sortedCdps[i].mintAmount)
              : new BigNumber(0)

          if (mintAmount.gte(amount)) {
            positions.push({
              position,
              amount: amount.toString(),
              collateralToken,
              symbol,
            })
          } else {
            positions.push({
              position,
              amount: mintAmount.toString(),
              collateralToken,
              symbol,
            })
          }
          amount = amount.minus(mintAmount)

          if (amount.lte(0)) {
            break
          }
        }
        setBurnPositions(positions)

        const sum = maxAmount
          .multipliedBy(endPrice)
          .minus(new BigNumber(Api.fee).times(positions.length))

        setInfo({
          price: new BigNumber(endPrice),
          shares: new BigNumber(0),
          amount: maxAmount,
          sum: Utils.getCutNumber(sum.dividedBy(1000000), 2),
          fee: new BigNumber(Api.fee).times(positions.length),
          tax: new BigNumber(0),
        })

        if (sum.isGreaterThan(0)) {
          setNextEnable(true)
        }
      }
    }

    if (props.type === 'burn') {
      initBurn()
        .then(() => {
          setNextEnable(true)
        })
        .catch((e) => {
          setNextEnable(false)
          //Sentry.captureException(e)
        })
        .finally(() => {
          setLoaded(true)
        })
    } else {
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
    }
  }, [])

  useEffect(() => {
    if (info.fee.gt(0)) {
      Api.getUstBalance().then((ustBalance) => {
        if (ustBalance.gte(info.fee)) {
          setFeeEnough(true)
        } else {
          setFeeEnough(false)
        }
      })
    }
  }, [info])

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
          {props.type !== 'burn' && (
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
                isBuy
                  ? Utils.getDenom(props.symbol)
                  : Keychain.baseCurrencyDenom
              }
            />
          )}
          <Section
            isBuy={isBuy}
            icon={
              props.type === 'burn'
                ? null
                : isBuy
                ? Resources.Images.iconPlusG
                : Resources.Images.iconMinusB
            }
            title={sectionTitle[2]}
            balance={Utils.getFormatted(
              info.fee.plus(info.tax).dividedBy(1000000),
              2
            )}
            denom={Keychain.baseCurrencyDenom}
          />
          {props.type === 'burn' ? (
            <SectionBurnResult
              loaded={loaded}
              price={info.price}
              burnPositions={burnPositions}
            />
          ) : (
            <SectionResult
              isBuy={isBuy}
              sum={info.sum}
              loaded={loaded}
              denom={Keychain.baseCurrencyDenom}
            />
          )}
        </View>

        {props.type !== 'burn' && (
          <ResetButton
            isBuy={isBuy}
            bgColor={
              isBuy ? Resources.Colors.sea : Resources.Colors.darkGreyTwo
            }
            textColor={
              isBuy ? Resources.Colors.sea : Resources.Colors.greyishBrown
            }
            icon={
              isBuy ? Resources.Images.btnResetG : Resources.Images.btnResetW
            }
            setStep={props.setStep}
            setShowSpreadView={setShowSpreadView}
          />
        )}
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
          title={
            feeEnough
              ? translations.tradeStep2View.confirm
              : translations.tradeStep2View.insufficientFunds
          }
          enable={nextEnable && feeEnough}
          onPress={() => {
            if (!confirmClick) {
              confirmClick = true
              props.navigation.push('ProcessingView', {
                type:
                  props.type === 'burn'
                    ? ProcessingType.Burn
                    : isBuy
                    ? ProcessingType.Buy
                    : ProcessingType.Sell,
                price: info.price.toString(),
                amount: info.amount.toString(),
                fee: info.fee.toString(),
                tax: info.tax.toString(),
                positions: burnPositions,
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
function SectionBurnResult(props: {
  loaded: boolean
  price: BigNumber
  burnPositions?: {
    position: string
    amount: string
    collateralToken: string
    symbol: string
  }[]
}) {
  if (props.burnPositions === undefined || props.price.isEqualTo(0)) {
    return null
  }

  const { translations } = useContext(ConfigContext)
  const color1 = Resources.Colors.white
  const color2 = Resources.Colors.dark

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

  const [calculatedPositions, setCalculatedPositions] = useState<
    { amount: string; symbol: string; token: string }[]
  >([])

  const calculate = async () => {
    let sum = new BigNumber(0)
    for (
      let i = 0;
      props.burnPositions && i < props.burnPositions?.length;
      ++i
    ) {
      sum = sum.plus(new BigNumber(props.burnPositions[i].amount))
    }
    sum = sum.dividedBy(1e6)

    const positions: { amount: string; symbol: string; token: string }[] = []
    for (
      let i = 0;
      props.burnPositions && i < props.burnPositions?.length;
      ++i
    ) {
      const position = props.burnPositions[i]
      const findPosition = positions.find((p) => p.symbol === position.symbol)
      if (findPosition) {
        findPosition.amount = new BigNumber(findPosition.amount)
          .plus(new BigNumber(position.amount))
          .toString()
      } else {
        positions.push({
          amount: position.amount,
          symbol: position.symbol,
          token: position.collateralToken,
        })
      }
    }

    for (
      let i = 0;
      props.burnPositions && i < props.burnPositions?.length;
      ++i
    ) {
      const position = positions[i]
      let calc
      if (position.symbol === 'UST') {
        calc = new BigNumber(position.amount).times(props.price)
      } else {
        const asset = await Api.assetInfo(position.token)
        calc = new BigNumber(props.price)
          .dividedBy(new BigNumber(asset.price))
          .times(position.amount)
      }
      position.amount = Utils.getFormatted(calc.dividedBy(1e6), 2, true)
    }
    setCalculatedPositions(positions)
  }

  useEffect(() => {
    calculate()
  }, [])

  return (
    <View style={[styles.box2, { backgroundColor: color1, marginTop: 1 }]}>
      <View style={{ flex: 1, marginTop: 22, marginRight: 24 }}>
        {props.loaded && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
            }}
          >
            {calculatedPositions.map((position, index) => {
              return (
                <>
                  <Text style={[styles.amount, { color: color2 }]}>
                    {Utils.getFormatted(new BigNumber(position.amount), 2)}
                  </Text>
                  <Text style={[styles.denom, { color: color2 }]}>
                    {position.symbol}
                  </Text>
                  {index < calculatedPositions.length - 1 && (
                    <Text
                      style={[styles.amount, { color: color2 }]}
                    >{` + `}</Text>
                  )}
                </>
              )
            })}
          </View>
        )}
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
        {props.sum.isLessThanOrEqualTo(0) && props.loaded ? (
          <Text
            style={{
              textAlign: 'right',
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              color: Resources.Colors.brightPink,
              includeFontPadding: false,
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
            <Text style={[styles.denom, { color: color2 }]}>{props.denom}</Text>
          </View>
        )}
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
