import React, { useEffect, useRef, useState } from 'react'
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
import { NavigationView } from '../../common/NavigationView'
import { SelectItem } from '../../common/SelectPopup'
import Separator from '../../common/Separator'
import RampItem from './RampItem'
import {
  getPairName,
  useSwitchainMarketInfo,
} from '../../../hooks/useSwitchain'
import { MoonpayPopupView } from '../../common/MoonpayPopupView'
import usePending, { PendingData } from '../../../hooks/usePending'
import _ from 'lodash'
import { SwitchainPopupView } from '../../common/SwitchainPopupView'

const cryptoList: SelectItem[] = [
  { label: 'Bitcoin', value: 'BTC', logo: Resources.Images.logoBtc },
  { label: 'Ethereum', value: 'ETH', logo: Resources.Images.logoEth },
  { label: 'Tether', value: 'USDT', logo: Resources.Images.logoUsdt },
  { label: 'USD Coin', value: 'USDC', logo: Resources.Images.logoUsdc },
]

const DEVICE_WIDTH = Dimensions.get('window').width
const SLIDER_MARGIN = 12
const WIDTH_THRESHOLD = DEVICE_WIDTH - SLIDER_MARGIN * 2
const SEPARATOR_MARGIN = 20

const navigateSwitchain = (
  navigation: any,
  denom: string,
  withdraw?: boolean
) => {
  navigation.navigate('RampInputView', {
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
  withdraw?: boolean
}) => {
  const { marketInfo } = useSwitchainMarketInfo()

  const RenderRampItem = ({
    logo,
    title,
    denom,
    pending,
    withdraw,
  }: {
    logo: ImageSourcePropType
    title: string
    denom: string
    pending?: boolean
    withdraw?: boolean
  }) => (
    <RampItem
      key={`RampItem-${title}-${logo}`}
      logo={logo}
      title={title}
      subTitle={`1 ${denom} ≈ ${
        marketInfo ? getCryptoQuote(marketInfo, denom, withdraw) : `0`
      } ${Keychain.baseCurrencyDenom}`}
      onPress={() => navigateSwitchain(props.navigation, denom, props.withdraw)}
      pending={pending}
      withdraw={withdraw}
    />
  )

  return (
    <View
      key={`RampSelect-Tab${0}`}
      style={[
        { backgroundColor: Resources.Colors.darkBackground },
        { width: DEVICE_WIDTH - SLIDER_MARGIN },
      ]}
    >
      <View
        key={`RampSelect-Tab-View${0}`}
        style={{
          marginTop: TAB_ABS_TOP,
          marginLeft: SLIDER_MARGIN * 2,
          marginRight: SLIDER_MARGIN / 2,
        }}
      >
        <>
          {props.withdraw ? (
            <RampItem
              logo={Resources.Images.logoUst}
              logoStyle={{ width: 30, height: 30 }}
              title={'UST'}
              subTitle={'Terra'}
              onPress={() => {
                props.navigation.push('WithdrawView', { symbol: 'uusd' })
              }}
              pending={false}
            />
          ) : (
            <RampItem
              logo={Resources.Images.iconCreditCard}
              logoStyle={{ width: 26, height: 18 }}
              title={'Credit Card'}
              subTitle={'MoonPay'}
              onPress={() => props.moonpayDeposit()}
              pending={
                props.enableMoonpay !== undefined && !props.enableMoonpay
              }
            />
          )}
          <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        </>
        {_.map(cryptoList, (crypto, idx) => (
          <View key={`Crypto-${idx}`}>
            <RenderRampItem
              logo={crypto.logo}
              title={crypto.label}
              denom={crypto.value}
              withdraw={props.withdraw}
              pending={_.some(
                props.pendingData?.find(
                  (i) => i.key === getPairName(crypto.value, props.withdraw)
                )
              )}
            />
            {idx + 1 < cryptoList.length && (
              <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
            )}
          </View>
        ))}
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
      key={`RampSelect-Tab${1}`}
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
        <RampItem
          logo={Resources.Images.logoMoonpay}
          title={'Credit Card'}
          subTitle={'MoonPay'}
          onPress={() => props.moonpayDeposit()}
          pending={props.enableMoonpay !== undefined && !props.enableMoonpay}
        />
        {/* <Separator style={{ marginVertical: 20 }} /> */}
      </View>
    </View>
  )
}

const Tab2 = (props: { navigation: any }) => {
  const { marketInfo } = useSwitchainMarketInfo()

  const RenderRampItem = ({
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
    <RampItem
      logo={logo}
      title={title}
      subTitle={`1 ${denom} ≈ ${
        marketInfo ? getCryptoQuote(marketInfo, denom, withdraw) : `0`
      } ${Keychain.baseCurrencyDenom}`}
      onPress={() => navigateSwitchain(props.navigation, denom)}
    />
  )

  return (
    <View
      key={`RampSelect-Tab${2}`}
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
        <RenderRampItem
          logo={Resources.Images.logoBtc}
          title={'Bitcoin'}
          denom={'BTC'}
        />
        <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        <RenderRampItem
          logo={Resources.Images.logoEth}
          title={'Ethereum'}
          denom={'ETH'}
        />
        <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        <RenderRampItem
          logo={Resources.Images.logoUsdt}
          title={'Tether USDT'}
          denom={'USDT'}
        />
        <Separator style={{ marginVertical: SEPARATOR_MARGIN }} />
        <RenderRampItem
          logo={Resources.Images.logoUsdc}
          title={'Circle USDC'}
          denom={'USDC'}
        />
      </View>
    </View>
  )
}

const RampSelectView = (props: { route: any; navigation: any }) => {
  const insets = useSafeAreaInsets()
  const {
    pendingData,
    withdrawData,
    completeData,
    moonpay,
    checkSwitchainComplete,
  } = usePending()

  const TITLE_LEFT = 24
  const TITLE_TOP = 100 + insets.top

  const isWithdraw = props.route.params.withdraw ? true : false

  const viewArray = [
    <TabAll
      navigation={props.navigation}
      moonpayDeposit={moonpay.moonpayDeposit}
      enableMoonpay={moonpay.enableMoonpay}
      pendingData={isWithdraw ? withdrawData : pendingData}
      withdraw={isWithdraw}
    />,
    // <Tab1
    //   navigation={props.navigation}
    //   moonpayDeposit={moonpay.moonpayDeposit}
    //   enableMoonpay={moonpay.enableMoonpay}
    // />,
    // <Tab2 navigation={props.navigation} />,
  ]

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
          key={`RampSelect-sv${1}`}
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
          {viewArray}
        </Animated.ScrollView>

        <View
          style={{
            flexDirection: 'column',
            position: 'absolute',
            top: TITLE_TOP,
            left: TITLE_LEFT,
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

      {moonpay.showMoonpayDepositPopup && (
        <MoonpayPopupView
          onDismissPressed={() => {
            moonpay.setShowMoonpayDepositPopup(false)
          }}
          amount={moonpay.moonpayAmount}
          status={moonpay.moonpayStatus}
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

export default RampSelectView
