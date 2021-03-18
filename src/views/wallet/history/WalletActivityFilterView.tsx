import React, { useState, useEffect, useRef, useContext } from 'react'
import { Text, View, Animated, Image, Platform } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Api from '../../../common/Apis/Api'
import * as Keychain from '../../../common/Keychain'
import { RectButton, TouchableOpacity } from 'react-native-gesture-handler'
import { ConfigContext } from '../../../common/provider/ConfigProvider'

export function WalletActivityFilterView(props: {
  denom?: string
  selected: Api.HistoryType
  onDismissPressed: (v: any) => void
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const height =
    (props.denom?.startsWith(Keychain.baseCurrency)
      ? 478
      : props.denom?.startsWith('m')
      ? 428
      : props.denom?.toLowerCase() === 'mir'
      ? 328
      : 378) + (Platform.OS === 'android' ? 24 : 0)
  const duration = 200
  const bgOpacity = useRef(new Animated.Value(0)).current
  const windowBottom = useRef(new Animated.Value(-height)).current

  const [value, setValue] = useState(props.selected)

  useEffect(() => {
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

  function dismissPressed(value: any) {
    Animated.parallel([
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(windowBottom, {
        toValue: -height,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      props.onDismissPressed(value)
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
            dismissPressed(null)
          }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: windowBottom,
          width: Resources.windowSize().width,
          height: safeInsetBottom + height,
        }}
      >
        <Header
          dismissPressed={() => {
            dismissPressed(null)
          }}
        />

        <List
          denom={props.denom}
          value={value}
          setValue={(type: Api.HistoryType) => {
            setValue(type)
          }}
          dismissPressed={() => {
            dismissPressed(value)
          }}
        />
      </Animated.View>
    </View>
  )
}

function Header(props: { dismissPressed: () => void }) {
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
      <View style={{ marginLeft: 24, marginTop: 16 }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.1,
            color: Resources.Colors.white,
          }}
        >
          {translations.walletActivityFilterView.sortBy}
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <RectButton
        style={{ marginRight: 24, marginTop: 4, height: 36 }}
        onPress={() => {
          props.dismissPressed()
        }}
      >
        <Text
          style={{
            marginTop: 12,
            fontFamily: Resources.Fonts.book,
            fontSize: 12,
            letterSpacing: -0.1,
            color: Resources.Colors.brightTeal,
          }}
        >
          {translations.walletActivityFilterView.done}
        </Text>
      </RectButton>
    </View>
  )
}

function List(props: {
  denom?: string
  value: Api.HistoryType
  setValue: (type: Api.HistoryType) => void
  dismissPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        marginTop: -24,
        paddingTop: 16,
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
      }}
    >
      <ItemView
        title={translations.walletActivityFilterView.all}
        selected={props.value == Api.HistoryType.ALL}
        onPress={() => {
          props.setValue(Api.HistoryType.ALL)
        }}
      />
      {(props.denom?.startsWith(Keychain.baseCurrency) ||
        props.denom?.startsWith('m')) && (
        <>
          <ItemView
            title={translations.walletActivityFilterView.buy}
            selected={props.value == Api.HistoryType.BUY}
            onPress={() => {
              props.setValue(Api.HistoryType.BUY)
            }}
          />
          <ItemView
            title={translations.walletActivityFilterView.sell}
            selected={props.value == Api.HistoryType.SELL}
            onPress={() => {
              props.setValue(Api.HistoryType.SELL)
            }}
          />
        </>
      )}

      <ItemView
        title={translations.walletActivityFilterView.deposit}
        selected={props.value == Api.HistoryType.DEPOSIT}
        onPress={() => {
          props.setValue(Api.HistoryType.DEPOSIT)
        }}
      />

      {!props.denom?.startsWith('m') && props.denom?.toLowerCase() !== 'mir' && (
        <ItemView
          title={translations.walletActivityFilterView.swap}
          selected={props.value == Api.HistoryType.SWAP}
          onPress={() => {
            props.setValue(Api.HistoryType.SWAP)
          }}
        />
      )}
      <ItemView
        title={translations.walletActivityFilterView.withdraw}
        selected={props.value == Api.HistoryType.WITHDRAW}
        onPress={() => {
          props.setValue(Api.HistoryType.WITHDRAW)
        }}
      />

      <ConfirmButton
        onPressed={() => {
          props.dismissPressed()
        }}
      />
    </View>
  )
}

function ItemView(props: {
  title: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <RectButton
      style={{
        paddingLeft: 24,
        paddingRight: 24,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={props.onPress}
    >
      <Text
        style={{
          color: props.selected
            ? Resources.Colors.brightTeal
            : Resources.Colors.veryLightPink,
          fontFamily: Resources.Fonts.medium,
          fontSize: 18,
          letterSpacing: -0.3,
          flex: 1,
        }}
      >
        {props.title}
      </Text>
      <View
        style={{
          backgroundColor: props.selected
            ? Resources.Colors.brightTeal
            : Resources.Colors.darkGrey,
          width: 24,
          height: 24,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {props.selected ? (
          <Image
            source={Resources.Images.iconCheckB}
            style={{ width: 12, height: 12 }}
          />
        ) : (
          <View />
        )}
      </View>
    </RectButton>
  )
}

function ConfirmButton(props: { onPressed: () => void }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TouchableOpacity
        style={{
          marginTop: 24,
          width: 124,
          height: 34,
          borderRadius: 17,
          backgroundColor: Resources.Colors.brightTeal,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={() => {
          props.onPressed()
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            letterSpacing: -0.3,
            color: Resources.Colors.black,
          }}
        >
          {translations.walletActivityFilterView.confirm}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
