import React, {
  useState,
  useCallback,
  useContext,
  useRef,
  useEffect,
} from 'react'
import { Text, View, Image, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import {
  FlatList,
  RectButton,
  TouchableOpacity,
} from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { AddressPopupView } from '../common/AddressPopupView'
import { NavigationView } from '../common/NavigationView'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { WalletActivityFilterView } from './history/WalletActivityFilterView'
import { LoadingContext } from '../../common/provider/LoadingProvider'

export function WalletDetailView(props: {
  navigation: any
  route: any
  swapPressed: (symbol: string) => void
}) {
  return AssetActivityView(
    props.route.params.symbol,
    props.route.params.swapPressed
  )
}

function AssetActivityView(
  symbol: string,
  swapPressed: (symbol: string) => void
) {
  const navigation = useNavigation()

  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const { isLoading, setLoading } = useContext(LoadingContext)

  const [showAddressView, setShowAddressView] = useState(false)

  const [loaded, setLoaded] = useState(false)
  const [filterPopupShow, setFilterPopupShow] = useState(false)
  const [filterSelected, setFilterSelected] = useState(Api.HistoryType.ALL)
  const [list, setList] = useState([] as GQL_TxModel[])
  const offset = useRef(0)
  const loadEnd = useRef(false)

  const [balance, setBalance] = useState({
    amount: new BigNumber(0),
    converted: new BigNumber(0),
  })

  useFocusEffect(
    useCallback(() => {
      if (symbol.startsWith('m') || symbol.toLowerCase() === 'mir') {
        Api.assetInfo(symbol)
          .then((item) => {
            setBalance({
              amount: new BigNumber(item.amount),
              converted: new BigNumber(item.amount).multipliedBy(
                new BigNumber(item.price)
              ),
            })
          })
          .catch((error) => {
            setBalance({
              amount: new BigNumber(0),
              converted: new BigNumber(0),
            })
          })
      } else {
        Api.getBalances()
          .then((list) => {
            const l = list.filter((item) => {
              return item.denom === symbol
            })
            if (l.length > 0) {
              if (balance.amount !== l[0].amount)
                setBalance({ amount: l[0].amount, converted: l[0].converted })
            } else throw new Error()
          })
          .catch((error) => {
            setBalance({
              amount: new BigNumber(0),
              converted: new BigNumber(0),
            })
          })
      }
    }, [])
  )

  useEffect(() => {
    setLoaded(false)
    offset.current = 0
    loadEnd.current = false
    load(filterSelected, [], symbol)
      .then(() => {
        setLoaded(true)
        setLoading(false)
      })
      .catch((error) => {
        setLoaded(true)
        setLoading(false)
      })
  }, [filterSelected])

  function loadMore() {
    load(filterSelected, list, symbol)
      .then(() => {
        setLoaded(true)
        setLoading(false)
      })
      .catch((error) => {
        setLoaded(true)
        setLoading(false)
      })
  }

  async function load(
    filter: Api.HistoryType,
    oldlist: GQL_TxModel[],
    symbol?: string
  ) {
    if (isLoading || loadEnd.current) {
      return
    }

    setLoading(true)

    const pageSize = 30
    const tag: string =
      symbol?.startsWith('m') || symbol?.toLowerCase() === 'mir'
        ? await Api.getAssetTokens(symbol!)
        : symbol!.toString()

    let loaded = await Api.get_history(offset.current * pageSize, pageSize, tag)

    if (loaded.length == 0) {
      loadEnd.current = true
      return
    }

    if (filter != Api.HistoryType.ALL) {
      loaded = loaded.filter((item) => {
        return item.type == filter
      })
    }

    offset.current = offset.current + 1

    let newList = oldlist.slice()
    for (let i = 0; i < loaded.length; i++) {
      newList.push(loaded[i])
    }

    setList(newList)
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkGreyFour,
        paddingTop: safeInsetTop,
      }}
    >
      <FlatList
        onScroll={(e) => {
          const endY =
            e.nativeEvent.layoutMeasurement.height +
            e.nativeEvent.contentOffset.y
          const area = 100
          const contentHeight = e.nativeEvent.contentSize.height
          if (contentHeight - area < endY) {
            if (isLoading) {
              return
            }
            loadMore()
          }
        }}
        scrollEventThrottle={16}
        ListHeaderComponent={() => {
          return (
            <HeaderView
              balance={balance}
              symbol={symbol}
              filterSelected={filterSelected}
              setFilterPopupShow={setFilterPopupShow}
              setShowAddressView={setShowAddressView}
            />
          )
        }}
        ListFooterComponent={() => {
          return loaded && list.length == 0 ? (
            <EmptyView isShow={loaded && list.length == 0} />
          ) : (
            <View style={{ height: safeInsetBottom + 20 }} />
          )
        }}
        data={list}
        keyExtractor={(item, index) => index.toString()}
        renderItem={(item) => {
          return (
            <ItemView
              _item={item}
              _symbol={symbol}
              onPress={() => {
                navigation.navigate('WalletActivityDetailView', item.item)
              }}
            />
          )
        }}
        showsVerticalScrollIndicator={false}
      />

      {filterPopupShow && (
        <WalletActivityFilterView
          denom={symbol}
          selected={filterSelected}
          onDismissPressed={(value) => {
            if (value) {
              setFilterSelected(value)
            }
            setFilterPopupShow(false)
          }}
        />
      )}
      <NavigationView navigation={navigation} />
      {showAddressView && (
        <AddressPopupView
          onDismissPressed={() => {
            setShowAddressView(false)
          }}
        />
      )}
    </View>
  )
}

function ButtonView(props: {
  balance: BigNumber
  withdrawPressed: () => void
  depositPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  return (
    <View
      style={{
        marginTop: 32,
        flexDirection: 'row',
        marginBottom: 56,
      }}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <RectButton
          style={{ flex: 1 }}
          enabled={props.balance.isGreaterThan(0)}
          onPress={() => {
            props.withdrawPressed()
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              backgroundColor: Resources.Colors.darkGreyTwo,
              borderTopLeftRadius: 30,
              borderBottomLeftRadius: 30,
            }}
          >
            <Text
              style={{
                color: props.balance.isGreaterThan(0)
                  ? Resources.Colors.brightTeal
                  : Resources.Colors.darkGrey,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.2,
                marginTop: 14,
                marginBottom: 14,
              }}
            >
              {translations.walletDetailView.withdrawUpper}
            </Text>
          </View>
        </RectButton>

        <View
          style={{ backgroundColor: 'transparent', width: 1, height: '100%' }}
        />

        <RectButton
          style={{ flex: 1 }}
          onPress={() => {
            props.depositPressed()
          }}
        >
          <View
            style={{
              backgroundColor: Resources.Colors.darkGreyTwo,
              alignItems: 'center',
              borderTopRightRadius: 30,
              borderBottomRightRadius: 30,
            }}
          >
            <Text
              style={{
                color: Resources.Colors.brightTeal,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.2,
                marginTop: 14,
                marginBottom: 14,
              }}
            >
              {translations.walletDetailView.depositUpper}
            </Text>
          </View>
        </RectButton>
      </View>
    </View>
  )
}

function HeaderView(props: {
  balance: { amount: BigNumber; converted: BigNumber }
  symbol: string
  filterSelected: Api.HistoryType
  setFilterPopupShow: (v: boolean) => void
  setShowAddressView: (v: boolean) => void
}) {
  const { translations } = useContext(ConfigContext)
  const navigation = useNavigation()

  return (
    <>
      <View
        style={{ height: 52, backgroundColor: Resources.Colors.darkBackground }}
      />

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: Resources.Colors.darkBackground,
        }}
      >
        <View style={{ flex: 1, paddingLeft: 24, paddingRight: 24 }}>
          <View
            style={{
              marginTop: 48,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.bold,
                fontSize: 18,
                letterSpacing: -0.5,

                color: Resources.Colors.white,
              }}
            >
              {Utils.getDenom(props.symbol)}
            </Text>
            {!(props.symbol as string).startsWith('m') &&
              !((props.symbol as string).toLowerCase() === 'mir') &&
              !(props.symbol as string).startsWith(Keychain.baseCurrency) && (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('SwapStack', {
                      screen: 'SwapView',
                      params: {
                        symbol: props.symbol,
                      },
                    })
                  }}
                >
                  <Image
                    source={Resources.Images.btnSwapG26}
                    style={{ width: 28, height: 28 }}
                  />
                </TouchableOpacity>
              )}
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop:
                Platform.OS === 'ios'
                  ? (props.symbol as String).startsWith(Keychain.baseCurrency)
                    ? 4
                    : 16
                  : 0,
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 42,
                letterSpacing: -1.5,
                color: Resources.Colors.white,
              }}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
            >
              {Utils.getFormatted(
                props.balance.amount.dividedBy(1000000),
                (props.symbol as String).startsWith('m') ? 6 : 2,
                true
              )}
            </Text>
          </View>
          {props.symbol !== Keychain.baseCurrency && (
            <Text
              style={{
                marginTop: Platform.OS === 'ios' ? 5 : 5,
                fontFamily: Resources.Fonts.bold,
                fontSize: 12,
                letterSpacing: -0.2,
                color: Resources.Colors.greyishBrown,
              }}
            >
              {Utils.getFormatted(
                props.balance.converted.dividedBy(1000000),
                2
              ) + Keychain.baseCurrencyDenom}
            </Text>
          )}
          <ButtonView
            balance={props.balance.amount}
            withdrawPressed={() => {
              props.symbol === 'uusd'
                ? navigation.navigate('RampStack', {
                    screen: 'RampSelectView',
                    params: { withdraw: true },
                  })
                : navigation.navigate('WithdrawView', { symbol: props.symbol })
            }}
            depositPressed={() => {
              props.setShowAddressView(true)
            }}
          />
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: 24,
          paddingRight: 24,
          marginBottom: 12,
          marginTop: 48,
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            letterSpacing: -0.2,
            color: Resources.Colors.aquamarine,
          }}
        >
          {translations.walletActivityView.activity}
        </Text>
        <RectButton
          style={{
            height: 28,
            borderRadius: 14,
            backgroundColor: Resources.Colors.darkGreyTwo,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          onPress={() => {
            props.setFilterPopupShow(true)
          }}
        >
          <Text
            style={{
              marginLeft: 14,
              marginRight: 3,
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              color: Resources.Colors.brightTeal,
              letterSpacing: -0.3,
            }}
          >
            {props.filterSelected == Api.HistoryType.ALL
              ? translations.walletActivityView.all
              : props.filterSelected == Api.HistoryType.BUY
              ? translations.walletActivityView.buy
              : props.filterSelected == Api.HistoryType.SELL
              ? translations.walletActivityView.sell
              : props.filterSelected == Api.HistoryType.DEPOSIT
              ? translations.walletActivityView.deposit
              : props.filterSelected == Api.HistoryType.SWAP
              ? translations.walletActivityView.swap
              : translations.walletActivityView.withdraw}
          </Text>
          <Image
            source={Resources.Images.btnExpandOpenG}
            style={{ width: 8, height: 6, marginRight: 14 }}
          />
        </RectButton>
      </View>
    </>
  )
}

function ItemView(props: { _item: any; _symbol: String; onPress: () => void }) {
  const { translations } = useContext(ConfigContext)

  const item = props._item.item as GQL_TxModel

  let fee = new BigNumber(item.fee.amount).dividedBy(1000000)
  let amount = new BigNumber(item.amount.amount).dividedBy(1000000)
  let converted = new BigNumber(item.amount.converted).dividedBy(1000000)

  let value = new BigNumber(0)
  let title = ''
  let denom = Keychain.baseCurrencyDenom
  if (item.type == Api.HistoryType.BUY) {
    title =
      translations.walletActivityView.itemView.buy +
      ' ' +
      (props._symbol.startsWith('m') || props._symbol.toLowerCase() === 'mir'
        ? ''
        : Utils.getDenom(item.amount.denom))
    value =
      props._symbol.toLowerCase() === 'mir'
        ? amount.multipliedBy(-1)
        : converted.plus(fee).multipliedBy(-1)
    denom = item.amount.denom.startsWith('m')
      ? Keychain.baseCurrencyDenom
      : Utils.getDenom(item.amount.denom)
  } else if (item.type == Api.HistoryType.SELL) {
    title =
      translations.walletActivityView.itemView.sell +
      ' ' +
      (props._symbol.startsWith('m') || props._symbol.toLowerCase() === 'mir'
        ? ''
        : Utils.getDenom(item.amount.denom))
    value = props._symbol.toLowerCase() === 'mir' ? amount : amount.minus(fee)
    denom = item.amount.denom.startsWith('m')
      ? Keychain.baseCurrencyDenom
      : Utils.getDenom(item.amount.denom)
  } else if (item.type == Api.HistoryType.SWAP) {
    title = translations.walletActivityView.itemView.swap
    value =
      props._symbol.toLowerCase() === 'mir' ? amount : converted.minus(fee)
    denom = item.amount.denom.startsWith('m')
      ? Keychain.baseCurrencyDenom
      : Utils.getDenom(item.amount.convertedDenom)
  } else if (item.type == Api.HistoryType.DEPOSIT) {
    title = translations.walletActivityView.itemView.deposit
    value = props._symbol.toLowerCase() === 'mir' ? amount : converted
    denom = item.amount.denom.startsWith('m')
      ? Keychain.baseCurrencyDenom
      : Utils.getDenom(item.amount.denom)
  } else if (item.type == Api.HistoryType.WITHDRAW) {
    title = translations.walletActivityView.itemView.withdraw
    value =
      props._symbol.toLowerCase() === 'mir'
        ? amount.multipliedBy(-1)
        : converted.plus(fee).multipliedBy(-1)
    denom = item.amount.denom.startsWith('m')
      ? Keychain.baseCurrencyDenom
      : Utils.getDenom(item.amount.denom)
  } else if (item.type == Api.HistoryType.REGISTRATION) {
    title = translations.walletActivityView.itemView.registration
    value = converted
    denom = item.amount.denom.startsWith('m')
      ? Keychain.baseCurrencyDenom
      : Utils.getDenom(item.amount.denom)
  }

  const formattedAmount = value.isGreaterThan(new BigNumber(0))
    ? '+' + Utils.getFormatted(value, 2, true)
    : Utils.getFormatted(value, 2, true)

  const date = Utils.getDateFormat1(new Date(parseFloat(item.timestamp) * 1000))

  return (
    <RectButton
      style={{
        height: 74,
        paddingLeft: 24,
        paddingRight: 24,
        flexDirection: 'row',
      }}
      onPress={() => {
        props.onPress()
      }}
    >
      <View style={{ flex: 1, marginTop: 20 }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 18,
            letterSpacing: -0.3,
            color: Resources.Colors.veryLightPink,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            marginTop: 4,
            fontFamily: Resources.Fonts.book,
            fontSize: 12,
            letterSpacing: -0.3,
            color: Resources.Colors.greyishBrown,
          }}
        >
          {date}
        </Text>
      </View>
      <View
        style={{
          marginTop: 20,
          width: 132,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{
            maxWidth: 91,
            fontFamily: Resources.Fonts.book,
            fontSize: 18,
            letterSpacing: -0.3,
            color: Resources.Colors.veryLightPink,
          }}
        >
          {formattedAmount.split('.')[0]}
        </Text>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            marginTop: Platform.OS === 'ios' ? 6 : 8,
            fontSize: 10,
            letterSpacing: -0.2,
            color: Resources.Colors.veryLightPink,
          }}
        >
          {'.' + formattedAmount.split('.')[1] + ' ' + denom}
        </Text>
      </View>
    </RectButton>
  )
}

function EmptyView(props: { isShow: boolean }) {
  const { translations } = useContext(ConfigContext)

  return (
    <View style={{ marginTop: 100 }}>
      {props.isShow && (
        <View>
          <Text
            style={{
              fontFamily: Resources.Fonts.book,
              fontSize: 14,
              letterSpacing: -0.3,
              color: Resources.Colors.greyishBrown,
              textAlign: 'center',
            }}
          >
            {translations.walletActivityView.empty}
          </Text>
        </View>
      )}
    </View>
  )
}
