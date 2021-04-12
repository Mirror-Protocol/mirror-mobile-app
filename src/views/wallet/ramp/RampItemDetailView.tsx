import React, { useContext } from 'react'
import { Platform, Text, View } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Utils from '../../../common/Utils'
import * as Config from '../../../common/Apis/Config'
import { RectButton, ScrollView } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import RampNavHeader from './RampNavHeader'
import { SwitchainOrderResponse } from '../../../hooks/useSwitchain'
import _ from 'lodash'
import { NotificationContext } from '../../../common/provider/NotificationProvider'

function RampItemDetailView(props: { navigation: any; route: any }) {
  const insets = Resources.getSafeLayoutInsets()
  const isWithdraw = props.route.params.withdraw
  const isMoonpay = props.route.params.moonpay

  const item = isMoonpay
    ? JSON.parse(props.route.params.item)
    : (props.route.params.item as SwitchainOrderResponse)

  const from = isMoonpay ? '' : item.pair.split('-')[0]
  const to = isMoonpay ? '' : item.pair.split('-')[1]

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: Resources.Colors.darkBackground,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <HeaderView
            title={'Pending ' + (isWithdraw ? 'Withdrawal' : 'Deposit')}
            subTitle={Utils.getDateFormat3(new Date(item.createdAt))}
          />
          {isMoonpay ? (
            <>
              <ItemViewText title={'Status'} value={`In Progress`} />
              <ItemViewPrice
                title={`Amount Deposited`}
                value={Utils.getFormatted(
                  new BigNumber(item.baseCurrencyAmount),
                  2,
                  true
                )}
                denom={'USD'}
              />
              <ItemViewPrice
                title={`Amount to be Received`}
                value={Utils.getFormatted(
                  new BigNumber(item.quoteCurrencyAmount),
                  2,
                  true
                )}
                denom={'UST'}
              />
              <ItemViewText
                title={
                  'For more details about your order,\nplease check the email sent to you from Moonpay.'
                }
                value={''}
              />
            </>
          ) : (
            <>
              <ItemViewText title={'Pair'} value={item.pair} />
              <ItemViewText title={'Status'} value={`In Progress`} />
              <ItemViewPrice
                title={isWithdraw ? `Withdrawal Amount` : `Amount Deposited`}
                value={Utils.getFormatted(
                  new BigNumber(item.fromAmount),
                  from === 'UST' ? 2 : 4,
                  true
                )}
                denom={from}
              />
              <ItemViewPrice
                title={`Amount to be Received`}
                value={Utils.getFormatted(
                  new BigNumber(item.rate).times(Config.slippageMinus),
                  to === 'UST' ? 2 : 4,
                  true
                )}
                denom={to}
              />
              <ItemViewText
                title={`${from} Deposit Address`}
                value={item.exchangeAddress}
                copyAvailable={true}
              />
              <ItemViewText
                title={'Refund Address'}
                value={item.refundAddress}
                copyAvailable={true}
              />
            </>
          )}
          {/* <ItemViewPrice title={``} value={``} denom={``} /> */}
        </ScrollView>
      </View>

      <RampNavHeader
        navigation={props.navigation}
        showBack={false}
        onClosePress={() => {
          props.navigation.pop()
        }}
      />
    </>
  )
}

function CopyButton(props: { onPressed: () => void }) {
  return (
    <RectButton style={{}} onPress={props.onPressed}>
      <Text
        style={{
          fontSize: 12,
          letterSpacing: -0.2,
          fontFamily: Resources.Fonts.book,
          color: Resources.Colors.brightTeal,
        }}
      >
        {'Copy'}
      </Text>
    </RectButton>
  )
}

function HeaderView(props: { title?: string; subTitle?: string }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View style={{ paddingLeft: 24, paddingRight: 24, marginBottom: 12 }}>
      <Text
        style={{
          marginTop: 100,
          fontFamily: Resources.Fonts.medium,
          fontSize: 32,
          letterSpacing: -0.5,
          color: Resources.Colors.white,
        }}
      >
        {props.title}
      </Text>
      {props.subTitle && (
        <Text
          style={{
            marginTop: 8,
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            letterSpacing: -0.3,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {props.subTitle}
        </Text>
      )}
      <View
        style={{
          marginTop: 32,
          height: 1,
          backgroundColor: Resources.Colors.dummyup,
        }}
      />
      <View
        style={{
          height: 1,
          backgroundColor: Resources.Colors.dummydown,
        }}
      />
    </View>
  )
}

function ItemViewPrice(props: { title: string; value: string; denom: string }) {
  return (
    <View style={{ paddingLeft: 24, paddingRight: 24, height: 72 }}>
      <Text
        style={{
          marginTop: 16,
          fontFamily: Resources.Fonts.book,
          fontSize: 14,
          letterSpacing: -0.3,
          color: Resources.Colors.brownishGrey,
        }}
      >
        {props.title}
      </Text>
      <View style={{ marginTop: 8, flexDirection: 'row' }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 18,
            letterSpacing: -0.3,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.value}
        </Text>
        <Text
          style={{
            marginTop: Platform.OS === 'ios' ? 6 : 8,
            fontFamily: Resources.Fonts.book,
            fontSize: 10,
            letterSpacing: -0.2,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.denom}
        </Text>
      </View>
    </View>
  )
}

function ItemViewText(props: {
  title: string
  value: string
  copyAvailable?: boolean
}) {
  const { showNotification } = useContext(NotificationContext)
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        marginTop: 16,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            letterSpacing: -0.3,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {props.title}
        </Text>
        {props.copyAvailable && (
          <CopyButton
            onPressed={() => {
              Resources.setClipboard(props.value)
              showNotification(
                translations.addressPopupView.copied,
                Resources.Colors.brightTeal
              )
            }}
          />
        )}
      </View>

      <Text
        style={{
          marginTop: 8,
          marginBottom: 16,
          fontFamily: Resources.Fonts.book,
          fontSize: 18,
          lineHeight: 23,
          letterSpacing: -0.3,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {props.value}
      </Text>
    </View>
  )
}

export default RampItemDetailView
