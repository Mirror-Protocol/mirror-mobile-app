import React, { useState, useCallback, useContext, useRef } from 'react'
import { Text, View, Animated, Image, Platform } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Api from '../../../common/Apis/Api'
import { TouchableOpacity } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { LoadingContext } from '../../../common/provider/LoadingProvider'
import { useFocusEffect } from '@react-navigation/native'
import { AddressPopupView } from '../../common/AddressPopupView'
import { BlurView } from '@react-native-community/blur'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import { WalletSummaryTab1 } from './WalletSummaryTab1'
import { WalletSummaryTab2 } from './WalletSummaryTab2'
import ThrottleButton from '../../../component/ThrottleButton'
import usePending from '../../../hooks/usePending'
import { SwitchainPopupView } from '../../common/SwitchainPopupView'
import { MoonpayPopupView } from '../../common/MoonpayPopupView'

export function WalletSummaryView(props: { navigation: any; route: any }) {
  const { setLoading } = useContext(LoadingContext)

  const {
    withdrawData,
    pendingData,
    completeData,
    moonpay,
    checkSwitchainComplete,
  } = usePending()

  const [isLoaded, setLoaded] = useState(true)
  const [showAddressView, setShowAddressView] = useState(false)
  const [uusdTotal, setUusdTotal] = useState(new BigNumber(0))

  const [balances, setBalances] = useState(
    [] as {
      amount: BigNumber
      denom: string
      converted: BigNumber
    }[]
  )
  const [assets, setAssets] = useState([] as GQL_AssetList1[])

  useFocusEffect(
    useCallback(() => {
      load()
        .then(() => {
          if (isLoaded) {
            setLoaded(false)
          }
          setLoading(false)
        })
        .catch(() => {
          if (isLoaded) {
            setLoaded(false)
          }
          setLoading(false)
        })
    }, [isLoaded])
  )

  async function load() {
    if (isLoaded) {
      setLoading(true)
    }

    const _balances = await Api.getBalances()
    let balances: {
      amount: BigNumber
      denom: string
      converted: BigNumber
    }[] = []

    _balances.map((v) =>
      v.denom === 'uusd' ? balances.unshift(v) : balances.push(v)
    )

    let uusdTotal = new BigNumber(0)
    for (let i = 0; i < balances.length; i++) {
      const item = balances[i]
      const converted = new BigNumber(item.converted)
      uusdTotal = uusdTotal.plus(converted)
    }

    let assets = await Api.assetList(false)
    const assetBalances = await Api.getAssetBalances()
    assets = assets.map((item) => {
      for (let i = 0; i < assetBalances.length; i++) {
        const assetBalance = assetBalances[i]
        if (item.symbol == assetBalance.symbol) {
          item.amount = assetBalance.amount
          break
        }
      }
      return item
    })

    const balanceExist = assets
      .filter((item) => {
        return new BigNumber(item.amount).isGreaterThan(0)
      })
      .sort((item1, item2) => {
        return item1.symbol > item2.symbol ? 1 : 0
      })

    const balanceNone = assets
      .filter((item) => {
        return new BigNumber(item.amount).isLessThanOrEqualTo(0)
      })
      .sort((item1, item2) => {
        return item1.symbol > item2.symbol ? 1 : 0
      })

    assets = balanceExist
    for (let i = 0; i < balanceNone.length; i++) {
      assets.push(balanceNone[i])
    }

    setUusdTotal(uusdTotal)
    setBalances(balances)
    setAssets(assets)
  }

  function topupPressed() {
    props.navigation.navigate('RampStack', {
      screen: 'RampSelectView',
      params: { withdraw: false },
    })
  }

  function itemPressed(symbol: string) {
    props.navigation.push('WalletDetailView', { symbol: symbol })
  }

  function swapPressed(symbol: string) {
    props.navigation.navigate('SwapStack', {
      screen: 'SwapView',
      params: {
        symbol: symbol,
      },
    })
  }

  function depositPressed(symbol: string) {
    setShowAddressView(true)
  }

  function withdrawPressed(symbol: string) {
    props.navigation.navigate('RampStack', {
      screen: 'RampSelectView',
      params: { withdraw: true },
    })
  }

  function withdrawOtherBalancePressed(symbol: string) {
    props.navigation.push('WithdrawView', { symbol: symbol })
  }

  const scrollView = useRef(null as any)
  const [selectedTab, setTab] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current
  scrollX.addListener((e) => {
    const offset = 30
    const x = e.value
    if (
      parseInt(x.toString()) >=
      parseInt(Resources.windowSize().width.toString()) - offset
    ) {
      setTab(1)
    } else if (x <= 0 + offset) {
      setTab(0)
    } else {
    }
  })

  return (
    <View
      style={{
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      {isLoaded ? (
        <View />
      ) : (
        <Animated.ScrollView
          ref={(sv: any) => {
            scrollView.current = sv
          }}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <WalletSummaryTab1
            navigation={props.navigation}
            route={props.route}
            topupPressed={topupPressed}
            uusdTotal={uusdTotal}
            balances={balances}
            itemPressed={itemPressed}
            swapPressed={swapPressed}
            depositPressed={depositPressed}
            withdrawPressed={withdrawPressed}
            withdrawOtherBalancePressed={withdrawOtherBalancePressed}
            pendingData={pendingData}
            withdrawData={withdrawData}
          />
          <WalletSummaryTab2
            topupPressed={topupPressed}
            assets={assets}
            itemPressed={itemPressed}
          />
        </Animated.ScrollView>
      )}
      <Nav
        selectedTab={selectedTab}
        setTab={(index: number) => {
          if (scrollView.current) {
            const x = index != 0 ? Resources.windowSize().width : 0
            scrollView.current.scrollTo({
              x: x,
              y: 0,
              animated: true,
            })
          }
        }}
        settingPressed={() => {
          props.navigation.push('SettingStack')
        }}
        closePressed={() => {
          props.navigation.pop()
        }}
      />

      {showAddressView ? (
        <AddressPopupView
          onDismissPressed={() => {
            setShowAddressView(false)
          }}
        />
      ) : (
        <View />
      )}

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
    </View>
  )
}

function Nav(props: {
  settingPressed: () => void
  closePressed: () => void
  selectedTab: number
  setTab: (n: number) => void
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: safeInsetTop + 126,
      }}
    >
      {Platform.OS === 'android' ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            backgroundColor: Resources.Colors.darkBackground,
            opacity: 1,
          }}
        />
      ) : (
        <BlurView
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}
      <View
        style={{
          marginTop: safeInsetTop,
          paddingLeft: 24,
          paddingRight: 18,
          width: '100%',
          height: 52,
          flexDirection: 'row',
        }}
      >
        <Text
          style={{
            marginTop: 20,
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.2,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {translations.walletSummaryView.wallet}
        </Text>
        <View style={{ flex: 1 }} />
        <ThrottleButton
          type='TouchableOpacity'
          style={{
            marginLeft: 14,
            width: 36,
            height: 36,
            marginTop: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            props.settingPressed()
          }}
        >
          <Image
            style={{ width: 18, height: 18 }}
            source={Resources.Images.iconSettingW}
          />
        </ThrottleButton>
        <TouchableOpacity
          style={{
            marginLeft: 14,
            width: 36,
            height: 36,
            marginTop: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            props.closePressed()
          }}
        >
          <Image
            style={{ width: 18, height: 18 }}
            source={Resources.Images.btnClose16W}
          />
        </TouchableOpacity>
      </View>
      <CategoryView
        setTab={(index) => {
          props.setTab(index)
        }}
        selectedTab={props.selectedTab}
      />
    </View>
  )
}

function CategoryView(props: {
  setTab: (t: number) => void
  selectedTab: number
}) {
  return (
    <View
      style={{
        width: '100%',
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {props.selectedTab == 0 ? (
        <View
          style={{
            marginLeft: 24,
            marginRight: 24,
            flex: 1,
            height: 44,
            borderRadius: 22,
            backgroundColor: Resources.Colors.darkGreyFour,
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              width: Resources.windowSize().width / 2 - 26,
              height: 40,
              borderRadius: 20,
              backgroundColor: Resources.Colors.darkBackground,
              borderWidth: 1,
              borderColor: Resources.Colors.darkGreyTwo,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: Resources.Colors.veryLightPinkTwo,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
              }}
            >
              {'FUNDS'}
            </Text>
          </View>
          <ThrottleButton
            type='RectButton'
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              right: 2,
              width: Resources.windowSize().width / 2 - 26,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => {
              props.setTab(1)
            }}
          >
            <Text
              style={{
                color: Resources.Colors.greyishBrown,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
              }}
            >
              {'mASSET'}
            </Text>
          </ThrottleButton>
        </View>
      ) : (
        <View
          style={{
            marginLeft: 24,
            marginRight: 24,
            flex: 1,
            height: 44,
            borderRadius: 22,
            backgroundColor: Resources.Colors.darkGreyFour,
          }}
        >
          <ThrottleButton
            type='RectButton'
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              left: 2,
              width: Resources.windowSize().width / 2 - 26,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => {
              props.setTab(0)
            }}
          >
            <Text
              style={{
                color: Resources.Colors.greyishBrown,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
              }}
            >
              {'FUNDS'}
            </Text>
          </ThrottleButton>

          <View
            style={{
              position: 'absolute',
              top: 2,
              bottom: 2,
              right: 2,
              width: Resources.windowSize().width / 2 - 26,
              height: 40,
              borderRadius: 20,
              backgroundColor: Resources.Colors.darkBackground,
              borderWidth: 1,
              borderColor: Resources.Colors.darkGreyTwo,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: Resources.Colors.veryLightPinkTwo,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
              }}
            >
              {'mASSET'}
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}
