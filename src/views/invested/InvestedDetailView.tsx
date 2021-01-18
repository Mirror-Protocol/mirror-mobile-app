import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import {
  Text,
  View,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import {
  TouchableOpacity,
  ScrollView,
  RectButton,
} from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { useFocusEffect } from '@react-navigation/native'
import { MainChartView } from '../main/MainChartView'
import { NavigationView } from '../common/NavigationView'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import ThrottleButton from '../../component/ThrottleButton'

export function InvestedDetailView(props: { route: any; navigation: any }) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const [chartLongPressed, setChartLongPressed] = useState(false)

  const symbol = props.route.params.symbol

  const [loaded, setLoaded] = useState(false)
  const [isFavorite, setFavorite] = useState(false)
  const [investedInfo, setInvestedInfo] = useState({
    symbol: '',
    name: '',
    price: new BigNumber(0),
    dayDiff: new BigNumber(0),
    averagePrice: new BigNumber(0),

    currentValue: new BigNumber(0),
    amount: new BigNumber(0),
    ret: new BigNumber(0),
    unrealizedPL: new BigNumber(0),
  })

  const [otherInfo, setOtherInfo] = useState({
    about: '',
    news: [] as any[],
  })

  const [chartInfo, setChartInfo] = useState({
    rate: new BigNumber(0),
    simplified: [] as {
      time: number
      value: BigNumber
    }[],
    list: [] as {
      time: number
      value: BigNumber
      formattedTime: string
      rate: BigNumber
    }[],
    maxValue: new BigNumber(0),
    minValue: new BigNumber(0),
  })

  const [chartDataType, setChartDataType] = useState(Api.ChartDataType.month)
  const [chartLoading, setChartLoading] = useState(false)
  const [isRefresh, setRefresh] = useState(false)

  const scrolling = useRef(false)

  useEffect(() => {
    checkFavorite()

    Keychain.getMainChartType().then((type) => {
      setChartDataType(type)
    })
  }, [])

  useLayoutEffect(() => {
    props.navigation.setOptions({
      gestureEnabled: !chartLongPressed,
    })
  }, [chartLongPressed])

  useFocusEffect(
    useCallback(() => {
      loadOthers(symbol)
        .then((v) => {})
        .catch((error) => {})

      load(symbol)
        .then((v) => {
          setLoaded(true)
        })
        .catch((error) => {
          setLoaded(true)
        })
    }, [])
  )

  useFocusEffect(
    useCallback(() => {
      loadChartData(symbol)
        .then((v) => {
          setChartLoading(false)
        })
        .catch((error) => {
          setChartLoading(false)
        })

      return () => {}
    }, [chartDataType])
  )

  const onRefresh = React.useCallback(() => {
    setRefresh(true)
    load(symbol)
      .then(() => {
        setLoaded(true)
        loadChartData(symbol)
      })
      .then(() => {
        setChartLoading(false)
        setRefresh(false)
      })
      .catch((error) => {
        setLoaded(true)
        setChartLoading(false)
        setRefresh(false)
      })
  }, [isRefresh, chartInfo, investedInfo])

  async function loadOthers(symbol: string) {
    const response = await Api.assetOther(symbol)

    const news = response.news
    const about = response.desc

    setOtherInfo({
      news: news,
      about: about,
    })
  }

  async function load(symbol: string) {
    const item: GQL_AssetList1 = await Api.assetInfo(symbol)
    const price = new BigNumber(item.price)
    const amount = new BigNumber(item.amount)
    const dayDiff = new BigNumber(item.dayDiff)
    const ret = new BigNumber(item.ret)
    const averagePrice = new BigNumber(item.averagePrice)
    let unrealizedPL = new BigNumber(0)
    if (!averagePrice.isEqualTo(new BigNumber(0))) {
      unrealizedPL = price.minus(averagePrice).multipliedBy(amount)
    }

    setInvestedInfo({
      symbol: item.symbol,
      name: item.name,
      price: price,
      dayDiff: dayDiff,
      averagePrice: averagePrice,

      currentValue: price.multipliedBy(amount).dividedBy(1000000),
      amount: amount.dividedBy(1000000),
      ret: ret,
      unrealizedPL: unrealizedPL.dividedBy(1000000),
    })
  }

  async function loadChartData(symbol: string) {
    if (chartLoading) {
      return
    }

    setChartLoading(true)

    const type = await Keychain.getMainChartType()
    const info: GQL_AssetChartList = await Api.assetChart(symbol, type)

    let firstPrice = new BigNumber(0)
    if (info.list.length > 0) {
      firstPrice = new BigNumber(info.list[0].price)
    }
    const list = info.list.map((item) => {
      let formattedTime = ''
      if (type == Api.ChartDataType.day) {
        formattedTime = Utils.getDateFormat2(item.timestamp)
      } else if (type == Api.ChartDataType.week) {
        formattedTime = Utils.getDateFormat4(item.timestamp)
      } else if (type == Api.ChartDataType.month) {
        formattedTime = Utils.getDateFormat5(item.timestamp)
      } else {
        formattedTime = Utils.getDateFormat1(new Date(item.timestamp))
      }

      const value = new BigNumber(item.price)

      let rate = value.dividedBy(firstPrice).minus(1).multipliedBy(100)

      if (rate.isNaN() || !rate.isFinite()) {
        rate = new BigNumber(0)
      }

      return {
        time: item.timestamp,
        value: value,
        formattedTime: formattedTime,
        rate: rate,
      }
    })

    const simplified = info.simplified.map((item) => {
      return {
        time: item.timestamp,
        value: Utils.getCutNumber(new BigNumber(item.price), 0),
      }
    })

    let startPrice = new BigNumber(0)
    for (let i = 0; i < list.length; i++) {
      if (!list[i].value.isEqualTo(new BigNumber(0))) {
        startPrice = list[i].value
        break
      }
    }
    const lastPrice = list[list.length - 1].value
    let rate = new BigNumber(0)
    if (!startPrice.isEqualTo(new BigNumber(0))) {
      rate = lastPrice.dividedBy(startPrice).minus(1).multipliedBy(100)
    }

    setChartInfo({
      rate: rate,
      simplified: simplified,
      list: list,
      minValue: new BigNumber(info.minValue),
      maxValue: new BigNumber(info.maxValue),
    })
  }

  function checkFavorite() {
    Keychain.isFavorite(symbol).then((f) => {
      setFavorite(f)
    })
  }

  return (
    <View
      style={{
        paddingTop: safeInsetTop,
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      <ScrollView
        onScrollBeginDrag={() => {
          scrolling.current = true
        }}
        onScrollEndDrag={() => {
          scrolling.current = false
        }}
        scrollEnabled={!chartLongPressed}
        refreshControl={
          <RefreshControl
            enabled={!chartLongPressed}
            tintColor={'transparent'}
            refreshing={isRefresh}
            onRefresh={onRefresh}
          />
        }
        style={{
          display: loaded ? 'flex' : 'none',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 52 }} />
        <View
          style={{
            marginTop: 36,
            marginLeft: 24,
            marginRight: 24,
            flexDirection: 'row',
            alignItems: 'flex-end',
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
            {Utils.getDenom(investedInfo.symbol)}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode={'tail'}
            style={{
              marginLeft: 3,
              marginBottom: Platform.OS === 'android' ? 4 : 1,
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.23,
              color: Resources.Colors.greyishBrown,
            }}
          >
            {investedInfo.name}
          </Text>
        </View>

        <SummaryView
          chartLongPressed={chartLongPressed}
          investedInfo={investedInfo}
          chartInfo={chartInfo}
          chartDataType={chartDataType}
          setChartLongPressed={setChartLongPressed}
          scrolling={scrolling}
          chartLoading={chartLoading}
        />
        <ChartButtonView
          chartDataType={chartDataType}
          onPressed={(t) => {
            if (chartLoading) {
              return
            }
            Keychain.setMainChartType(t)
            setChartDataType(t)
          }}
        />
        <View
          style={{
            marginLeft: 24,
            marginRight: 24,
            marginTop: 59,
            height: 1,
            backgroundColor: Resources.Colors.dummyup,
          }}
        />
        <View
          style={{
            marginLeft: 24,
            marginRight: 24,
            height: 1,
            backgroundColor: Resources.Colors.dummydown,
          }}
        />

        {investedInfo.amount.isGreaterThan(0) ? (
          <View>
            <InfoView info={investedInfo} />
            <View
              style={{
                marginLeft: 24,
                marginRight: 24,
                marginTop: 63,
                height: 1,
                backgroundColor: Resources.Colors.dummyup,
              }}
            />
            <View
              style={{
                marginLeft: 24,
                marginRight: 24,
                height: 1,
                backgroundColor: Resources.Colors.dummydown,
              }}
            />
          </View>
        ) : (
          <View />
        )}
        <AboutView about={otherInfo.about} />
        <NewsView
          news={otherInfo.news}
          itemPressed={(item: any) => {
            props.navigation.push('InvestedNewsView', item)
          }}
        />
        <View style={{ height: 16 }} />
        <View style={{ height: safeInsetBottom }} />
      </ScrollView>

      <NavigationView navigation={props.navigation} />

      <ButtonView
        info={investedInfo}
        buyPressed={() => {
          props.navigation.navigate('TradeInput', {
            type: 'buy',
            symbol: investedInfo.symbol,
          })
        }}
        sellPressed={() => {
          props.navigation.navigate('TradeInput', {
            type: 'sell',
            symbol: investedInfo.symbol,
          })
        }}
      />
    </View>
  )
}

function SummaryView(props: {
  chartLongPressed: boolean
  investedInfo: any
  chartInfo: any
  chartDataType: Api.ChartDataType
  setChartLongPressed: (b: boolean) => void
  scrolling: any
  chartLoading: boolean
}) {
  const [draggedPrice, setDraggedPrice] = useState({
    value: new BigNumber(0),
    rate: new BigNumber(0),
  })

  return (
    <View>
      <View
        style={{
          marginTop: Platform.OS === 'ios' ? 8 : 0,
          marginLeft: 24,
          flexDirection: 'row',
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 42,
            letterSpacing: -1,
            color: Resources.Colors.white,
          }}
        >
          {
            Utils.getFormatted(
              props.chartLongPressed
                ? draggedPrice.value
                : props.investedInfo.price,
              2,
              true
            ).split('.')[0]
          }
          <Text
            style={{
              marginLeft: 1,
              marginTop: Platform.OS === 'android' ? 31 : 24,
              fontFamily: Resources.Fonts.bold,
              fontSize: 12,
              letterSpacing: 0,
              color: Resources.Colors.white,
            }}
          >
            {'.' +
              Utils.getFormatted(
                props.chartLongPressed
                  ? draggedPrice.value
                  : props.investedInfo.price,
                2,
                true
              ).split('.')[1] +
              ' ' +
              Keychain.baseCurrencyDenom}
          </Text>
        </Text>
      </View>

      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            marginLeft: 26,
            marginTop: 18,
            height: 22,
            borderRadius: 11,
            backgroundColor: (props.chartLongPressed
              ? draggedPrice.rate
              : props.chartInfo.rate
            ).isLessThan(0)
              ? Resources.Colors.brightPink
              : Resources.Colors.brightTeal,
          }}
        >
          {!(props.chartLongPressed
            ? draggedPrice.rate
            : props.chartInfo.rate
          ).isFinite() ? (
            <View
              style={{
                height: 22,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  marginLeft: 12,
                  marginRight: 12,
                  fontFamily: Resources.Fonts.bold,
                  fontSize: 14,
                  letterSpacing: -0.5,
                  color: Resources.Colors.black,
                }}
              >
                {'0%'}
              </Text>
            </View>
          ) : (
            <View
              style={{
                height: 22,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {(props.chartLongPressed
                ? draggedPrice.rate
                : props.chartInfo.rate
              ).isLessThan(0) ? (
                <Image
                  style={{
                    marginLeft: 12,
                    width: 6,
                    height: 6,
                  }}
                  source={Resources.Images.iconDecreaseB}
                />
              ) : (props.chartLongPressed
                  ? draggedPrice.rate
                  : props.chartInfo.rate
                ).isGreaterThan(0) ? (
                <Image
                  style={{
                    marginLeft: 12,
                    width: 6,
                    height: 6,
                  }}
                  source={Resources.Images.iconIncreaseB}
                />
              ) : (
                <View style={{ marginLeft: 12 }} />
              )}
              <Text
                style={{
                  marginLeft: 2,
                  marginRight: 12,
                  fontFamily: Resources.Fonts.bold,
                  fontSize: 14,
                  letterSpacing: -0.5,
                  color: Resources.Colors.black,
                }}
              >
                {Utils.getFormatted(
                  props.chartLongPressed
                    ? draggedPrice.rate
                    : props.chartInfo.rate,

                  1
                ).replace('-', '')}
                {'%'}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }} />
      </View>

      <View style={{ marginTop: 51, height: 185 }}>
        <MainChartView
          chartLongPressed={props.chartLongPressed}
          setChartLongPressed={props.setChartLongPressed}
          scrollViewScrolling={props.scrolling}
          data={{
            list: props.chartInfo.list,
            simplified: props.chartInfo.simplified,
            minValue: props.chartInfo.minValue,
            maxValue: props.chartInfo.maxValue,
            rate: props.chartInfo.rate,
          }}
          valueChanged={setDraggedPrice}
        />
        {props.chartLoading ? (
          <View
            style={{
              position: 'absolute',
              width: Resources.windowSize().width,
              height: 185,
              justifyContent: 'space-around',
            }}
          >
            <ActivityIndicator size='small' color='#ffffff' />
          </View>
        ) : (
          <View />
        )}
      </View>
    </View>
  )
}

function ChartButton(props: {
  selected: boolean
  title: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        borderColor: props.selected ? Resources.Colors.darkGrey : 'transparent',
        backgroundColor: props.selected
          ? Resources.Colors.darkGrey
          : 'transparent',
        borderWidth: props.selected ? 1 : 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={props.onPress}
    >
      <Text
        style={{
          fontFamily: Resources.Fonts.bold,
          fontSize: 12,
          color: props.selected ? 'white' : Resources.Colors.greyishBrown,
        }}
      >
        {props.title}
      </Text>
    </TouchableOpacity>
  )
}

function InfoView(props: { info: any }) {
  const { translations } = useContext(ConfigContext)
  const styles = StyleSheet.create({
    title: {
      fontFamily: Resources.Fonts.book,
      fontSize: 18,
      letterSpacing: -0.5,
      color: Resources.Colors.greyishBrown,
    },
    value1: {
      fontFamily: Resources.Fonts.medium,
      fontSize: 18,
      letterSpacing: -0.2,
      color: Resources.Colors.veryLightPinkTwo,
    },
    value2: {
      marginLeft: 1,
      marginTop: 6,
      fontFamily: Resources.Fonts.medium,
      fontSize: 10,
      letterSpacing: -0.14,
      color: Resources.Colors.veryLightPinkTwo,
    },
    icon: {
      marginRight: 5,
      width: 6,
      height: 6,
    },
  })

  return (
    <View style={{ marginLeft: 24, marginRight: 24 }}>
      <Text
        style={{
          marginTop: 56,
          fontFamily: Resources.Fonts.medium,
          fontSize: 14,
          letterSpacing: -0.2,
          color: Resources.Colors.brightTeal,
        }}
      >
        {translations.investedDetailView.investedDetail}
      </Text>
      <View
        style={{
          marginTop: 32,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={styles.title}>
          {translations.investedDetailView.currentValue}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.value1}>
          {Utils.getFormatted(props.info.currentValue, 2, true)}
        </Text>
        <Text style={styles.value2}>{Keychain.baseCurrencyDenom}</Text>
      </View>

      <View
        style={{
          marginTop: 19,
          flexDirection: 'row',
        }}
      >
        <Text style={styles.title}>
          {translations.investedDetailView.amount}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.value1}>
          {Utils.getFormatted(props.info.amount, 6, true)}
        </Text>
        <Text style={styles.value2}>{props.info.symbol}</Text>
      </View>

      <View
        style={{
          marginTop: 19,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={styles.title}>
          {translations.investedDetailView.avgCost}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.value1}>
          {Utils.getFormatted(props.info.averagePrice, 2, true)}
        </Text>
        <Text style={styles.value2}>{Keychain.baseCurrencyDenom}</Text>
      </View>

      <View
        style={{
          marginTop: 19,
          flexDirection: 'row',
        }}
      >
        <Text style={[styles.title, { flex: 1 }]}>
          {translations.investedDetailView.ret}
        </Text>
        {props.info.ret.isNaN() || !props.info.ret.isFinite() ? (
          <Text style={styles.value1}>{'0%'}</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {props.info.ret.isLessThan(0) ? (
              <Image
                style={styles.icon}
                source={Resources.Images.iconDecrease}
              />
            ) : props.info.ret.isGreaterThan(0) ? (
              <Image
                style={styles.icon}
                source={Resources.Images.iconIncrease}
              />
            ) : (
              <View />
            )}
            <Text
              style={[
                styles.value1,
                props.info.ret.isLessThan(0)
                  ? {
                      color: Resources.Colors.brightPink,
                    }
                  : props.info.ret.isGreaterThan(0)
                  ? { color: Resources.Colors.brightTeal }
                  : {
                      color: Resources.Colors.veryLightPinkTwo,
                    },
              ]}
            >
              {Utils.getFormatted(
                props.info.ret.multipliedBy(100),
                2,
                true
              ).replace('-', '') + '%'}
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          marginTop: 21,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Text style={[styles.title, { flex: 1 }]}>
          {translations.investedDetailView.pl}
        </Text>
        {props.info.unrealizedPL.isLessThan(0) ? (
          <Image style={styles.icon} source={Resources.Images.iconDecrease} />
        ) : props.info.unrealizedPL.isGreaterThan(0) ? (
          <Image style={styles.icon} source={Resources.Images.iconIncrease} />
        ) : (
          <View />
        )}
        <Text
          style={[
            styles.value1,
            props.info.unrealizedPL.isLessThan(0)
              ? {
                  color: Resources.Colors.brightPink,
                }
              : props.info.unrealizedPL.isGreaterThan(0)
              ? { color: Resources.Colors.brightTeal }
              : {
                  color: Resources.Colors.veryLightPinkTwo,
                },
          ]}
        >
          {Utils.getFormatted(props.info.unrealizedPL, 2, true).replace(
            '-',
            ''
          )}
        </Text>
        <Text
          style={[
            styles.value2,
            props.info.unrealizedPL.isLessThan(0)
              ? {
                  color: Resources.Colors.brightPink,
                }
              : props.info.unrealizedPL.isGreaterThan(0)
              ? { color: Resources.Colors.brightTeal }
              : {
                  color: Resources.Colors.veryLightPinkTwo,
                },
          ]}
        >
          {Keychain.baseCurrencyDenom}
        </Text>
      </View>
    </View>
  )
}

function AboutView(props: { about: string }) {
  const { translations } = useContext(ConfigContext)
  const [showMore, setShowMore] = useState(false)

  if (props.about == '') {
    return <View />
  }

  return (
    <View>
      <Text
        style={{
          marginTop: 67,
          marginLeft: 24,
          fontFamily: Resources.Fonts.medium,
          fontSize: 14,
          letterSpacing: -0.2,
          color: Resources.Colors.brightTeal,
        }}
      >
        {translations.investedDetailView.about}
      </Text>

      <View style={{ marginLeft: 24, marginRight: 24, marginTop: 22 }}>
        <Text
          numberOfLines={showMore ? 10000 : 3}
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 18,
            letterSpacing: -0.5,
            lineHeight: 24,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.about}
        </Text>
      </View>

      <TouchableOpacity
        style={{
          marginLeft: 24,
          marginTop: -1,
          height: 36,
          justifyContent: 'center',
        }}
        onPress={() => {
          setShowMore(!showMore)
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.17,
            color: Resources.Colors.sea,
          }}
        >
          {!showMore
            ? translations.investedDetailView.showmore
            : translations.investedDetailView.showless}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

function NewsView(props: { news: any; itemPressed: (news: any) => void }) {
  const { translations } = useContext(ConfigContext)

  if (props.news.length == 0) {
    return <View />
  }

  return (
    <View>
      <View
        style={{
          marginLeft: 24,
          marginRight: 24,
          marginTop: 45,
          height: 1,
          backgroundColor: Resources.Colors.dummyup,
        }}
      />
      <View
        style={{
          marginLeft: 24,
          marginRight: 24,
          height: 1,
          backgroundColor: Resources.Colors.dummydown,
        }}
      />
      {/* News */}

      <Text
        style={{
          marginTop: 56,
          marginLeft: 24,
          marginBottom: 32,
          fontFamily: Resources.Fonts.medium,
          fontSize: 14,
          letterSpacing: -0.2,
          color: Resources.Colors.brightTeal,
        }}
      >
        {translations.investedDetailView.news}
      </Text>

      {props.news.map((item: any, index: number) => {
        return (
          <NewsItem
            key={index}
            item={item}
            itemPressed={(item: any) => {
              props.itemPressed(item)
            }}
          />
        )
      })}
    </View>
  )
}

function NewsItem(props: { item: any; itemPressed: (news: any) => void }) {
  const now = new Date().getTime()
  const written = props.item.timestamp
  let date = (now - written) / 1000
  date = parseInt((date / (60 * 60 * 24) + 1).toString())
  return (
    <ThrottleButton
      type='RectButton'
      style={{
        marginLeft: 24,
        marginRight: 24,
        marginBottom: 50,
      }}
      onPress={() => {
        props.itemPressed(props.item)
      }}
    >
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <Text
          numberOfLines={3}
          ellipsizeMode={'tail'}
          style={{
            flex: 1,
            fontFamily: Resources.Fonts.book,
            fontSize: 18,
            marginTop: 5,
            letterSpacing: -0.5,
            lineHeight: 24,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.item.title}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 20 }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.4,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.item.source}
        </Text>
        <Text
          style={{
            marginLeft: 5,
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.3,
            color: Resources.Colors.greyishBrown,
          }}
        >
          {date <= 30
            ? date + 'D ago'
            : date <= 365
            ? parseInt((date / 30 + 1).toString()) + 'M ago'
            : parseInt((date / 365 + 1).toString()) + 'Y ago'}
        </Text>
      </View>
    </ThrottleButton>
  )
}

function ButtonView(props: {
  info: any
  buyPressed: () => void
  sellPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const sellAvailable = props.info.amount.isGreaterThan(new BigNumber('0'))

  if (props.info.symbol == '') {
    return <View />
  }

  return (
    <View
      style={{
        height: 93 + safeInsetBottom,
        backgroundColor: Resources.Colors.darkGreyFour,
        flexDirection: 'row',
        paddingTop: 23,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <RectButton
        style={{ flex: 1, height: 48 }}
        onPress={() => {
          props.buyPressed()
        }}
      >
        <View
          style={{
            height: 48,
            borderRadius: 24,
            backgroundColor: Resources.Colors.brightTeal,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: Resources.Colors.black,
              fontFamily: Resources.Fonts.bold,
              fontSize: 16,
              letterSpacing: -0.3,
              textAlign: 'center',
              flex: 1,
            }}
          >
            {translations.investedDetailView.buy}
          </Text>
        </View>
      </RectButton>

      {sellAvailable ? <View style={{ width: 9 }} /> : <View />}

      {sellAvailable ? (
        <RectButton
          style={{ flex: 1, height: 48 }}
          onPress={() => {
            props.sellPressed()
          }}
        >
          <View
            style={{
              height: 48,
              borderRadius: 24,
              backgroundColor: Resources.Colors.brightTeal,
            }}
          >
            <View
              style={{
                backgroundColor: Resources.Colors.darkGreyFour,
                height: 44,
                borderRadius: 22,
                margin: 2,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: Resources.Colors.brightTeal,
                  fontFamily: Resources.Fonts.bold,
                  fontSize: 16,
                  letterSpacing: -0.3,
                  textAlign: 'center',
                  flex: 1,
                }}
              >
                {translations.investedDetailView.sell}
              </Text>
            </View>
          </View>
        </RectButton>
      ) : (
        <View />
      )}
    </View>
  )
}

function ChartButtonView(props: {
  chartDataType: Api.ChartDataType
  onPressed: (t: Api.ChartDataType) => void
}) {
  return (
    <View
      style={{
        marginLeft: 31,
        marginRight: 31,
        marginTop: 65,
        height: 32,
        flexDirection: 'row',
      }}
    >
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.day}
        title={'1D'}
        onPress={() => {
          props.onPressed(Api.ChartDataType.day)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.week}
        title={'1W'}
        onPress={() => {
          props.onPressed(Api.ChartDataType.week)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.month}
        title={'1M'}
        onPress={() => {
          props.onPressed(Api.ChartDataType.month)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.year}
        title={'1Y'}
        onPress={() => {
          props.onPressed(Api.ChartDataType.year)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.three_year}
        title={'3Y'}
        onPress={() => {
          props.onPressed(Api.ChartDataType.three_year)
        }}
      />
    </View>
  )
}
