import 'react-native-gesture-handler'
import React, { useContext, useEffect, useState } from 'react'
import { View, StatusBar, Platform, NativeModules, Alert } from 'react-native'

import { NavigationContainer } from '@react-navigation/native'
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
import { RecoveryWalletView } from './src/views/init/RecoveryWalletView'
import { SelectWalletView } from './src/views/init/SelectWalletView'
import RampSelectView from './src/views/wallet/ramp/RampSelectView'
import RampInputView from './src/views/wallet/ramp/RampInputView'
import RampOfferView from './src/views/wallet/ramp/RampOfferView'
import RampErrorView from './src/views/wallet/ramp/RampErrorView'
import RampQrView from './src/views/wallet/ramp/RampQrView'
import RampItemDetailView from './src/views/wallet/ramp/RampItemDetailView'

const App = () => {
  const [isLoadingChainConfig, setLoadingChainConfig] = useState(false)
  const [isRooted, setRooted] = useState<boolean | undefined>(
    Config.isDev ? false : undefined
  )

  const initChain = async () => {
    Keychain.getCurrentChain().then((chain) => {
      Config.setCurrentChain(chain)

      Keychain.getCurrentTorusNet().then((net) => {
        Config.setTorusNetwork(net)

        api.setGasPrice()
        api.setTerra()
        gql.setGql()
        setLoadingChainConfig(true)
      })
    })
  }

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

    const connectUser = async () => {
      try {
        if (await Keychain.isHaveAddress()) {
          await api.setConnect(undefined)
        }
      } catch (e) {}
    }

    if (isRooted === false) {
      initChain().then(() => {
        connectUser()
      })
    }
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
            <ContainerView />
          </NotificationProvider>
        </LoadingProvider>
      </SafeAreaProvider>
    </ConfigProvider>
  )
}

function ContainerView() {
  const { isShowNotification } = useContext(NotificationContext)
  const { isLoading } = useContext(LoadingContext)

  const linking = {
    prefixes: ['mirrorapp://'],
    config: {
      screens: {
        InitialView: {
          path: 'torusauth',
        },
      },
    },
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
      </NavigationContainer>
      {isShowNotification ? <NotificationView /> : <View />}
      {isLoading ? <LoadingView /> : <View />}
    </View>
  )
}

const androidTransition = Platform.OS === 'android' && {
  ...TransitionPresets.RevealFromBottomAndroid,
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
        name='RecoveryWalletView'
        component={RecoveryWalletView}
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
        name='RampStack'
        component={RampStack}
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
        name='RampItemDetailView'
        component={RampItemDetailView}
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

function RampStack() {
  const RampStack = createStackNavigator()
  return (
    <RampStack.Navigator screenOptions={{ ...androidTransition }}>
      <RampStack.Screen
        name='RampSelectView'
        component={RampSelectView}
        options={{ headerShown: false }}
      />
      <RampStack.Screen
        name='RampInputView'
        component={RampInputView}
        options={{ headerShown: false }}
      />
      <RampStack.Screen
        name='RampOfferView'
        component={RampOfferView}
        options={{ headerShown: false }}
      />
      <RampStack.Screen
        name='RampErrorView'
        component={RampErrorView}
        options={{ headerShown: false }}
      />
      <RampStack.Screen
        name='RampQrView'
        component={RampQrView}
        options={{ headerShown: false }}
      />
      <RampStack.Screen
        name='WithdrawView'
        component={WithdrawView}
        options={{ headerShown: false }}
      />
      <RampStack.Screen
        name='WithdrawConfirmView'
        component={WithdrawConfirmView}
        options={{ headerShown: false }}
      />
    </RampStack.Navigator>
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
