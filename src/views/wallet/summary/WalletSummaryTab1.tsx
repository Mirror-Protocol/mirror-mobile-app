import React, { useContext } from 'react'
import { Text, View, Image, Platform } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Utils from '../../../common/Utils'
import * as Keychain from '../../../common/Keychain'
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import ThrottleButton from '../../../component/ThrottleButton'

export function WalletSummaryTab1(props: {
  topupPressed: () => void
  uusdTotal: BigNumber
  balances: {
    amount: BigNumber
    denom: string
    converted: BigNumber
  }[]
  itemPressed: (symbol: string) => void
  swapPressed: (symbol: string) => void
  depositPressed: (symbol: string) => void
  withdrawPressed: (symbol: string) => void
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  return (
    <View
      style={{
        width: Resources.windowSize().width,
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      <ScrollView style={{}} showsVerticalScrollIndicator={false}>
        {props.uusdTotal.isLessThanOrEqualTo(new BigNumber(0)) ? (
          <EmptyView topupPressed={props.topupPressed} />
        ) : (
          <AssetView
            balances={props.balances}
            uusdTotal={props.uusdTotal.dividedBy(1000000)}
            itemPressed={props.itemPressed}
            swapPressed={props.swapPressed}
            depositPressed={props.depositPressed}
            withdrawPressed={props.withdrawPressed}
          />
        )}
        <View style={{ height: safeInsetBottom + 20 }} />
      </ScrollView>
    </View>
  )
}

function EmptyView(props: { topupPressed: () => void }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  return (
    <View>
      <View style={{ height: 176 + safeInsetTop }} />
      <View
        style={{
          marginBottom: 64,
          alignItems: 'center',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Resources.Colors.darkGrey,
            }}
          >
            <Image
              source={Resources.Images.iconCharge}
              style={{
                width: 20,
                height: 22,
              }}
            />
          </View>
        </View>
        <Text
          style={{
            marginTop: 24,
            fontFamily: Resources.Fonts.medium,
            fontSize: 52,
            textAlign: 'center',
            letterSpacing: -2,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {translations.walletSummaryView.fundYourWallet}
        </Text>
      </View>
      <TouchableOpacity
        style={{
          marginTop: 16,
          marginLeft: 24,
          marginRight: 24,
          height: 56,
          borderRadius: 16,
          backgroundColor: Resources.Colors.brightTeal,
        }}
        onPress={() => {
          props.topupPressed()
        }}
      >
        <View
          style={{
            margin: 1,
            height: 54,
            borderRadius: 16,
            backgroundColor: Resources.Colors.darkBackground,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Image
            style={{
              marginLeft: 24,
              width: 22,
              height: 22,
            }}
            source={Resources.Images.logoUst}
          />
          <Text
            style={{
              marginLeft: 3,
              fontSize: 14,
              fontFamily: Resources.Fonts.medium,
              letterSpacing: -0.35,
              color: Resources.Colors.veryLightPinkTwo,
              flex: 1,
            }}
          >
            {Keychain.baseCurrencyDenom}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: Resources.Fonts.medium,
              letterSpacing: -0.23,
              color: Resources.Colors.brightTeal,
            }}
          >
            {translations.walletSummaryView.depositNow}
          </Text>
          <Image
            style={{
              marginRight: 24,
              width: 6,
              height: 12,
              marginLeft: 6,
            }}
            source={Resources.Images.chevronR11G}
          />
        </View>
      </TouchableOpacity>
    </View>
  )
}

function AssetView(props: {
  uusdTotal: BigNumber
  balances: {
    amount: BigNumber
    denom: string
    converted: BigNumber
  }[]
  itemPressed: (symbol: string) => void
  swapPressed: (symbol: string) => void
  depositPressed: (symbol: string) => void
  withdrawPressed: (symbol: string) => void
}) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  return (
    <View>
      <View style={{ height: 176 + safeInsetTop }} />

      {props.balances.map((item, index) => {
        return item.denom == 'uusd' ? (
          <CardView
            key={index}
            denom={item.denom}
            balance={new BigNumber(item.amount)}
            itemPressed={props.itemPressed}
            swapPressed={props.swapPressed}
            depositPressed={props.depositPressed}
            withdrawPressed={props.withdrawPressed}
            price={new BigNumber(item.converted).dividedBy(1000000)}
          />
        ) : (
          <CardViewDark
            key={index}
            denom={item.denom}
            balance={new BigNumber(item.amount)}
            itemPressed={props.itemPressed}
            swapPressed={props.swapPressed}
            depositPressed={props.depositPressed}
            withdrawPressed={props.withdrawPressed}
            price={new BigNumber(item.converted).dividedBy(1000000)}
          />
        )
      })}
      <View style={{ height: 16 + safeInsetBottom - 32 }} />
    </View>
  )
}

function CardView(props: {
  denom: string
  balance: BigNumber
  price: BigNumber
  itemPressed: (symbol: string) => void
  swapPressed: (symbol: string) => void
  depositPressed: (symbol: string) => void
  withdrawPressed: (symbol: string) => void
}) {
  const { translations } = useContext(ConfigContext)

  return (
    <View
      style={{
        marginBottom: 32,
        marginLeft: 24,
        marginRight: 24,
        height: 178,
        borderRadius: 24,
        backgroundColor: Resources.Colors.darkGreyTwo,
        overflow: 'hidden',
      }}
    >
      <ThrottleButton
        type='TouchableOpacity'
        onPress={() => {
          props.itemPressed(props.denom)
        }}
        style={{
          flexDirection: 'row',
          height: 22,
          marginLeft: 24,
          marginTop: 24,
          marginBottom: Platform.OS === 'ios' ? 8 : 4,
        }}
      >
        <Image
          source={
            props.denom == 'uusd'
              ? Resources.Images.logoUst
              : props.denom == 'ukrw'
              ? Resources.Images.logoKrt
              : props.denom == 'umnt'
              ? Resources.Images.logoMnt
              : props.denom == 'usdr'
              ? Resources.Images.logoSdt
              : Resources.Images.logoLuna
          }
          style={{
            width: 22,
            height: 22,
            marginRight: 3,
          }}
        />

        <Text
          style={{
            marginTop: Platform.OS === 'ios' ? 4 : 0,
            fontFamily: Resources.Fonts.bold,
            fontSize: 14,
            letterSpacing: -0.35,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {Utils.getDenom(props.denom)}
        </Text>
        <Image
          source={Resources.Images.chevronR10G}
          style={{ width: 8, height: 10, marginLeft: 4, alignSelf: 'center' }}
        />
      </ThrottleButton>
      <ThrottleButton
        type='TouchableOpacity'
        onPress={() => {
          props.itemPressed(props.denom)
        }}
        style={{
          marginRight: 24,
        }}
      >
        <Text
          style={{
            marginLeft: 24,
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.4,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {Utils.getFormatted(props.balance.dividedBy(1000000), 2, true)}
        </Text>
      </ThrottleButton>
      <View style={{ flex: 1 }} />
      <View
        style={{
          marginLeft: 24,
          marginRight: 24,
          height: 1,
          backgroundColor: Resources.Colors.darkGreyThree,
        }}
      />
      <View
        style={{
          marginLeft: 24,
          marginRight: 24,
          height: 1,
          backgroundColor: Resources.Colors.darkGrey,
        }}
      />
      <View
        style={{
          height: 60,
          flexDirection: 'row',
          paddingLeft: 24,
          paddingRight: 25,
        }}
      >
        <ThrottleButton
          type='TouchableOpacity'
          style={{
            display: props.denom == Keychain.baseCurrency ? 'none' : 'flex',
            marginTop: 11,
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            props.swapPressed(props.denom)
          }}
        >
          <View style={{ opacity: 0.75 }}>
            <Image
              source={Resources.Images.btnSwapG26}
              style={{ width: 26, height: 26 }}
            />
          </View>
        </ThrottleButton>
        <View style={{ flex: 1 }} />
        <ThrottleButton
          type='TouchableOpacity'
          style={{
            marginTop: 10,
            height: 36,
            justifyContent: 'center',
          }}
          onPress={() => {
            props.withdrawPressed(props.denom)
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.2,
              color: Resources.Colors.brightTeal,
            }}
          >
            {translations.walletSummaryView.withdrawUpper}
          </Text>
        </ThrottleButton>
        <ThrottleButton
          type='TouchableOpacity'
          style={{
            marginLeft: 28,
            marginTop: 10,
            height: 36,
            justifyContent: 'center',
          }}
          onPress={() => {
            props.depositPressed(props.denom)
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.2,
              color: Resources.Colors.brightTeal,
            }}
          >
            {translations.walletSummaryView.depositUpper}
          </Text>
        </ThrottleButton>
      </View>
    </View>
  )
}

function CardViewDark(props: {
  denom: string
  balance: BigNumber
  price: BigNumber
  itemPressed: (symbol: string) => void
  swapPressed: (symbol: string) => void
  depositPressed: (symbol: string) => void
  withdrawPressed: (symbol: string) => void
}) {
  const showConverted = props.denom != Keychain.baseCurrency

  return (
    <View
      style={{
        marginBottom: 32,
        marginLeft: 24,
        marginRight: 24,
        height: 145,
        borderRadius: 24,
        backgroundColor: Resources.Colors.darkBackground,
        borderColor: Resources.Colors.darkGreyTwo,
        borderWidth: 2,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          height: 26,
          marginLeft: 24,
          marginRight: 24,
          marginTop: 24,
          marginBottom: Platform.OS === 'ios' ? 20 : 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ThrottleButton
          type='TouchableOpacity'
          onPress={() => {
            props.itemPressed(props.denom)
          }}
          style={{ flexDirection: 'row' }}
        >
          <Image
            source={
              props.denom == 'uusd'
                ? Resources.Images.logoUst
                : props.denom == 'ukrw'
                ? Resources.Images.logoKrt
                : props.denom == 'umnt'
                ? Resources.Images.logoMnt
                : props.denom == 'usdr'
                ? Resources.Images.logoSdt
                : Resources.Images.logoLuna
            }
            style={{
              width: 22,
              height: 22,
              marginRight: 3,
            }}
          />
          <Text
            style={{
              marginTop: Platform.OS === 'ios' ? 4 : 0,
              fontFamily: Resources.Fonts.bold,
              fontSize: 14,
              letterSpacing: -0.35,
              color: Resources.Colors.veryLightPinkTwo,
            }}
          >
            {Utils.getDenom(props.denom)}
          </Text>
          <Image
            source={Resources.Images.chevronR10G}
            style={{ width: 8, height: 10, marginLeft: 4, alignSelf: 'center' }}
          />
        </ThrottleButton>
        <ThrottleButton
          type='TouchableOpacity'
          style={{
            display: props.denom == Keychain.baseCurrency ? 'none' : 'flex',
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            props.swapPressed(props.denom)
          }}
        >
          <Image
            source={Resources.Images.btnSwapG26}
            style={{ width: 26, height: 26 }}
          />
        </ThrottleButton>
      </View>
      <ThrottleButton
        type='TouchableOpacity'
        onPress={() => {
          props.itemPressed(props.denom)
        }}
        style={{
          marginRight: 24,
        }}
      >
        <Text
          style={{
            marginLeft: 24,
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.4,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {Utils.getFormatted(props.balance.dividedBy(1000000), 2, true)}
        </Text>
      </ThrottleButton>
      <ThrottleButton
        type='TouchableOpacity'
        onPress={() => {
          props.itemPressed(props.denom)
        }}
        style={{
          display: showConverted ? 'flex' : 'none',
          flexDirection: 'row',
          marginLeft: 24,
          marginTop: Platform.OS === 'ios' ? 4 : 0,
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.44,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {Utils.getFormatted(props.price, 2, true)}
        </Text>
        <Text
          style={{
            marginLeft: 1,
            marginTop: 2,
            fontFamily: Resources.Fonts.bold,
            fontSize: 10,
            letterSpacing: -0.3,
            color: Resources.Colors.brownishGrey,
          }}
        >
          {Keychain.baseCurrencyDenom}
        </Text>
      </ThrottleButton>
    </View>
  )
}
