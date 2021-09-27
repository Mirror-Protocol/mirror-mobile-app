import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Animated,
  Dimensions,
  TouchableOpacity,
  Easing,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getCryptoQuote } from '../../../common/Apis/Switchain'
import * as Resources from '../../../common/Resources'
import * as Keychain from '../../../common/Keychain'
import * as Config from '../../../common/Apis/Config'
import { NavigationView } from '../../common/NavigationView'
import { SelectItem } from '../../common/SelectPopup'
import Separator from '../../common/Separator'
import OnRampItem from './OnRampItem'
import {
  getPairName,
  useSwitchainMarketInfo,
} from '../../../hooks/useSwitchain'
import { OnrampPopupView } from '../../common/OnrampPopupView'
import usePending, { PendingData } from '../../../hooks/usePending'
import _ from 'lodash'
import { SwitchainPopupView } from '../../common/SwitchainPopupView'
import { AddressPopupView } from '../../common/AddressPopupView'
import { LoadingContext } from '../../../common/provider/LoadingProvider'
import { launchBrowser } from '../../../common/InAppBrowserHelper'
import { encodeQueryData } from '../../../common/Utils'
import { TransakContext } from '../../../common/provider/TransakProvider'

const cryptoList: SelectItem[] = []
// [
//   { label: 'Bitcoin', value: 'BTC', logo: Resources.Images.logoBtc },
//   { label: 'Ethereum', value: 'ETH', logo: Resources.Images.logoEth },
//   { label: 'Tether', value: 'USDT', logo: Resources.Images.logoUsdt },
//   { label: 'USD Coin', value: 'USDC', logo: Resources.Images.logoUsdc },
// ]

const DEVICE_WIDTH = Dimensions.get('window').width
const SLIDER_MARGIN = 12
const WIDTH_THRESHOLD = DEVICE_WIDTH - SLIDER_MARGIN * 2
const SEPARATOR_MARGIN = 20

const navigateSwitchain = (
  navigation: any,
  denom: string,
  withdraw?: boolean
) => {
  navigation.navigate('OnRampInputView', {
    cryptoList: cryptoList,
    selected: cryptoList.find((i) => i.value === denom),
    withdraw,
  })
}

const TAB_ABS_TOP = 180 //278

const TabAll = (props: {
  navigation: any
  moonpayDeposit: () => void
  enableMoonpay?: boolean
  pendingData?: PendingData[]
  enableTransak?: boolean
  transakPartnerOrderId?: string
  onPressDeposit?: () => void
  withdraw?: boolean
}) => {
  // const { marketInfo } = useSwitchainMarketInfo()

  const { setLoading } = useContext(LoadingContext)

  const RenderSwitchainOnRampItem = ({
    logo,
    title,
    denom,
    pending,
    withdraw,
    enabled,
  }: {
    logo: ImageSourcePropType
    title: string
    denom: string
    pending?: boolean
    withdraw?: boolean
    enabled: boolean
  }) => (
    <OnRampItem
      key={`OnRampItem-${title}-${logo}`}
      logo={logo}
      title={title}
      subTitle={`1 ${denom} ≈ ${
        `0` //marketInfo ? getCryptoQuote(marketInfo, denom, withdraw) : `0`
      } ${Keychain.baseCurrencyDenom}`}
      onPress={() => navigateSwitchain(props.navigation, denom, props.withdraw)}
      pending={pending}
      withdraw={withdraw}
      enabled={enabled}
    />
  )

  return (
    <View
      key={`OnRampSelect-Tab${0}`}
      style={[
        { backgroundColor: Resources.Colors.darkBackground },
        { width: DEVICE_WIDTH - SLIDER_MARGIN },
      ]}
    >
      <View
        key={`OnRampSelect-Tab-View${0}`}
        style={{
          // marginTop: TAB_ABS_TOP,
          marginLeft: SLIDER_MARGIN * 2,
          marginRight: SLIDER_MARGIN / 2,
        }}
      >
        <>
          {props.withdraw ? (
            <OnRampItem
              logo={Resources.Images.logoUst}
              logoStyle={{ width: 30, height: 30 }}
              title={'UST'}
              subTitle={'Terra'}
              onPress={() => {
                props.navigation.push('WithdrawView', { symbol: 'uusd' })
              }}
              pending={false}
              enabled={true}
            />
          ) : (
            <>
              <OnRampItem
                logo={Resources.Images.iconDeposit}
                logoStyle={{ width: 26, height: 26 }}
                title={'Deposit'}
                subTitle={''}
                onPress={() => props.onPressDeposit && props.onPressDeposit()}
                pending={false}
                enabled={true}
              />
              <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
              <OnRampItem
                logo={Resources.Images.logoMoonpay}
                logoStyle={{ width: 26, height: 18 }}
                title={'MoonPay'}
                onPress={() => props.moonpayDeposit()}
                pending={
                  props.enableMoonpay !== undefined && !props.enableMoonpay
                }
                enabled={true}
              />
              <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
              <OnRampItem
                logo={Resources.Images.logoTransak}
                logoStyle={{ width: 26, height: 18 }}
                title={'Transak'}
                onPress={() => {
                  const onPressTransak = async () => {
                    const config = Config.isDev
                      ? Config.transakConfig.testnet
                      : Config.transakConfig.mainnet

                    const address = await Keychain.getDefaultAddress()
                    const email =
                      (await Keychain.getLoginType()) !== 'apple'
                        ? await Keychain.getUserEmail()
                        : ''
                    const query = encodeQueryData({
                      apiKey: config.apiKey,
                      environment: config.environment,
                      defaultCryptoCurrency: 'UST',
                      cryptoCurrencyList: 'UST',
                      cryptoCurrencyCode: 'UST',
                      networks: 'mainnet',
                      email: email,
                      walletAddress: address,
                      partnerOrderId: props.transakPartnerOrderId,
                    })
                    const url = `${config.url}?${query}`
                    console.log(url)
                    launchBrowser(url)
                  }

                  setLoading(true)
                  onPressTransak().finally(() => setLoading(false))
                }}
                pending={
                  props.enableTransak !== undefined && !props.enableTransak
                }
                enabled={true}
              />
              {/* <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
              <OnRampItem
                logo={Resources.Images.logoRamp}
                logoStyle={{ width: 26, height: 18 }}
                title={'Ramp'}
                onPress={() => {
                  const onPressRampNetwork = async () => {
                    const config = Config.rampNetworkConfig.testnet
                    const address = await Keychain.getDefaultAddress()
                    const email = await Keychain.getUserEmail()
                    const query = encodeQueryData({
                      hostApiKey: config.hostApiKey,
                      userAddress: address,
                      userEmailAddress: email,
                      swapAsset: 'TERRA_UST',
                      finalUrl: 'mirrorapp://onramp_ramp',
                    })
                    const url = `${config.url}?${query}`
                    launchBrowser(url)
                  }

                  setLoading(true)
                  onPressRampNetwork().finally(() => setLoading(false))
                }}
                pending={false}
                enabled={true}
              /> */}
            </>
          )}
          <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        </>
        {_.map(cryptoList, (crypto, idx) => (
          <View key={`Crypto-${idx}`}>
            <RenderSwitchainOnRampItem
              logo={crypto.logo}
              title={crypto.label}
              denom={crypto.value}
              withdraw={props.withdraw}
              enabled={false}
              pending={_.some(
                props.pendingData?.find(
                  (i) => i.key === getPairName(crypto.value, props.withdraw)
                )
              )}
            />
            {<Separator style={{ marginVertical: SEPARATOR_MARGIN }} />}
          </View>
        ))}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: Resources.Fonts.book,
              fontSize: 14,
              letterSpacing: -0.2,
              color: Resources.Colors.brownishGrey,
              marginBottom: 8,
            }}
          >{`For further inquiries, navigate to`}</Text>
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.2,
              color: Resources.Colors.veryLightPink,
            }}
          >{`Settings > Contact Us`}</Text>
        </View>
      </View>
    </View>
  )
}

const Tab1 = (props: {
  navigation: any
  moonpayDeposit: () => void
  enableMoonpay?: boolean
}) => {
  return (
    <View
      key={`OnRampSelect-Tab${1}`}
      style={[
        { backgroundColor: Resources.Colors.darkBackground },
        { width: DEVICE_WIDTH - SLIDER_MARGIN },
      ]}
    >
      <View
        style={{
          marginTop: TAB_ABS_TOP,
          marginLeft: SLIDER_MARGIN * 2,
          marginRight: SLIDER_MARGIN / 2,
        }}
      >
        <OnRampItem
          logo={Resources.Images.logoMoonpay}
          title={'Credit Card'}
          subTitle={'MoonPay'}
          onPress={() => props.moonpayDeposit()}
          pending={props.enableMoonpay !== undefined && !props.enableMoonpay}
          enabled={true}
        />
        {/* <Separator style={{ marginVertical: 20 }} /> */}
      </View>
    </View>
  )
}

const Tab2 = (props: { navigation: any }) => {
  const { marketInfo } = useSwitchainMarketInfo()

  const RenderOnRampItem = ({
    logo,
    title,
    denom,
    withdraw,
  }: {
    logo: ImageSourcePropType
    title: string
    denom: string
    withdraw?: boolean
  }) => (
    <OnRampItem
      logo={logo}
      title={title}
      subTitle={`1 ${denom} ≈ ${
        marketInfo ? getCryptoQuote(marketInfo, denom, withdraw) : `0`
      } ${Keychain.baseCurrencyDenom}`}
      onPress={() => navigateSwitchain(props.navigation, denom)}
      enabled={false}
    />
  )

  return (
    <View
      key={`OnRampSelect-Tab${2}`}
      style={[
        { backgroundColor: Resources.Colors.darkBackground },
        { width: DEVICE_WIDTH - SLIDER_MARGIN },
      ]}
    >
      <View
        style={{
          marginTop: TAB_ABS_TOP,
          marginLeft: SLIDER_MARGIN / 2,
          marginRight: SLIDER_MARGIN * 2,
        }}
      >
        <RenderOnRampItem
          logo={Resources.Images.logoBtc}
          title={'Bitcoin'}
          denom={'BTC'}
        />
        <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        <RenderOnRampItem
          logo={Resources.Images.logoEth}
          title={'Ethereum'}
          denom={'ETH'}
        />
        <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        <RenderOnRampItem
          logo={Resources.Images.logoUsdt}
          title={'Tether USDT'}
          denom={'USDT'}
        />
        <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        <RenderOnRampItem
          logo={Resources.Images.logoUsdc}
          title={'Circle USDC'}
          denom={'USDC'}
        />
      </View>
    </View>
  )
}

const OnRampSelectView = (props: { route: any; navigation: any }) => {
  const { setLoading } = useContext(LoadingContext)
  const insets = useSafeAreaInsets()
  const {
    pendingData,
    withdrawData,
    completeData,
    moonpay,
    checkSwitchainComplete,
  } = usePending()

  const transak = useContext(TransakContext)

  const TITLE_LEFT = 24
  const TITLE_TOP = 100 + insets.top

  const isWithdraw = props.route.params.withdraw ? true : false

  // const viewArray = [
  //   <TabAll
  //     navigation={props.navigation}
  //     moonpayDeposit={moonpay.moonpayDeposit}
  //     enableMoonpay={moonpay.enableMoonpay}
  //     pendingData={isWithdraw ? withdrawData : pendingData}
  //     withdraw={isWithdraw}
  //   />,
  //   <Tab1
  //     navigation={props.navigation}
  //     moonpayDeposit={moonpay.moonpayDeposit}
  //     enableMoonpay={moonpay.enableMoonpay}
  //   />,
  //   <Tab2 navigation={props.navigation} />,
  // ]

  const [layoutY, setLayoutY] = useState<number>(0)

  const [x1, setX1] = useState<number>(0)
  const [y1, setY1] = useState<number>(0)
  const [w1, setW1] = useState<number>(0)
  const [h1, setH1] = useState<number>(0)

  const [x2, setX2] = useState<number>(0)
  const [y2, setY2] = useState<number>(0)
  const [w2, setW2] = useState<number>(0)
  const [h2, setH2] = useState<number>(0)

  const scrollViewRef = useRef<ScrollView>(null)
  const scrollX = useRef(new Animated.Value(0)).current
  const [currenTab, setCurrentTab] = useState<number>(0)

  useEffect(() => {
    scrollX.addListener((state) => {
      const x = parseInt(state.value.toString())
      const w = parseInt(WIDTH_THRESHOLD.toString())

      if (x <= 0) {
        setCurrentTab(0)
      } else if (x >= w) {
        setCurrentTab(1)
      }
    })
  }, [])

  useEffect(() => {
    setLoading(moonpay.moonpayLoading)
  }, [moonpay.moonpayLoading])

  const sX = scrollX.interpolate({
    inputRange: [0, WIDTH_THRESHOLD],
    outputRange: [x1, x2],
    extrapolate: 'clamp',
  })
  const sW = scrollX.interpolate({
    inputRange: [0, WIDTH_THRESHOLD / 2, WIDTH_THRESHOLD],
    outputRange: [w1, w1 / 2 + w2, w2],
    extrapolate: 'clamp',
    easing: Easing.sin,
  })

  const selectTab = (tab: number): void => {
    switch (tab) {
      case 0:
        scrollViewRef.current?.scrollTo({ x: 0 })
        break
      case 1:
        scrollViewRef.current?.scrollTo({ x: WIDTH_THRESHOLD })
        break
    }
  }

  const [showAddressView, setShowAddressView] = useState<boolean>(false)

  return (
    <>
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          backgroundColor: Resources.Colors.darkBackground,
        }}
      >
        <Animated.ScrollView
          key={`OnRampSelect-sv${1}`}
          ref={scrollViewRef}
          overScrollMode={'never'}
          bounces={false}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
        >
          <ScrollView>
            <Text
              style={[
                styles.titleText,
                styles.titleTextLight,
                {
                  paddingTop: 63 + insets.top,
                  paddingBottom: 48,
                  paddingLeft: TITLE_LEFT,
                  marginBottom: 12,
                },
              ]}
            >
              {isWithdraw ? `Withdraw UST` : `Buy UST`}
              {/* {'Buy UST with'} */}
            </Text>
            <TabAll
              navigation={props.navigation}
              moonpayDeposit={moonpay.moonpayDeposit}
              enableMoonpay={moonpay.enableMoonpay}
              transakPartnerOrderId={transak.partnerOrderId}
              enableTransak={transak.enableTransak}
              pendingData={isWithdraw ? withdrawData : pendingData}
              onPressDeposit={() => setShowAddressView(true)}
              withdraw={isWithdraw}
            />
          </ScrollView>
        </Animated.ScrollView>

        {false && (
          <View
            style={{
              flex: 1,
              flexDirection: 'column',
              position: 'absolute',

              paddingTop: TITLE_TOP,
              paddingLeft: TITLE_LEFT,

              backgroundColor: Resources.Colors.darkBackground,
            }}
          >
            <Text
              style={[
                styles.titleText,
                styles.titleTextLight,
                { marginBottom: 12 },
              ]}
              onLayout={(e) => {
                setLayoutY(e.nativeEvent.layout.height + 12)
              }}
            >
              {isWithdraw ? `Withdraw UST` : `Buy UST`}
              {/* {'Buy UST with'} */}
            </Text>
            {false && (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => selectTab(0)}
                  onLayout={(e) => {
                    setX1(e.nativeEvent.layout.x + TITLE_LEFT)
                    setY1(e.nativeEvent.layout.y + TITLE_TOP)
                    setW1(e.nativeEvent.layout.width)
                    setH1(e.nativeEvent.layout.height)
                  }}
                >
                  <Text
                    style={[
                      styles.titleText,
                      currenTab === 0
                        ? styles.titleTextLight
                        : styles.titleTextDark,
                    ]}
                  >
                    {'FIAT'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.titleText, styles.titleTextDark]}>
                  {' or '}
                </Text>
                <TouchableOpacity
                  onPress={() => selectTab(1)}
                  onLayout={(e) => {
                    setX2(e.nativeEvent.layout.x + TITLE_LEFT)
                    setY2(e.nativeEvent.layout.y + TITLE_TOP)
                    setW2(e.nativeEvent.layout.width)
                    setH2(e.nativeEvent.layout.height)
                  }}
                >
                  <Text
                    style={[
                      styles.titleText,
                      currenTab === 1
                        ? styles.titleTextLight
                        : styles.titleTextDark,
                    ]}
                  >
                    {'CRYPTO'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {false && (
          <Animated.View
            style={{
              position: 'absolute',
              backgroundColor: Resources.Colors.brightTeal,
              top: layoutY + y1 + h1,
              width: sW,
              height: 3,
              borderRadius: 14.5,
              transform: [{ translateX: sX }],
            }}
          />
        )}
      </View>

      <NavigationView navigation={props.navigation} />

      {showAddressView && (
        <AddressPopupView
          onDismissPressed={() => {
            setShowAddressView(false)
          }}
        />
      )}
      {moonpay.showMoonpayDepositPopup && (
        <OnrampPopupView
          title={'MoonPay'}
          onDismissPressed={() => {
            moonpay.setShowMoonpayDepositPopup(false)
          }}
          amount={moonpay.moonpayAmount}
          status={moonpay.moonpayStatus}
          navigation={props.navigation}
          route={props.route}
        />
      )}
      {transak.showTransakDepositPopup &&
        !!transak.transakAmount &&
        !!transak.transakStatus && (
          <OnrampPopupView
            title={'Transak'}
            onDismissPressed={() => {
              transak.setShowTransakDepositPopup(false)
            }}
            amount={transak.transakAmount}
            status={transak.transakStatus}
            navigation={props.navigation}
            route={props.route}
          />
        )}
      {completeData.length > 0 &&
        completeData.map((i) => {
          return (
            <SwitchainPopupView
              key={i.key}
              onDismissPressed={() => {
                checkSwitchainComplete(i.key)
              }}
              from={i.from}
              to={i.to}
              fromAmount={i.fromAmount}
              toAmount={i.toAmount}
              state={i.state}
              navigation={props.navigation}
              route={props.route}
            />
          )
        })}
    </>
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
  titleTextDark: {
    color: Resources.Colors.greyishBrown,
  },
})

export default OnRampSelectView
