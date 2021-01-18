import React, { useContext, useEffect, useState } from 'react'
import { Image, Text, View } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Keychain from '../../../common/Keychain'
import * as Api from '../../../common/Apis/Api'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { NotificationContext } from '../../../common/provider/NotificationProvider'
import { NavigationView } from '../../common/NavigationView'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import { CommonActions } from '@react-navigation/native'

export function WalletInfoView(props: { navigation: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const { showNotification } = useContext(NotificationContext)
  const [address, setAddress] = useState('')
  const [email, setEmail] = useState('')
  const [loginType, setLoginType] = useState('')

  useEffect(() => {
    Api.getAddress().then((address) => {
      setAddress(address)
    })
    Keychain.getUserEmail().then((email) => {
      setEmail(email)
    })
    Keychain.getLoginType().then((type) => {
      setLoginType(type)
    })
  }, [])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: safeInsetTop,
      }}
    >
      <View style={{ flex: 1, paddingLeft: 24, paddingRight: 24 }}>
        <View
          style={{
            marginTop: 48 + 52,
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: Resources.Colors.darkGrey,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            style={{
              width: 20,
              height: 18,
            }}
            source={Resources.Images.iconWalletG18}
          />
        </View>
        <AddressView
          address={address}
          copyPressed={() => {
            Resources.setClipboard(address)
            showNotification(
              translations.walletInfoView.copied,
              Resources.Colors.brightTeal
            )
          }}
        />
        <EmailView email={email} loginType={loginType} />
        <View style={{ flex: 1 }} />
        <Logout
          logoutPressed={() => {
            Keychain.reset()
            props.navigation.dispatch(
              CommonActions.reset({
                index: 1,
                routes: [{ name: 'InitialView' }],
              })
            )
          }}
        />
        <View style={{ height: 17 + safeInsetBottom }} />
      </View>
      <NavigationView navigation={props.navigation} />
    </View>
  )
}

function AddressView(props: { address: string; copyPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View>
      <View
        style={{
          marginTop: 32,
          flexDirection: 'row',
          height: 14,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            flex: 1,
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            letterSpacing: -0.3,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {translations.walletInfoView.walletAddress}
        </Text>
        <TouchableOpacity
          style={{ height: 24, justifyContent: 'center' }}
          onPress={() => {
            props.copyPressed()
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.3,
              color: Resources.Colors.brightTeal,
            }}
          >
            {translations.walletInfoView.copy}
          </Text>
        </TouchableOpacity>
      </View>
      <Text
        style={{
          marginTop: 5,
          fontFamily: Resources.Fonts.book,
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 23,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {props.address}
      </Text>
    </View>
  )
}

function EmailView(props: { email: string; loginType: string }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        display: props.email != '' ? 'flex' : 'none',
      }}
    >
      <Text
        style={{
          marginTop: 40,
          fontFamily: Resources.Fonts.book,
          fontSize: 14,
          letterSpacing: -0.3,
          color: Resources.Colors.brownishGrey,
        }}
      >
        {props.loginType === 'google'
          ? translations.walletInfoView.googleAccount
          : props.loginType === 'facebook'
          ? translations.walletInfoView.facebookAccount
          : props.loginType === 'apple'
          ? translations.walletInfoView.appleAccount
          : translations.walletInfoView.linkedAccount}
      </Text>
      <Text
        style={{
          marginTop: 5,
          fontFamily: Resources.Fonts.book,
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 23,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {props.email}
      </Text>
    </View>
  )
}

function Logout(props: { logoutPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 31,
        height: 36,
      }}
      onPress={() => {
        props.logoutPressed()
      }}
    >
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 14,
          letterSpacing: -0.3,
          color: Resources.Colors.greyishBrown,
        }}
      >
        {translations.walletInfoView.logout}
      </Text>
      <Image
        style={{ marginLeft: 4, width: 18, height: 18 }}
        source={Resources.Images.logout}
      />
    </TouchableOpacity>
  )
}
