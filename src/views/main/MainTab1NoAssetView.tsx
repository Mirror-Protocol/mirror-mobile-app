import React, { useContext } from 'react'
import { Text, View, Image } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Keychain from '../../common/Keychain'
import { TouchableOpacity } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { ConfigContext } from '../../common/provider/ConfigProvider'

export function MainTab1NoAssetView(props: {
  balance: BigNumber
  topupPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const uusd: BigNumber = props.balance
  const balanceExist = uusd.isGreaterThan(0)

  return (
    <View
      style={{
        width: Resources.windowSize().width,
        flex: 1,
      }}
    >
      <View style={{ height: safeInsetTop + 52 }} />
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            marginTop: 112,
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: Resources.Colors.darkGrey,
          }}
        >
          {!balanceExist ? (
            <Image
              source={Resources.Images.iconCharge}
              style={{ width: 20, height: 22 }}
            />
          ) : (
            <Image
              source={Resources.Images.iconMirror28}
              style={{ width: 15, height: 28 }}
            />
          )}
        </View>
      </View>
      <Text
        style={{
          marginTop: 32,
          fontFamily: Resources.Fonts.medium,
          fontSize: 52,
          textAlign: 'center',
          letterSpacing: -2,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {translations.mainTab1View.polishYourPortfolio}
      </Text>
      {!balanceExist ? (
        <Text
          style={{
            marginTop: 18,
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            textAlign: 'center',
            letterSpacing: -0.3,
            color: Resources.Colors.brightTeal,
          }}
        >
          {translations.mainTab1View.startInvestingNowWith +
            ' ' +
            Keychain.baseCurrencyDenom}
        </Text>
      ) : (
        <View
          style={{
            marginTop: 18,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.book,
              fontSize: 14,
              textAlign: 'center',
              letterSpacing: -0.3,
              color: Resources.Colors.brightTeal,
            }}
          >
            {Utils.getFormatted(uusd.dividedBy(1000000), 2, true)}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontFamily: Resources.Fonts.book,
              fontSize: 10,
              textAlign: 'center',
              letterSpacing: -0.3,
              color: Resources.Colors.brightTeal,
            }}
          >
            {Keychain.baseCurrencyDenom}
          </Text>
          <Text
            style={{
              fontFamily: Resources.Fonts.book,
              fontSize: 14,
              textAlign: 'center',
              letterSpacing: -0.3,
              color: Resources.Colors.brightTeal,
            }}
          >
            {' ' + translations.mainTab1View.availableToInvest}
          </Text>
        </View>
      )}

      <View style={{ flex: 1 }} />
      {!balanceExist ? (
        <TouchableOpacity
          style={{
            marginBottom: safeInsetBottom + 20,
            marginTop: 16,
            marginLeft: 24,
            marginRight: 24,
            height: 48,
            borderRadius: 24,
            backgroundColor: Resources.Colors.brightTeal,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            props.topupPressed()
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontFamily: Resources.Fonts.medium,
              letterSpacing: -0.5,
              color: Resources.Colors.black,
            }}
          >
            {translations.mainTab1View.deposit}
          </Text>
        </TouchableOpacity>
      ) : (
        <View />
      )}
    </View>
  )
}
