import React, { useState, useCallback, useEffect } from 'react'
import { Image, View } from 'react-native'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import * as Keychain from '../../common/Keychain'
import BigNumber from 'bignumber.js'
import { useFocusEffect } from '@react-navigation/native'
import { MainTab1NoAssetView } from './MainTab1NoAssetView'
import { MainTab1AssetView } from './MainTab1AssetView'

export interface InvestedInfo {
  total: BigNumber
  asset: BigNumber
  balance: BigNumber
  investedRate: BigNumber
  list: GQL_AssetList1[]
}

export interface ChartInfo {
  rate: BigNumber
  simplified: {
    time: number
    value: BigNumber
  }[]
  list: {
    time: number
    value: BigNumber
    formattedTime: string
    rate: BigNumber
  }[]
  maxValue: BigNumber
  minValue: BigNumber
}

export function MainTab1(props: {
  navigation: any
  route: any
  selectedTab: number
  setChartLongPressed: (b: boolean) => void
  chartLongPressed: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [investedInfo, setInvestedInfo] = useState({
    total: new BigNumber(0),
    asset: new BigNumber(0),
    balance: new BigNumber(0),
    investedRate: new BigNumber(0),
    list: [] as GQL_AssetList1[],
  } as InvestedInfo)
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
  } as ChartInfo)

  const [chartDataType, setChartDataType] = useState(Api.ChartDataType.month)
  const [isRefresh, setRefresh] = useState(false)
  const [chartLoading, setChartLoading] = useState(false)
  const [welcomePageDone, setWelcomePageDone] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (props.selectedTab == 0) {
        Keychain.getMainChartType().then((type) => {
          setChartDataType(type)
        })

        Api.getHaveBalanceHistory()
          .then((haveBalanceHistory) => {
            if (haveBalanceHistory) {
              Keychain.setWelcomeDone()
            }
          })
          .catch(() => {})

        Keychain.isWelcomePageDone().then((done) => {
          setWelcomePageDone(done)
        })

        load()
          .then(() => {
            setLoaded(true)
          })
          .catch(() => {
            setLoaded(true)
          })

        loadChartData()
          .then(() => {
            setChartLoading(false)
          })
          .catch(() => {
            setChartLoading(false)
          })
      }

      return () => {}
    }, [props.selectedTab, chartDataType])
  )

  async function load() {
    const uusd: BigNumber = await Api.getUstBalance()
    let assets: GQL_AssetList1[] = await Api.getAssetBalances()

    assets = assets.sort((item1, item2) => {
      const amount1 = new BigNumber(item1.amount)
      const price1 = new BigNumber(item1.price)
      const value1 = amount1.multipliedBy(price1)

      const amount2 = new BigNumber(item2.amount)
      const price2 = new BigNumber(item2.price)
      const value2 = amount2.multipliedBy(price2)

      return value2.isGreaterThan(value1) ? 1 : 0
    })

    let total = new BigNumber(0.0)
    let asset = new BigNumber(0.0)
    for (let i = 0; i < assets.length; i++) {
      const item = assets[i]
      const amount = new BigNumber(item.amount)
      const price = new BigNumber(item.price)
      total = total.plus(amount.multipliedBy(price))
      asset = asset.plus(amount.multipliedBy(price))
    }

    asset = asset.dividedBy(1000000)

    total = total.plus(uusd)
    total = total.dividedBy(1000000)

    const sumTotal: BigNumber = uusd.dividedBy(1000000).plus(total)
    var rate = new BigNumber(0)
    if (!sumTotal.isEqualTo(new BigNumber(0))) {
      rate = asset.dividedBy(sumTotal).multipliedBy(100)
    }

    setInvestedInfo({
      total: total,
      asset: asset,
      balance: uusd,
      investedRate: Utils.getCutNumber(rate, 1),
      list: assets,
    })
  }

  async function loadChartData() {
    if (chartLoading) {
      return
    }

    setChartLoading(true)
    const type = await Keychain.getMainChartType()
    const info: GQL_AssetChartList = await Api.summaryChart(type)

    let firstPrice = new BigNumber(0)
    if (info.list.length > 0) {
      firstPrice = Utils.getCutNumber(new BigNumber(info.list[0].price), 0)
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

      let rate = new BigNumber(0)

      if (!firstPrice.isEqualTo(0)) {
        const now = new BigNumber(item.price)
        rate = now.dividedBy(firstPrice).minus(1).multipliedBy(100)
      }

      return {
        time: item.timestamp,
        value: Utils.getCutNumber(new BigNumber(item.price), 0),
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
    const lastValue = new BigNumber(list[list.length - 1].value)
    let rate = new BigNumber(0)
    if (!firstPrice.isEqualTo(0)) {
      rate = lastValue.dividedBy(firstPrice).minus(1).multipliedBy(100)
    }

    setChartInfo({
      rate: rate,
      simplified: simplified,
      list: list,
      minValue: new BigNumber(info.minValue),
      maxValue: new BigNumber(info.maxValue),
    })
  }

  const onRefresh = React.useCallback(() => {
    setRefresh(true)
    load()
      .then(() => {
        loadChartData()
      })
      .then(() => {
        setChartLoading(false)
        setRefresh(false)
        setLoaded(true)
      })
      .catch(() => {
        setChartLoading(false)
        setRefresh(false)
        setLoaded(true)
      })
  }, [isRefresh, investedInfo, chartInfo])

  return (
    <View>
      {loaded && (
        <>
          <View style={{ flex: 1 }}>
            {!welcomePageDone ? (
              <MainTab1NoAssetView
                balance={investedInfo.balance}
                topupPressed={() => {
                  props.navigation.navigate('RampStack', {
                    screen: 'RampSelectView',
                    params: { withdraw: false },
                  })
                }}
              />
            ) : (
              <MainTab1AssetView
                navigation={props.navigation}
                route={props.route}
                chartLoading={chartLoading}
                info={investedInfo}
                isRefresh={isRefresh}
                onRefresh={onRefresh}
                setChartLongPressed={props.setChartLongPressed}
                chartLongPressed={props.chartLongPressed}
                chartInfo={chartInfo}
                chartDataType={chartDataType}
                setChartDataType={setChartDataType}
                itemPressed={(symbol) => {
                  props.navigation.push('InvestedDetail', { symbol: symbol })
                }}
              />
            )}
          </View>
        </>
      )}
    </View>
  )
}
