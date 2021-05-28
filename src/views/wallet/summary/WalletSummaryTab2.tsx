import React from 'react'
import { Text, View, Image } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Utils from '../../../common/Utils'
import * as Config from '../../../common/Apis/Config'
import { FlatList } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import ThrottleButton from '../../../component/ThrottleButton'

export function WalletSummaryTab2(props: {
  topupPressed: () => void
  assets: GQL_AssetList1[]
  itemPressed: (symbol: string, token: string) => void
}) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  return (
    <View
      style={{
        width: Resources.windowSize().width,
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      <FlatList
        style={{ flex: 1 }}
        ListHeaderComponent={() => {
          return <View style={{ height: 176 + safeInsetTop }} />
        }}
        ListFooterComponent={() => {
          return <View style={{ height: 20 + safeInsetBottom }} />
        }}
        data={props.assets}
        keyExtractor={(item, index) => {
          return index.toString()
        }}
        renderItem={(item) => {
          return <ItemView _item={item} itemPressed={props.itemPressed} />
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

function ItemView(props: {
  _item: any
  itemPressed: (symbol: string, token: string) => void
}) {
  const item: GQL_AssetList1 = props._item.item
  const symbol = item.symbol
  const token = item.token
  const name = item.name
  const amount = new BigNumber(item.amount)

  if (symbol.toLowerCase() === 'mir' && amount.isEqualTo(0)) return null

  if (item.status === 'DELISTED') return null

  return (
    <ThrottleButton
      type='TouchableOpacity'
      style={{
        height: 80,
        paddingTop: 18,
        paddingBottom: 18,
        paddingLeft: 24,
        paddingRight: 24,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={() => {
        if (!Config.hideMassetDetail) props.itemPressed(symbol, token)
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.5,
            color: amount.isGreaterThan(0)
              ? Resources.Colors.veryLightPink
              : Resources.Colors.brownishGrey,
          }}
        >
          {symbol}
        </Text>
        {amount.isGreaterThan(0) ? (
          <Text
            style={{
              marginTop: 2,
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.3,
              color: Resources.Colors.sea,
            }}
          >
            {Utils.getFormatted(amount.dividedBy(1000000), 6, true) +
              ' ' +
              symbol}
          </Text>
        ) : (
          <Text
            style={{
              marginTop: 2,
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.3,
              color: Resources.Colors.greyishBrown,
            }}
          >
            {name}
          </Text>
        )}
      </View>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: Resources.Colors.darkGrey,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={Resources.Images.iconWalletG18}
          style={{ width: 12, height: 11 }}
        />
      </View>
    </ThrottleButton>
  )
}
