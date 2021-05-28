import React, { useState, useCallback, useContext } from 'react'
import { Text, View, RefreshControl, Animated } from 'react-native'
import * as Resources from '../../common/Resources'
import { useFocusEffect } from '@react-navigation/native'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { MainTab2ItemView } from './MainTab2ItemView'

export function MainTab2(props: {
  navigation: any
  selectedTab: number
  tab2ScrollY: any
  assetList: GQL_AssetList1[]
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
  const [stockList, setStockList] = useState([] as GQL_AssetList1[])
  const [isRefresh, setRefresh] = useState(false)

  const [showPercent, setShowPercent] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (props.selectedTab == 1) {
        load()
          .then((v) => {
            setRefresh(false)
          })
          .catch((error) => {
            setRefresh(false)
          })
      }
    }, [props.selectedTab, props.assetList])
  )
  async function load() {
    const products = props.assetList

    let stock: GQL_AssetList1[] = []
    for (let i = 0; i < products.length; i++) {
      const item = products[i]
      stock.push(item)
    }

    setStockList(stock)
  }

  const onRefresh = React.useCallback(() => {
    setRefresh(true)
    load()
      .then(() => {
        setRefresh(false)
      })
      .catch((error) => {
        setRefresh(false)
      })
  }, [isRefresh, stockList])

  return (
    <View style={{ flex: 1, width: Resources.windowSize().width }}>
      {stockList.length > 0 && (
        <Animated.FlatList
          style={{ flex: 1 }}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: { y: props.tab2ScrollY },
                },
              },
            ],
            { useNativeDriver: true }
          )}
          refreshControl={
            <RefreshControl
              tintColor={'transparent'}
              refreshing={isRefresh}
              onRefresh={onRefresh}
            />
          }
          ListHeaderComponent={() => {
            return <ListHeader />
          }}
          ListFooterComponent={() => {
            return <View style={{ height: safeInsetBottom + 20 }} />
          }}
          data={stockList}
          keyExtractor={(item, index) => index.toString()}
          renderItem={(item) => {
            return (
              <MainTab2ItemView
                detailPressed={(token) => {
                  props.navigation.push('InvestedDetail', { token })
                }}
                _item={item}
                setShowPercent={setShowPercent}
                showPercent={showPercent}
              />
            )
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

function ListHeader() {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  return (
    <View>
      <View style={{ height: 180 + safeInsetTop }} />
      <View
        style={{
          marginLeft: 24,
          marginRight: 24,
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
          marginTop: 65,
          marginLeft: 24,
          marginRight: 24,
          flexDirection: 'row',
          alignItems: 'center',
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
          {translations.mainTab2View.mirrorAsset}
        </Text>
      </View>

      <View style={{ height: 21 }} />
    </View>
  )
}
