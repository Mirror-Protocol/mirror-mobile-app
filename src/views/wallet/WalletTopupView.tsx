import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  Animated,
  AppState,
  AppStateStatus,
  Easing,
  Platform,
  Text,
  View,
} from 'react-native'
import * as Resources from '../../common/Resources'
import * as Keychain from '../../common/Keychain'
import * as Api from '../../common/Apis/Api'
import * as gql from '../../common/Apis/gql'

import { ScrollView } from 'react-native-gesture-handler'
import { AddressPopupView } from '../common/AddressPopupView'
import { launchBrowser } from '../../common/InAppBrowserHelper'

import { NavigationView } from '../common/NavigationView'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import ThrottleButton from '../../component/ThrottleButton'
import { MoonpayPopupView } from '../common/MoonpayPopupView'

export function WalletTopupView(props: { navigation: any; route: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const [showAddressView, setShowAddressView] = useState(false)

  const [enableMoonpay, setEnableMoonpay] = useState<boolean | undefined>(
    undefined
  )
  const [showMoonpayDepositPopup, setShowMoonpayDepositPopup] = useState(false)
  const [moonpayStatus, setMoonpayStatus] = useState<'completed' | 'failed'>(
    'completed'
  )
  const [moonpayAmount, setMoonpayAmount] = useState('')

  const getMoonpayStatus = async () => {
    const showPopup = (status: 'completed' | 'failed', amount: string) => {
      setMoonpayStatus(status)
      setMoonpayAmount(amount)

      setShowMoonpayDepositPopup(true)

      Keychain.clearMoonpayLastOpen()
      Keychain.clearMoonpayLastStatus()
    }
    const checkStatus = async (status: string, amount: string) => {
      if (status === null || status === undefined) {
        setEnableMoonpay(true)
      } else if (status === 'failed' || status === 'completed') {
        setEnableMoonpay(true)

        await Keychain.getMoonpayLastStatus().then((lastStatus) => {
          if (lastStatus !== '' && lastStatus !== status) {
            showPopup(status, amount)
          }
        })
      } else {
        setEnableMoonpay(false)
        Keychain.setMoonpayLastStatus(status)
      }
    }
    const checkCompleteDate = async (
      status: string,
      amount: string,
      historyDateString: string
    ) => {
      await Keychain.getMoonpayLastOpen().then(async (lastOpenTimestamp) => {
        if (lastOpenTimestamp === '') {
          return
        }
        if (status !== 'completed' && status !== 'failed') {
          return
        }

        await Keychain.getMoonpayLastStatus().then(async (lastStatus) => {
          const historyDate = new Date(historyDateString).getTime()
          const lastOpenDate = parseInt(lastOpenTimestamp)
          if (historyDate > lastOpenDate && lastStatus === '') {
            showPopup(status, amount)
          }
        })
      })
    }

    Api.getAddress().then((address) => {
      gql.getMoonpayHistory(address).then(async (data) => {
        const status = data.moonpayHistory[0]?.status
        const amount = data.moonpayHistory[0]?.baseCurrencyAmount
        await checkCompleteDate(
          status,
          amount,
          data.moonpayHistory[0]?.createdAt
        )
        await checkStatus(status, amount)
      })
    })
  }

  const moonpayDeposit = () => {
    Api.getMoonpayUrl(null).then((url) => {
      launchBrowser(url).then(() => {
        getMoonpayStatus()
      })

      const openDate = new Date().getTime()
      Keychain.setMoonpayLastOpen(openDate.toString())
    })
  }

  useEffect(() => {
    getMoonpayStatus()

    const resumeAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        getMoonpayStatus()
      }
    }
    AppState.addEventListener('change', resumeAppState)

    return () => {
      AppState.removeEventListener('change', resumeAppState)
    }
  }, [])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: safeInsetTop,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ height: 52 }} />
        <Text
          style={{
            marginLeft: 24,
            marginTop: 48,
            marginBottom: 32,
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.5,
            color: Resources.Colors.white,
          }}
        >
          {translations.walletTopupView.deposit +
            ' ' +
            Keychain.baseCurrencyDenom}
        </Text>

        <CardView
          title={'Terra'}
          subtitle={Keychain.baseCurrencyDenom}
          onPress={() => {
            setShowAddressView(true)
          }}
          enableDeposit={true}
        />
        <CardView
          title={'MoonPay'}
          subtitle={'USD'}
          onPress={() => moonpayDeposit()}
          enableDeposit={enableMoonpay}
        />
      </ScrollView>

      <NavigationView navigation={props.navigation} />

      {showAddressView && (
        <AddressPopupView
          onDismissPressed={() => {
            setShowAddressView(false)
          }}
        />
      )}

      {showMoonpayDepositPopup && (
        <MoonpayPopupView
          onDismissPressed={() => {
            setShowMoonpayDepositPopup(false)
          }}
          amount={moonpayAmount}
          status={moonpayStatus}
          navigation={props.navigation}
          route={props.route}
        />
      )}
    </View>
  )
}

function CardView(props: {
  title: string
  subtitle: string
  onPress: () => void
  enableDeposit?: boolean
}) {
  const { translations } = useContext(ConfigContext)

  const moonpayProgressAnimW = useRef(new Animated.Value(0)).current
  const moonpayProgressAnimL = useRef(new Animated.Value(0)).current
  useEffect(() => {
    const w = 44
    const duration = 1000
    const delay = 100

    const anim = Animated.parallel([
      Animated.sequence([
        Animated.timing(moonpayProgressAnimW, {
          toValue: w,
          easing: Easing.in(Easing.exp),
          duration: duration,
          delay: delay,
          useNativeDriver: false,
        }),
        Animated.timing(moonpayProgressAnimW, {
          toValue: 0,
          easing: Easing.out(Easing.exp),
          duration: duration,
          delay: delay,
          useNativeDriver: false,
        }),
      ]),
      Animated.sequence([
        Animated.timing(moonpayProgressAnimL, {
          toValue: 0,
          easing: Easing.in(Easing.exp),
          duration: duration,
          delay: delay,
          useNativeDriver: false,
        }),
        Animated.timing(moonpayProgressAnimL, {
          toValue: w,
          easing: Easing.out(Easing.exp),
          duration: duration,
          delay: delay,
          useNativeDriver: false,
        }),
      ]),
    ])
    Animated.loop(anim).start()
  }, [])

  return (
    <ThrottleButton
      type='TouchableOpacity'
      style={{
        height: 104,
        paddingLeft: 21,
        paddingRight: 24,
        flexDirection: 'row',
      }}
      onPress={() => {
        props.enableDeposit && props.onPress()
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            marginLeft: 3,
            marginTop: Platform.OS === 'ios' ? 7 : 0,
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            letterSpacing: -0.3,
            color: Resources.Colors.brightTeal,
          }}
        >
          {props.title}
        </Text>
        <Text
          style={{
            marginTop: Platform.OS === 'ios' ? 1 : -6,
            fontFamily: Resources.Fonts.bold,
            fontSize: 42,
            letterSpacing: -1,
            color: Resources.Colors.darkGrey,
          }}
        >
          {props.subtitle}
        </Text>
      </View>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor:
            props.enableDeposit === undefined
              ? 'rgba(0, 237, 199, 0.1)'
              : props.enableDeposit === true
              ? Resources.Colors.brightTeal
              : 'rgb(31, 59, 54)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.3,
            color:
              props.enableDeposit === undefined
                ? 'rgb(27, 27, 29)'
                : props.enableDeposit === true
                ? Resources.Colors.black
                : Resources.Colors.brightTeal,
          }}
        >
          {props.enableDeposit === undefined
            ? translations.walletTopupView.deposit
            : props.enableDeposit === true
            ? translations.walletTopupView.deposit
            : translations.walletTopupView.pending}
        </Text>
        {props.enableDeposit !== undefined && !props.enableDeposit && (
          <View
            style={{
              width: 44,
              height: 2,
              backgroundColor: Resources.Colors.darkBackground,
              borderRadius: 1.5,
              top: 6,
              overflow: 'hidden',
            }}
          >
            <Animated.View
              style={{
                left: moonpayProgressAnimL,
                width: moonpayProgressAnimW,
                height: 2,
                backgroundColor: Resources.Colors.brightTeal,
              }}
            />
          </View>
        )}
      </View>
    </ThrottleButton>
  )
}
