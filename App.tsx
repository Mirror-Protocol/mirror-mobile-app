import 'react-native-gesture-handler'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { View, StatusBar, Platform, NativeModules, Alert } from 'react-native'

import {
  LinkingOptions,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native'
import {
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack'
import { ConfigProvider } from './src/common/provider/ConfigProvider'
import * as Config from './src/common/Apis/Config'
import { Main } from './src/views/main/Main'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { InvestedDetailView } from './src/views/invested/InvestedDetailView'
import { TradeInputView } from './src/views/invested/TradeInputView'
import { WalletSummaryView } from './src/views/wallet/summary/WalletSummaryView'
import { OnboardingView } from './src/views/init/OnboardingView'
import { InitialView } from './src/views/init/InitialView'
import { PinSecurityView } from './src/views/common/PinSecurityView'
import { BioAuthView } from './src/views/init/BioAuthView'
import * as Resources from './src/common/Resources'
import {
  LoadingProvider,
  LoadingContext,
} from './src/common/provider/LoadingProvider'
import { LoadingView } from './src/views/common/LoadingView'
import {
  NotificationContext,
  NotificationProvider,
} from './src/common/provider/NotificationProvider'
import { NotificationView } from './src/views/common/NotificationView'
import { WithdrawView } from './src/views/wallet/WithdrawView'
import { SettingView } from './src/views/wallet/setting/SettingView'
import { PrivacyView } from './src/views/wallet/setting/PrivacyView'
import { WalletTopupView } from './src/views/wallet/WalletTopupView'
import { WalletDetailView } from './src/views/wallet/WalletDetailView'
import { WithdrawConfirmView } from './src/views/wallet/WithdrawConfirmView'
import { SwapView } from './src/views/wallet/SwapView'
import { ProcessingView } from './src/views/common/ProcessingView'
import { WalletInfoView } from './src/views/wallet/setting/WalletInfoView'
import { WalletActivityDetailView } from './src/views/wallet/history/WalletActivityDetailView'
import { AgreeView } from './src/views/init/AgreeView'
import { InvestedNewsView } from './src/views/invested/InvestedNewsView'
import SplashScreen from 'react-native-splash-screen'
import RNExitApp from 'react-native-exit-app'
import * as Keychain from './src/common/Keychain'

import 'react-native-url-polyfill/auto'
import * as gql from './src/common/Apis/gql'
import * as api from './src/common/Apis/Api'
import { VersionView } from './src/views/wallet/setting/VersionView'
import { RecoverSeedView } from './src/views/init/RecoverSeedView'
import { SelectWalletView } from './src/views/init/SelectWalletView'
import OnRampSelectView from './src/views/wallet/onramp/OnRampSelectView'
import OnRampInputView from './src/views/wallet/onramp/OnRampInputView'
import OnRampOfferView from './src/views/wallet/onramp/OnRampOfferView'
import OnRampErrorView from './src/views/wallet/onramp/OnRampErrorView'
import OnRampQrView from './src/views/wallet/onramp/OnRampQrView'
import OnRampItemDetailView from './src/views/wallet/onramp/OnRampItemDetailView'
import { RecoverQrView } from './src/views/init/RecoverQrView'
import { RecoverPasswordView } from './src/views/init/RecoverPasswordView'
import { RecoverPrivateKeyView } from './src/views/init/RecoverPrivateKeyView'
import { RecoverWalletView } from './src/views/init/RecoverWalletView'
import { TransakProvider } from './src/common/provider/TransakProvider'
import { initRemoteConfig } from './src/common/RemoteConfig'
import {
  QueueContext,
  QueueProvider,
} from './src/common/provider/QueueProvider'
import QueueButton from './src/views/common/QueueButton'

const App = () => {
  const [isLoadingChainConfig, setLoadingChainConfig] = useState(false)
  const [isRooted, setRooted] = useState(Config.isDev ? false : undefined)

  useEffect(() => {
    initRemoteConfig()
  }, [])

  useEffect(() => {
    SplashScreen.hide()

    if (isRooted === undefined) {
      NativeModules.RootChecker.isDeviceRooted().then((ret: boolean) => {
        if (ret) {
          const rootMessage =
            'The device is rooted. For security reasons the application cannot be run from a rooted device.'

          Alert.alert(
            '',
            rootMessage,
            [{ text: 'OK', onPress: () => RNExitApp.exitApp() }],
            { cancelable: false }
          )
        }
        setRooted(ret)
      })
    }

    const initChain = async () => {
      const chain = await Keychain.getCurrentChain()
      Config.setCurrentChain(chain)

      const net = await Keychain.getCurrentTorusNet()
      Config.setTorusNetwork(net)

      await api.setGasPrice()
      api.setTerra()
      gql.setGql()
      setLoadingChainConfig(true)
    }

    const connectUser = async () => {
      try {
        if (await Keychain.isHaveAddress()) {
          await api.setConnect(undefined)
        }
      } catch (e) {}
    }

    const init = async () => {
      try {
        await Keychain.migratePreferences()
        await initChain()
        await connectUser()
      } catch (e) {}
    }
    isRooted === false && init()
  }, [isRooted])

  return !isLoadingChainConfig ? (
    <View style={{ flex: 1, backgroundColor: Resources.Colors.black }}>
      <StatusBar
        barStyle='light-content'
        backgroundColor={Resources.Colors.darkBackground}
      />
      <LoadingView />
    </View>
  ) : (
    <ConfigProvider>
      <StatusBar
        barStyle='light-content'
        backgroundColor={Resources.Colors.darkBackground}
      />
      <SafeAreaProvider>
        <LoadingProvider>
          <NotificationProvider>
            <TransakProvider>
              <QueueProvider>
                <ContainerView />
              </QueueProvider>
            </TransakProvider>
          </NotificationProvider>
        </LoadingProvider>
      </SafeAreaProvider>
    </ConfigProvider>
  )
}

function ContainerView() {
  const { isShowNotification } = useContext(NotificationContext)
  const { isLoading } = useContext(LoadingContext)
  const { hash, showTxQueued: txQueued } = useContext(QueueContext)

  const linking: LinkingOptions = {
    prefixes: ['mirrorapp://'],
    config: {
      screens: {
        InitialView: {
          path: 'torusauth',
        },
      },
    },
  }

  const [currentRoute, setCurrentRoute] = useState<string>()
  const navigationRef = useRef<NavigationContainerRef>(null)
  const routeNameRef = useRef<string>()

  const ready = () => {
    try {
      routeNameRef.current = navigationRef?.current?.getCurrentRoute()?.name
    } catch (e) {}
  }

  const logScreen = async () => {
    try {
      const previousRouteName = routeNameRef.current
      const currentRouteName = navigationRef?.current?.getCurrentRoute()?.name

      if (!!currentRouteName && previousRouteName !== currentRouteName) {
        setCurrentRoute(currentRouteName)
      }

      routeNameRef.current = currentRouteName
    } catch (e) {}
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
      }}
    >
      <NavigationContainer linking={linking}>
        <SplashScreenStack />
        {/* {txQueued && <QueueButton />} */}
        <QueueButton currentRouteName={currentRoute} />
      </NavigationContainer>
      {isShowNotification ? <NotificationView /> : <View />}
      {isLoading ? <LoadingView /> : <View />}
    </View>
  )
}

const androidTransition = Platform.OS === 'android' && {
  ...TransitionPresets.RevealFromBottomAndroid,
  cardStyle: { backgroundColor: Resources.Colors.black },
}

function SplashScreenStack() {
  const SplashStack = createStackNavigator()

  const [skipOnboarding, setOnboarding] = useState<boolean | undefined>(
    undefined
  )
  Keychain.getSkipOnboarding().then((ret) => {
    setOnboarding(ret)
  })

  if (skipOnboarding === undefined) return null

  return (
    <SplashStack.Navigator
      mode='modal'
      screenOptions={{
        gestureEnabled: false,
        ...androidTransition,
      }}
      initialRouteName={skipOnboarding ? 'InitialView' : 'OnboardingView'}
    >
      <SplashStack.Screen
        name='OnboardingView'
        component={OnboardingView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='InitialView'
        component={InitialView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='RecoverWalletView'
        component={RecoverWalletView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='RecoverSeedView'
        component={RecoverSeedView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='RecoverQrView'
        component={RecoverQrView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='RecoverPrivateKeyView'
        component={RecoverPrivateKeyView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='RecoverPasswordView'
        component={RecoverPasswordView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='SelectWalletView'
        component={SelectWalletView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='InitialStack'
        component={InitialStack}
        options={{ headerShown: false, animationEnabled: false }}
      />

      <SplashStack.Screen
        name='MainStack'
        component={MainScreenStack}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='WalletStack'
        component={WalletStack}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='OnRampStack'
        component={OnRampStack}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='SwapStack'
        component={SwapStack}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='TradeInput'
        component={TradeInputView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='PinSecurityView'
        component={PinSecurityView}
        options={{ headerShown: false }}
      />

      <SplashStack.Screen
        name='ProcessingView'
        component={ProcessingView}
        options={{ headerShown: false }}
      />
    </SplashStack.Navigator>
  )
}

function InitialStack() {
  const Stack = createStackNavigator()
  return (
    <Stack.Navigator
      screenOptions={{
        ...androidTransition,
      }}
    >
      <Stack.Screen
        name='AgreeView'
        component={AgreeView}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name='PinSecurityView'
        component={PinSecurityView}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name='BioAuthView'
        component={BioAuthView}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </Stack.Navigator>
  )
}

function MainScreenStack() {
  const MainStack = createStackNavigator()
  return (
    <MainStack.Navigator
      screenOptions={{ cardOverlayEnabled: true, ...androidTransition }}
    >
      <MainStack.Screen
        name='Main'
        component={Main}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name='WalletTopupView'
        component={WalletTopupView}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name='InvestedDetail'
        component={InvestedDetailView}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name='InvestedNewsView'
        component={InvestedNewsView}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name='OnRampItemDetailView'
        component={OnRampItemDetailView}
        options={{ headerShown: false }}
      />
    </MainStack.Navigator>
  )
}

function WalletStack() {
  const WalletStack = createStackNavigator()
  return (
    <WalletStack.Navigator screenOptions={{ ...androidTransition }}>
      <WalletStack.Screen
        name='WalletSummary'
        component={WalletSummaryView}
        options={{ headerShown: false }}
      />
      <WalletStack.Screen
        name='WalletTopupView'
        component={WalletTopupView}
        options={{ headerShown: false }}
      />
      <WalletStack.Screen
        name='WalletDetailView'
        component={WalletDetailView}
        options={{ headerShown: false }}
      />
      <WalletStack.Screen
        name='WithdrawView'
        component={WithdrawView}
        options={{ headerShown: false }}
      />
      <WalletStack.Screen
        name='OnRampItemDetailView'
        component={OnRampItemDetailView}
        options={{ headerShown: false }}
      />
      <WalletStack.Screen
        name='WithdrawConfirmView'
        component={WithdrawConfirmView}
        options={{ headerShown: false }}
      />

      <WalletStack.Screen
        name='SettingStack'
        component={SettingStack}
        options={{ headerShown: false }}
      />

      <WalletStack.Screen
        name='WalletActivityDetailView'
        component={WalletActivityDetailView}
        options={{ headerShown: false }}
      />
    </WalletStack.Navigator>
  )
}

function OnRampStack() {
  const OnRampStack = createStackNavigator()
  return (
    <OnRampStack.Navigator screenOptions={{ ...androidTransition }}>
      <OnRampStack.Screen
        name='OnRampSelectView'
        component={OnRampSelectView}
        options={{ headerShown: false }}
      />
      <OnRampStack.Screen
        name='OnRampInputView'
        component={OnRampInputView}
        options={{ headerShown: false }}
      />
      <OnRampStack.Screen
        name='OnRampOfferView'
        component={OnRampOfferView}
        options={{ headerShown: false }}
      />
      <OnRampStack.Screen
        name='OnRampErrorView'
        component={OnRampErrorView}
        options={{ headerShown: false }}
      />
      <OnRampStack.Screen
        name='OnRampQrView'
        component={OnRampQrView}
        options={{ headerShown: false }}
      />
      <OnRampStack.Screen
        name='WithdrawView'
        component={WithdrawView}
        options={{ headerShown: false }}
      />
      <OnRampStack.Screen
        name='WithdrawConfirmView'
        component={WithdrawConfirmView}
        options={{ headerShown: false }}
      />
    </OnRampStack.Navigator>
  )
}

function SwapStack() {
  const Stack = createStackNavigator()
  return (
    <Stack.Navigator mode='modal' screenOptions={{ ...androidTransition }}>
      <Stack.Screen
        name='SwapView'
        component={SwapView}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

function SettingStack() {
  const Stack = createStackNavigator()
  return (
    <Stack.Navigator screenOptions={{ ...androidTransition }}>
      <Stack.Screen
        name='SettingView'
        component={SettingView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='PrivacyView'
        component={PrivacyView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='WalletInfoView'
        component={WalletInfoView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name='VersionView'
        component={VersionView}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

export default App
