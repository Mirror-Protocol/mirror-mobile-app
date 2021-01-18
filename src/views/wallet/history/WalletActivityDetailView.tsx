import React, { useContext } from 'react'
import { Platform, Text, View } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Utils from '../../../common/Utils'
import * as Api from '../../../common/Apis/Api'
import * as Keychain from '../../../common/Keychain'
import { ScrollView } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { NavigationView } from '../../common/NavigationView'
import { ConfigContext } from '../../../common/provider/ConfigProvider'

export function WalletActivityDetailView(props: {
  navigation: any
  route: any
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const item = props.route.params

  const converted = new BigNumber(item.amount.converted).dividedBy(1000000)
  const amount = new BigNumber(item.amount.amount).dividedBy(1000000)
  const feeAmount = new BigNumber(item.fee.amount).dividedBy(1000000)

  const isMAsset =
    (item.amount.denom as string).startsWith('m') ||
    (item.amount.denom as string).toLowerCase() == 'mir'
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: safeInsetTop,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <HeaderView item={item} />
        {(item.type === Api.HistoryType.BUY ||
          item.type === Api.HistoryType.SELL) && (
          <ItemViewPrice
            title={translations.walletActivityDetailView.orderAmount}
            value={
              item.type === Api.HistoryType.BUY
                ? Utils.getFormatted(
                    converted.minus(feeAmount),
                    2,
                    true
                  ).replace('-', '')
                : Utils.getFormatted(amount, 2, true).replace('-', '')
            }
            denom={Keychain.baseCurrencyDenom}
          />
        )}

        {(item.type === Api.HistoryType.BUY ||
          item.type === Api.HistoryType.SELL) && (
          <ItemViewPrice
            title={translations.walletActivityDetailView.quantity}
            value={
              item.type === Api.HistoryType.BUY
                ? Utils.getFormatted(amount, 2, true).replace('-', '')
                : Utils.getFormatted(converted, 2, true).replace('-', '')
            }
            denom={Utils.getDenom(item.amount.denom)}
          />
        )}

        {item.type === Api.HistoryType.BUY ||
        item.type === Api.HistoryType.SELL ? (
          <ItemViewPrice
            title={translations.walletActivityDetailView.excutionPrice}
            value={Utils.getFormatted(
              new BigNumber(item.price),
              2,
              true
            ).replace('-', '')}
            denom={Keychain.baseCurrencyDenom}
          />
        ) : (
          <View />
        )}

        {(item.type === Api.HistoryType.DEPOSIT ||
          item.type === Api.HistoryType.WITHDRAW) && (
          <ItemViewText
            title={
              item.type === Api.HistoryType.DEPOSIT
                ? translations.walletActivityDetailView.senderAddress
                : translations.walletActivityDetailView.withdrawAddress
            }
            value={item.address}
          />
        )}

        {(item.type === Api.HistoryType.DEPOSIT ||
          item.type === Api.HistoryType.WITHDRAW) && (
          <ItemViewPrice
            title={
              isMAsset
                ? translations.walletActivityDetailView.quantity
                : translations.walletActivityDetailView.amount
            }
            value={
              isMAsset
                ? Utils.getFormatted(amount, 6, true).replace('-', '')
                : Utils.getFormatted(converted, 2, true).replace('-', '')
            }
            denom={Utils.getDenom(item.amount.denom)}
          />
        )}

        {item.type === Api.HistoryType.SWAP && (
          <View>
            <ItemViewPrice
              title={translations.walletActivityDetailView.from}
              value={Utils.getFormatted(amount, 2, true).replace('-', '')}
              denom={Utils.getDenom(item.amount.denom)}
            />
            <ItemViewPrice
              title={translations.walletActivityDetailView.to}
              value={Utils.getFormatted(converted, 2, true).replace('-', '')}
              denom={Keychain.baseCurrencyDenom}
            />
          </View>
        )}

        <ItemViewPrice
          title={translations.walletActivityDetailView.fees}
          value={Utils.getFormatted(feeAmount, 2, true).replace('-', '')}
          denom={Utils.getDenom(item.fee.denom)}
        />

        {item.memo.length > 0 && (
          <ItemViewText
            title={translations.walletActivityDetailView.memo}
            value={item.memo}
          />
        )}

        <ItemViewText
          title={translations.walletActivityDetailView.txHash}
          value={item.hash}
        />
      </ScrollView>

      <NavigationView navigation={props.navigation} />
    </View>
  )
}

function HeaderView(props: { item: any }) {
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
        {props.item.type == Api.HistoryType.BUY
          ? translations.walletActivityDetailView.buy +
            ' ' +
            Utils.getDenom(props.item.amount.denom)
          : props.item.type == Api.HistoryType.SELL
          ? translations.walletActivityDetailView.sell +
            ' ' +
            Utils.getDenom(props.item.amount.denom)
          : props.item.type == Api.HistoryType.WITHDRAW
          ? translations.walletActivityDetailView.withdraw +
            ' ' +
            Utils.getDenom(props.item.amount.denom)
          : props.item.type == Api.HistoryType.DEPOSIT
          ? translations.walletActivityDetailView.deposit +
            ' ' +
            Utils.getDenom(props.item.amount.denom)
          : props.item.type == Api.HistoryType.SWAP
          ? translations.walletActivityDetailView.swapTo +
            ' ' +
            Utils.getDenom(props.item.amount.convertedDenom)
          : props.item.type == Api.HistoryType.REGISTRATION
          ? translations.walletActivityDetailView.registration
          : ''}
      </Text>
      <Text
        style={{
          marginTop: 8,
          fontFamily: Resources.Fonts.book,
          fontSize: 14,
          letterSpacing: -0.3,
          color: Resources.Colors.brownishGrey,
        }}
      >
        {Utils.getDateFormat3(new Date(props.item.timestamp * 1000))}
      </Text>
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

function ItemViewText(props: { title: string; value: string }) {
  return (
    <View style={{ paddingLeft: 24, paddingRight: 24 }}>
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
