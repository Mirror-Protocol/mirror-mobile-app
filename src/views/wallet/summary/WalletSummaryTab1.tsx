import React, { useContext, useEffect, useState } from 'react'
import { Text, View, Image, Platform } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Utils from '../../../common/Utils'
import * as Keychain from '../../../common/Keychain'
import { ScrollView, RectButton } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import ThrottleButton from '../../../component/ThrottleButton'
import Separator from '../../common/Separator'
import BuyButton from '../../common/BuyButton'
import { PendingData } from '../../../hooks/usePending'

const SMALL = '1000000'

export function WalletSummaryTab1(props: {
  navigation: any
  route: any
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
  withdrawOtherBalancePressed: (symbol: string) => void
  pendingData: PendingData[]
  withdrawData: PendingData[]
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  return (
    <>
      <View
        style={{
          width: Resources.windowSize().width,
          backgroundColor: Resources.Colors.darkBackground,
          flex: 1,
        }}
      >
        <ScrollView style={{}} showsVerticalScrollIndicator={false}>
          {props.uusdTotal.isLessThanOrEqualTo(new BigNumber(0)) ? (
            <EmptyView
              navigation={props.navigation}
              route={props.route}
              topupPressed={props.topupPressed}
              depositPressed={props.depositPressed}
              pendingData={props.pendingData}
              withdrawData={props.withdrawData}
            />
          ) : (
            <AssetView
              navigation={props.navigation}
              route={props.route}
              balances={props.balances}
              uusdTotal={props.uusdTotal.dividedBy(1000000)}
              itemPressed={props.itemPressed}
              swapPressed={props.swapPressed}
              depositPressed={props.depositPressed}
              withdrawPressed={props.withdrawPressed}
              withdrawOtherBalancePressed={props.withdrawOtherBalancePressed}
              topupPressed={props.topupPressed}
              pendingData={props.pendingData}
              withdrawData={props.withdrawData}
            />
          )}
          <View style={{ height: safeInsetBottom + 20 }} />
        </ScrollView>
      </View>
    </>
  )
}

function EmptyView(props: {
  navigation: any
  route: any
  topupPressed: () => void
  depositPressed: (symbol: string) => void
  pendingData: PendingData[]
  withdrawData: PendingData[]
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  return (
    <>
      <View style={{ height: 168 + safeInsetTop }} />
      <View
        style={{
          marginHorizontal: 24,
          borderRadius: 16,
          backgroundColor: Resources.Colors.darkGreyTwo,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            alignItems: 'center',
            marginTop: 56,
          }}
        >
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
            marginBottom: 58,
            fontFamily: Resources.Fonts.medium,
            fontSize: 52,
            textAlign: 'center',
            letterSpacing: -2,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {translations.walletSummaryView.fundYourWallet}
        </Text>
        <ThrottleButton
          type={'RectButton'}
          style={{
            height: 56,
            backgroundColor: Resources.Colors.brightTeal,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => props.depositPressed(Keychain.baseCurrency)}
        >
          <Text
            style={{
              alignSelf: 'center',
              textAlign: 'center',
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.2,
              color: Resources.Colors.black,
            }}
          >
            {'DEPOSIT'}
          </Text>
        </ThrottleButton>
      </View>
      <BuyButton
        navigation={props.navigation}
        route={props.route}
        topupPressed={props.topupPressed}
        pendingData={props.pendingData}
        title={translations.walletSummaryView.deposit}
        titleIcon={Resources.Images.iconBuyG}
        withdraw={false}
      />
      {props.withdrawData.length > 0 && (
        <BuyButton
          navigation={props.navigation}
          route={props.route}
          topupPressed={props.topupPressed}
          pendingData={props.withdrawData}
          title={translations.walletSummaryView.withdrawal}
          titleIcon={Resources.Images.iconSending}
          withdraw={true}
        />
      )}
    </>
  )
}

function AssetView(props: {
  navigation: any
  route: any
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
  withdrawOtherBalancePressed: (symbol: string) => void
  topupPressed: () => void
  pendingData: PendingData[]
  withdrawData: PendingData[]
}) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const isHaveOtherBalance = props.balances.some(
    (item) => item.denom !== Keychain.baseCurrency
  )

  const [hideSmallBalance, setHideSmallBalance] = useState<boolean>()
  useEffect(() => {
    const initHideBalance = async () => {
      setHideSmallBalance(await Keychain.getHideBalance())
    }
    initHideBalance()
  }, [])

  useEffect(() => {
    const toggleHideBalance = async () => {
      if (
        hideSmallBalance !== undefined &&
        hideSmallBalance !== (await Keychain.getHideBalance())
      ) {
        await Keychain.toggleHideBalance()
      }
    }
    toggleHideBalance()
  }, [hideSmallBalance])

  return (
    <View>
      <View style={{ height: 176 + safeInsetTop }} />

      {props.balances.map((item, index) => {
        return item.denom == 'uusd' ? (
          <>
            <UstView
              navigation={props.navigation}
              route={props.route}
              key={index}
              denom={item.denom}
              balance={new BigNumber(item.amount)}
              itemPressed={props.itemPressed}
              swapPressed={props.swapPressed}
              depositPressed={props.depositPressed}
              withdrawPressed={props.withdrawPressed}
              topupPressed={props.topupPressed}
              price={new BigNumber(item.converted).dividedBy(1000000)}
              pendingData={props.pendingData}
              withdrawData={props.withdrawData}
            />
            {isHaveOtherBalance && (
              <>
                <Separator
                  style={{
                    marginTop: 57,
                    marginBottom: 40,
                    marginHorizontal: 24,
                  }}
                />
                <View
                  style={{
                    height: 20,
                    marginHorizontal: 24,
                    marginBottom: 16,
                    flexDirection: 'row-reverse',
                  }}
                >
                  <RectButton
                    style={{
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                    }}
                    hitSlop={{ left: 12, top: 12, right: 12, bottom: 12 }}
                    onPress={() => {
                      setHideSmallBalance((v) => !v)
                    }}
                  >
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        backgroundColor: Resources.Colors.brightTeal,
                        justifyContent: 'center',
                        alignItems: 'center',
                        opacity: hideSmallBalance ? 1 : 0.4,
                      }}
                    >
                      <Image
                        source={Resources.Images.iconCheckB}
                        style={{
                          width: 8,
                          height: 5,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        fontFamily: Resources.Fonts.medium,
                        fontSize: 12,
                        letterSpacing: -0.3,
                        color: Resources.Colors.brownishGrey,
                        marginRight: 6,
                      }}
                    >
                      {'Hide small balances'}
                    </Text>
                  </RectButton>
                </View>
              </>
            )}
          </>
        ) : (
          <>
            {(!hideSmallBalance || item.amount.gte(SMALL)) && (
              <CardView
                key={index}
                denom={item.denom}
                balance={new BigNumber(item.amount)}
                itemPressed={props.itemPressed}
                swapPressed={props.swapPressed}
                depositPressed={props.depositPressed}
                withdrawPressed={props.withdrawOtherBalancePressed}
                price={new BigNumber(item.converted).dividedBy(1e6)}
              />
            )}
          </>
        )
      })}
      <View style={{ height: 16 + safeInsetBottom - 32 }} />
    </View>
  )
}

function UstView(props: {
  navigation: any
  route: any
  denom: string
  balance: BigNumber
  price: BigNumber
  itemPressed: (symbol: string) => void
  swapPressed: (symbol: string) => void
  depositPressed: (symbol: string) => void
  withdrawPressed: (symbol: string) => void
  topupPressed: () => void
  pendingData: PendingData[]
  withdrawData: PendingData[]
}) {
  const { translations } = useContext(ConfigContext)

  return (
    <>
      <View
        style={{
          marginHorizontal: 24,
          height: 180,
          borderRadius: 16,
          backgroundColor: 'rgb(42, 42, 46)',
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
            source={{
              uri: Utils.getDenomImageWithoutMasset(props.denom),
            }}
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
            {Utils.getDenomWithoutMasset(props.denom)}
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
            marginLeft: 24,
          }}
        >
          <Text
            style={{
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
            height: 48,
            backgroundColor: Resources.Colors.brightTeal,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <ThrottleButton
            type={'RectButton'}
            style={{
              flex: 1,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => props.withdrawPressed(props.denom)}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.2,
                color: Resources.Colors.black,
              }}
            >
              {'WITHDRAW'}
            </Text>
          </ThrottleButton>
          <View
            style={{
              width: 1,
              height: 14,
              backgroundColor: Resources.Colors.darkGreyTwo,
            }}
          />
          <ThrottleButton
            type={'RectButton'}
            style={{
              flex: 1,
              height: '100%',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => props.depositPressed(props.denom)}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.2,
                color: Resources.Colors.black,
              }}
            >
              {'DEPOSIT'}
            </Text>
          </ThrottleButton>
        </View>
      </View>
      <BuyButton
        navigation={props.navigation}
        route={props.route}
        topupPressed={props.topupPressed}
        pendingData={props.pendingData}
        title={translations.walletSummaryView.deposit}
        titleIcon={Resources.Images.iconBuyG}
        withdraw={false}
      />
      {props.withdrawData.length > 0 && (
        <BuyButton
          navigation={props.navigation}
          route={props.route}
          topupPressed={props.topupPressed}
          pendingData={props.withdrawData}
          title={translations.walletSummaryView.withdrawal}
          titleIcon={Resources.Images.iconSending}
          withdraw={true}
        />
      )}
    </>
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
  const showConverted = props.denom != Keychain.baseCurrency

  const [icon, setIcon] = useState<string>()
  useEffect(() => {
    const getDenomIcon = async (udenom: string): Promise<string> => {
      const uri = Utils.getDenomImageWithoutMasset(udenom)
      const ret = await fetch(uri, { method: 'GET' })
      return ret.status === 200
        ? uri
        : 'https://mirror.finance/assets/logos/logoTerra.png'
    }
    getDenomIcon(props.denom).then((ret) => ret !== '' && setIcon(ret))
  }, [])

  return (
    <ThrottleButton
      type={'TouchableOpacity'}
      style={{
        height: 68,
        borderRadius: 16,
        marginHorizontal: 24,
        marginVertical: 8,
        paddingHorizontal: 24,
        backgroundColor: Resources.Colors.darkGreyTwo,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={() => props.itemPressed(props.denom)}
    >
      <Image
        source={{
          uri: icon,
        }}
        style={{
          width: 22,
          height: 22,
          marginRight: 3,
        }}
      />
      <Text
        style={{
          flex: 1,
          fontFamily: Resources.Fonts.bold,
          fontSize: 14,
          letterSpacing: -0.35,
          color: Resources.Colors.veryLightPinkTwo,
        }}
      >
        {Utils.getDenomWithoutMasset(props.denom)}
      </Text>
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 14,
          letterSpacing: -0.23,
          marginRight: 6,
          color: Resources.Colors.brownishGrey,
        }}
      >
        {Utils.getFormatted(props.balance.dividedBy(1e6), 2, true)}
      </Text>
      <Image
        source={Resources.Images.chevronR11G}
        style={{ width: 6, height: 12 }}
      />
    </ThrottleButton>
  )
}
