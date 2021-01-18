import React, { useState, useContext, useEffect, useRef } from 'react'
import { Text, View, Animated } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Api from '../../common/Apis/Api'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'
import { NotificationContext } from '../../common/provider/NotificationProvider'
import QRCode from 'react-native-qrcode-svg'
import { ConfigContext } from '../../common/provider/ConfigProvider'

export function AddressPopupView(props: { onDismissPressed: () => void }) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const { translations } = useContext(ConfigContext)
  const { showNotification } = useContext(NotificationContext)

  const [selected, setSelected] = useState(0)
  const [address, setAddress] = useState('')

  const duration = 200
  const bgOpacity = useRef(new Animated.Value(0)).current
  const windowBottom = useRef(new Animated.Value(-safeInsetBottom - 260))
    .current

  useEffect(() => {
    Api.getAddress().then((address) => {
      setAddress(address)
    })

    Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 0.9,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(windowBottom, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start()
  }, [])

  function dismissPressed() {
    Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(windowBottom, {
        toValue: -safeInsetBottom - 260,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      props.onDismissPressed()
    })
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: Resources.windowSize().width,
        height: Resources.windowSize().height,
      }}
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: Resources.Colors.darkGreyFour,
          opacity: bgOpacity,
        }}
      >
        <RectButton
          style={{ flex: 1 }}
          onPress={() => {
            dismissPressed()
          }}
        />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          bottom: windowBottom,
          width: Resources.windowSize().width,
          height: safeInsetBottom + 260,
        }}
      >
        <HeaderView
          selected={selected}
          setSelected={setSelected}
          dismissPressed={dismissPressed}
        />
        {selected == 0 ? (
          <AddressView
            address={address}
            onPressed={() => {
              Resources.setClipboard(address)
              showNotification(
                translations.addressPopupView.copied,
                Resources.Colors.brightTeal
              )
            }}
          />
        ) : (
          <QRCodeView address={address} />
        )}
      </Animated.View>
    </View>
  )
}

function HeaderView(props: {
  selected: number
  setSelected: any
  dismissPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        flexDirection: 'row',
        height: 68,
        backgroundColor: Resources.Colors.darkGreyTwo,
        borderRadius: 24,
      }}
    >
      <View style={{ width: 24 }} />
      <HeaderButton
        title={translations.addressPopupView.address}
        selected={props.selected == 0}
        onPressed={() => {
          props.setSelected(0)
        }}
      />
      <View style={{ width: 12 }} />
      <HeaderButton
        title={translations.addressPopupView.qrcode}
        selected={props.selected == 1}
        onPressed={() => {
          props.setSelected(1)
        }}
      />
      <View style={{ flex: 1 }} />
      <RectButton
        style={{ marginRight: 23, marginTop: 4, height: 36 }}
        onPress={() => {
          props.dismissPressed()
        }}
      >
        <Text
          style={{
            marginTop: 11,
            fontFamily: Resources.Fonts.book,
            fontSize: 12,
            letterSpacing: -0.1,
            color: Resources.Colors.brightTeal,
          }}
        >
          {translations.addressPopupView.done}
        </Text>
      </RectButton>
    </View>
  )
}

function HeaderButton(props: {
  title: string
  selected: boolean
  onPressed: () => void
}) {
  return (
    <TouchableOpacity style={{ marginTop: 16 }} onPress={props.onPressed}>
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 12,
          letterSpacing: -0.1,
          color: props.selected
            ? Resources.Colors.brightTeal
            : Resources.Colors.white,
        }}
      >
        {props.title}
      </Text>
      <View
        style={{
          marginTop: 2,
          height: 1,
          backgroundColor: props.selected
            ? Resources.Colors.brightTeal
            : 'transparent',
        }}
      />
    </TouchableOpacity>
  )
}

function AddressView(props: { address: string; onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        marginTop: -24,
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
      }}
    >
      <Text
        style={{
          marginLeft: 24,
          marginRight: 24,
          marginTop: 48,
          fontFamily: Resources.Fonts.book,
          fontSize: 24,
          lineHeight: 32,
          letterSpacing: -0.3,
          color: Resources.Colors.white,
        }}
      >
        {props.address}
      </Text>

      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <RectButton
          style={{
            height: 34,
            borderRadius: 17,
            width: 124,
            backgroundColor: Resources.Colors.brightTeal,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={props.onPressed}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.3,
              color: Resources.Colors.black,
            }}
          >
            {translations.addressPopupView.copy}
          </Text>
        </RectButton>
      </View>
    </View>
  )
}

function QRCodeView(props: { address: string }) {
  return (
    <View
      style={{
        marginTop: -24,
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
      }}
    >
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <View
          style={{
            width: 144,
            height: 144,
            borderRadius: 8,
            backgroundColor: Resources.Colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <QRCode
            value={props.address}
            size={112}
            color='black'
            backgroundColor='white'
          />
        </View>
      </View>
    </View>
  )
}
