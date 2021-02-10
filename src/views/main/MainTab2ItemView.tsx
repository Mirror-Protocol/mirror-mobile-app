import React, { useState } from 'react'
import { Text, View, Image } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import { RectButton } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import ThrottleButton from '../../component/ThrottleButton'

export function MainTab2ItemView(props: {
  detailPressed: (symbol: string) => void
  _item: any
  setShowPercent: (b: boolean) => void
  showPercent: boolean
}) {
  const item = props._item.item as GQL_AssetList1
  if (item.symbol.toLowerCase() === 'mir') return null

  const disable = item.price === 'NaN' ? true : false

  return (
    <View
      style={{
        marginRight: 24,
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <ThrottleButton
        type={'RectButton'}
        style={{
          paddingLeft: 24,
          paddingRight: 19,
          flex: 1,
          flexDirection: 'row',
        }}
        onPress={() => {
          disable === false && props.detailPressed(item.symbol)
        }}
      >
        <IconView symbol={item.symbol} disable={disable} />

        <InfoView symbol={item.symbol} name={item.name} disable={disable} />
      </ThrottleButton>

      <PriceView
        setShowPercent={props.setShowPercent}
        showPercent={props.showPercent}
        dayDiff={item.dayDiff}
        price={item.price}
        disable={disable}
      />
    </View>
  )
}

function IconView(props: { symbol: string; disable: boolean }) {
  const [noIcon, setNoIcon] = useState(false)

  return (
    <View
      style={{
        width: 48,
        height: 48,
        backgroundColor: Resources.Colors.darkGreyTwo,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image
        source={{ uri: Api.getAssetIcon(props.symbol) }}
        style={{
          display: !noIcon ? 'flex' : 'none',
          width: 22,
          height: 22,
          opacity: props.disable ? 0.3 : undefined,
        }}
        onLoadStart={() => {
          setNoIcon(false)
        }}
        onError={(error) => {
          setNoIcon(true)
        }}
      />

      <Text
        style={{
          display: noIcon ? 'flex' : 'none',
          fontFamily: Resources.Fonts.bold,
          fontSize: 10,
          letterSpacing: -0.3,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {'ETF'}
      </Text>
    </View>
  )
}

function InfoView(props: { symbol: string; name: string; disable: boolean }) {
  return (
    <View
      style={{
        marginLeft: 12,
        flex: 1,
        height: 48,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: props.disable
            ? Resources.Colors.greyishBrown
            : Resources.Colors.veryLightPinkTwo,
          fontFamily: Resources.Fonts.medium,
          fontSize: 24,
          letterSpacing: -0.3,
        }}
      >
        {Utils.getDenom(props.symbol)}
      </Text>
      <Text
        numberOfLines={1}
        ellipsizeMode={'tail'}
        style={{
          marginTop: 2,
          color: Resources.Colors.greyishBrown,
          fontFamily: Resources.Fonts.medium,
          fontSize: 12,
          letterSpacing: -0.4,
        }}
      >
        {props.name}
      </Text>
    </View>
  )
}

function PriceView(props: {
  setShowPercent: (b: boolean) => void
  showPercent: boolean
  dayDiff: string
  price: string
  disable: boolean
}) {
  const price: BigNumber = new BigNumber(props.price)

  const value1 = Utils.getFormatted(price, 2, true).split('.')[0]
  const value2 = Utils.getFormatted(price, 2, true).split('.')[1]
  const dayDiffRate = new BigNumber(props.dayDiff)
  const color = dayDiffRate.isLessThan(0)
    ? Resources.Colors.brightPink
    : dayDiffRate.isGreaterThan(0)
    ? Resources.Colors.brightTeal
    : Resources.Colors.white
  return (
    <RectButton
      style={{
        height: 38,
        width: 106,
        borderRadius: 12,
        backgroundColor: Resources.Colors.darkGreyTwo,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => {
        props.disable === false && props.setShowPercent(!props.showPercent)
      }}
    >
      {props.showPercent ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {dayDiffRate.isEqualTo(0) ||
          props.disable ? null : dayDiffRate.isGreaterThan(0) ? (
            <Image
              source={Resources.Images.iconIncrease}
              style={{ width: 6, height: 6 }}
            />
          ) : (
            <Image
              source={Resources.Images.iconDecrease}
              style={{ width: 6, height: 6 }}
            />
          )}
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.75,
              color: props.disable ? Resources.Colors.greyishBrown : color,
              marginLeft: 3,
            }}
          >
            {props.disable
              ? '- %'
              : Utils.getFormatted(
                  dayDiffRate.multipliedBy(100).abs(),
                  1,
                  true
                ) + '%'}
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.75,
              color: props.disable ? Resources.Colors.greyishBrown : color,
            }}
          >
            {props.disable ? '-' : value1}
          </Text>
          <Text
            style={{
              marginBottom: 1,
              fontFamily: Resources.Fonts.medium,
              fontSize: 10,
              letterSpacing: -0.2,
              color: props.disable ? Resources.Colors.greyishBrown : color,
            }}
          >
            {props.disable
              ? ' ' + Keychain.baseCurrencyDenom
              : '.' + value2 + ' ' + Keychain.baseCurrencyDenom}
          </Text>
        </View>
      )}
    </RectButton>
  )
}
