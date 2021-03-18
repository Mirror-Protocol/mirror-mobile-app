import React, { useState, useContext, useRef } from 'react'
import { Text, View, Image, RefreshControl, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler'
import BigNumber from 'bignumber.js'
import { MainChartView } from './MainChartView'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { ChartInfo, InvestedInfo } from './MainTab1'
import ThrottleButton from '../../component/ThrottleButton'
import { useNavigation } from '@react-navigation/native'
import BuyButton from '../common/BuyButton'
import usePending from '../../hooks/usePending'

export function MainTab1AssetView(props: {
  navigation: any
  route: any
  chartLoading: boolean
  info: InvestedInfo
  chartInfo: ChartInfo
  isRefresh: boolean
  onRefresh: any
  setChartLongPressed: (b: boolean) => void
  chartLongPressed: boolean
  chartDataType: Api.ChartDataType
  setChartDataType: (t: Api.ChartDataType) => void
  itemPressed: (symbol: string) => void
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const scrolling = useRef(false)
  const navigation = useNavigation()

  const { pendingData } = usePending()

  return (
    <ScrollView
      onScrollBeginDrag={() => {
        scrolling.current = true
      }}
      onScrollEndDrag={() => {
        scrolling.current = false
      }}
      scrollEnabled={!props.chartLongPressed}
      style={{
        height: Resources.windowSize().height - safeInsetTop,
        width: Resources.windowSize().width,
      }}
      refreshControl={
        <RefreshControl
          enabled={!props.chartLongPressed}
          tintColor={'transparent'}
          refreshing={props.isRefresh}
          onRefresh={props.onRefresh}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flex: 1 }}>
        <View style={{ height: 52 + safeInsetTop }} />
        <View>
          <SummaryView
            info={props.info}
            chartLongPressed={props.chartLongPressed}
            chartInfo={props.chartInfo}
            setChartLongPressed={props.setChartLongPressed}
            scrolling={scrolling}
          />
          <ChartButtons
            chartDataType={props.chartDataType}
            buttonPressed={(type: Api.ChartDataType) => {
              if (props.chartLoading) {
                return
              }
              Keychain.setMainChartType(type)
              props.setChartDataType(type)
            }}
          />

          <View
            style={{
              marginLeft: 24,
              marginRight: 24,
              marginTop: 64,
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
          {props.info.balance.isGreaterThan(0) ? (
            <>
              <View
                style={{
                  marginLeft: 24,
                  marginRight: 24,
                  marginTop: 59,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      letterSpacing: -0.2,
                      fontFamily: Resources.Fonts.medium,
                      fontSize: 14,
                      color: Resources.Colors.brightTeal,
                    }}
                  >
                    {translations.mainTab1View.buyingPower}
                  </Text>
                  <View style={{ flexDirection: 'row' }}>
                    <Text
                      style={{
                        fontFamily: Resources.Fonts.medium,
                        fontSize: 18,
                        letterSpacing: -0.5,
                        color: Resources.Colors.veryLightPinkTwo,
                      }}
                    >
                      {
                        Utils.getFormatted(
                          props.info.balance.dividedBy(1000000),
                          2,
                          true
                        ).split('.')[0]
                      }
                    </Text>
                    <Text
                      style={{
                        fontFamily: Resources.Fonts.medium,
                        fontSize: 10,
                        letterSpacing: -0.3,
                        color: Resources.Colors.veryLightPinkTwo,
                        bottom: Platform.OS === 'ios' ? -7 : -9,
                      }}
                    >
                      {'.' +
                        Utils.getFormatted(
                          props.info.balance.dividedBy(1000000),
                          2,
                          true
                        ).split('.')[1]}
                    </Text>
                    <Text
                      style={{
                        fontFamily: Resources.Fonts.medium,
                        fontSize: 10,
                        letterSpacing: -0.3,
                        color: Resources.Colors.veryLightPinkTwo,
                        bottom: Platform.OS === 'ios' ? -7 : -9,
                      }}
                    >
                      {' '}
                      {translations.mainTab1View.symbol}
                    </Text>
                  </View>
                </View>
              </View>

              <ProgressBar
                percent={new BigNumber(100).minus(props.info.investedRate)}
              />

              <View
                style={{
                  display: props.info.list.length == 0 ? 'none' : 'flex',
                }}
              >
                <View
                  style={{
                    marginLeft: 24,
                    marginRight: 24,
                    marginTop: 56,
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
                <View
                  style={{
                    marginTop: 56,
                    marginBottom: 17,
                    marginLeft: 24,
                    marginRight: 24,
                    flexDirection: 'row',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      letterSpacing: -0.2,
                      fontFamily: Resources.Fonts.medium,
                      fontSize: 14,
                      color: Resources.Colors.brightTeal,
                    }}
                  >
                    {translations.mainTab1View.investedbalance}
                  </Text>
                </View>

                {props.info.list.map((item, index) => {
                  if (item.symbol.toLowerCase() === 'mir') return null

                  return (
                    <ItemView
                      key={index}
                      itemPressed={(symbol: string) => {
                        props.itemPressed(symbol)
                      }}
                      item={item}
                    />
                  )
                })}
              </View>
            </>
          ) : (
            <>
              <BuyButton
                navigation={props.navigation}
                route={props.route}
                topupPressed={() => {
                  navigation.navigate('RampStack', {
                    screen: 'RampSelectView',
                    params: { withdraw: false },
                  })
                }}
                pendingData={pendingData}
                title={translations.walletSummaryView.deposit}
                titleIcon={Resources.Images.iconBuyG}
                withdraw={false}
              />
            </>
          )}
        </View>
        <View style={{ height: safeInsetBottom + 20 }} />
      </View>
    </ScrollView>
  )
}

function SummaryView(props: {
  chartLongPressed: boolean
  info: InvestedInfo
  chartInfo: ChartInfo
  setChartLongPressed: (b: boolean) => void
  scrolling: any
}) {
  const [draggedPrice, setDraggedPrice] = useState({
    value: new BigNumber(0),
    rate: new BigNumber(0),
  })
  const [measuredTextHeight, setMeasuredTextHeight] = useState(0)

  return (
    <View>
      <View
        style={{
          marginTop: 58,
          marginLeft: 24,
          marginRight: 24,
          height: 60,
          flexDirection: 'row',
          alignItems: 'flex-end',
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={{
            maxWidth: Resources.windowSize().width - 120,
            fontFamily: Resources.Fonts.medium,
            fontSize: 52,
            letterSpacing: -1,
            color: '#ffffff',
          }}
          onLayout={(e) => {
            setMeasuredTextHeight(e.nativeEvent.layout.height)
          }}
        >
          {
            Utils.getFormatted(
              props.chartLongPressed
                ? draggedPrice.value.dividedBy(1000000)
                : props.info.total,
              2,
              true
            ).split('.')[0]
          }
        </Text>
        <Text
          style={{
            marginBottom: measuredTextHeight * 0.12,
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -1,
            color: '#ffffff',
          }}
        >
          {'.' +
            Utils.getFormatted(
              props.chartLongPressed
                ? draggedPrice.value.dividedBy(1000000)
                : props.info.total,
              2,
              true
            ).split('.')[1] +
            ' ' +
            Keychain.baseCurrencyDenom}
        </Text>
      </View>
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            marginLeft: 26,
            marginTop: 10,
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
                flex: 1,
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
                flex: 1,
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
                <View
                  style={{
                    marginLeft: 12,
                  }}
                />
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

      <View style={{ marginTop: 28 }} />
      <View style={{ height: 185 }}>
        <MainChartView
          chartLongPressed={props.chartLongPressed}
          setChartLongPressed={props.setChartLongPressed}
          scrollViewScrolling={props.scrolling}
          data={props.chartInfo}
          valueChanged={setDraggedPrice}
        />
      </View>
    </View>
  )
}

function ChartButtons(props: {
  chartDataType: Api.ChartDataType
  buttonPressed: (t: Api.ChartDataType) => void
}) {
  return (
    <View
      style={{
        marginLeft: 31,
        marginRight: 31,
        marginTop: 24,
        height: 32,
        flexDirection: 'row',
      }}
    >
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.day}
        title={'1D'}
        onPress={() => {
          props.buttonPressed(Api.ChartDataType.day)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.week}
        title={'1W'}
        onPress={() => {
          props.buttonPressed(Api.ChartDataType.week)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.month}
        title={'1M'}
        onPress={() => {
          props.buttonPressed(Api.ChartDataType.month)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.year}
        title={'1Y'}
        onPress={() => {
          props.buttonPressed(Api.ChartDataType.year)
        }}
      />
      <View style={{ flex: 1 }} />
      <ChartButton
        selected={props.chartDataType == Api.ChartDataType.three_year}
        title={'3Y'}
        onPress={() => {
          props.buttonPressed(Api.ChartDataType.three_year)
        }}
      />
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

function ProgressBar(props: { percent: BigNumber }) {
  const marginLeft = 24
  const marginRight = 24
  const width = Resources.windowSize().width - marginLeft - marginRight

  return (
    <View
      style={{
        marginTop: 19,
        marginLeft: marginLeft,
        marginRight: marginRight,
        overflow: 'hidden',
        height: 16,
        backgroundColor: Resources.Colors.darkGrey,
        borderRadius: 7,
      }}
    >
      <View
        style={{
          width: (width * props.percent.toNumber()) / 100,
          height: 16,
          borderRadius: 7,
          backgroundColor: Resources.Colors.aquamarine,
        }}
      />
    </View>
  )
}

function ItemView(props: {
  itemPressed: (symbol: string) => void
  item: GQL_AssetList1
}) {
  const item = props.item

  //내 가치.
  const value = new BigNumber(item.price)
    .multipliedBy(new BigNumber(item.amount))
    .dividedBy(1000000)

  const symbol = item.symbol

  //정수, 소수
  const value1 = Utils.getFormatted(value, 2, true).split('.')[0]
  const value2 = Utils.getFormatted(value, 2, true).split('.')[1]

  //수익률
  const avgPrice = new BigNumber(item.averagePrice)
  let rate = new BigNumber(0)
  if (!avgPrice.isEqualTo(0)) {
    rate = new BigNumber(item.price)
      .dividedBy(avgPrice)
      .minus(1)
      .multipliedBy(100)
  }

  return (
    <ThrottleButton
      type={'TouchableOpacity'}
      style={{
        marginLeft: 24,
        marginRight: 24,
        height: 72,
        justifyContent: 'center',
      }}
      onPress={() => {
        props.itemPressed(symbol)
      }}
    >
      <Text
        style={{
          color: Resources.Colors.greyishBrown,
          fontFamily: Resources.Fonts.bold,
          fontSize: 42,
          letterSpacing: -1.43,
        }}
      >
        {Utils.getDenom(symbol)}
      </Text>
      <View
        style={{
          position: 'absolute',
          top: 18,
          right: 0,
          alignItems: 'flex-end',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 18,
              letterSpacing: -0.56,
              color: Resources.Colors.veryLightPinkTwo,
            }}
          >
            {value1}
          </Text>
          <Text
            style={{
              marginBottom: 2,
              fontFamily: Resources.Fonts.medium,
              fontSize: 10,
              letterSpacing: -0.3,
              color: Resources.Colors.veryLightPinkTwo,
            }}
          >
            {'.' + value2 + ' ' + Keychain.baseCurrencyDenom}
          </Text>
        </View>
        <View
          style={{
            marginTop: 3,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {rate.isLessThan(0) ? (
            <Image
              style={{ width: 6, height: 6 }}
              source={Resources.Images.iconDecrease}
            />
          ) : rate.isGreaterThan(0) ? (
            <Image
              style={{ width: 6, height: 6 }}
              source={Resources.Images.iconIncrease}
            />
          ) : (
            <View />
          )}
          <Text
            style={{
              marginLeft: 2,
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.38,
              color: Resources.Colors.veryLightPinkTwo,
            }}
          >
            {Utils.getFormatted(rate, 1, true).replace('-', '') + '%'}
          </Text>
        </View>
      </View>
    </ThrottleButton>
  )
}
