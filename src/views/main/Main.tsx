import React, { useState, useCallback, useRef, useContext } from 'react'
import { Text, View, Image, Animated, Platform } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Api from '../../common/Apis/Api'
import { useFocusEffect } from '@react-navigation/native'
import { TouchableOpacity, RectButton } from 'react-native-gesture-handler'
import { MainTab1 } from './MainTab1'
import { MainTab2 } from './MainTab2'
import { BlurView } from '@react-native-community/blur'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { Search } from './Search'
import ThrottleButton from '../../component/ThrottleButton'

export function Main(props: { navigation: any; route: any }) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const { translations } = useContext(ConfigContext)
  const [selectedTab, setTab] = useState(0)
  const [chartLongPressed, setChartLongPressed] = useState(false)

  const [assetList, setAssetList] = useState([] as GQL_AssetList1[])
  const [showSearchView, setShowSearchView] = useState(false)

  const scrollView = useRef(null as any)

  const [measuredText1Layout, setMeasuredText1Layout] = useState({
    x: 0,
    width: 0,
  })
  const [measuredText2Layout, setMeasuredText2Layout] = useState({
    x: 0,
    width: 0,
  })

  const scrollX = useRef(new Animated.Value(0)).current
  const tab2ScrollY = useRef(new Animated.Value(0)).current
  const scrollXRef = useRef(0)
  const headerIndicatorLeft = scrollX.interpolate({
    inputRange: [0, Resources.windowSize().width],
    outputRange: [38, 122],
    extrapolate: 'clamp',
  })
  const headerIndicatorWidth = scrollX.interpolate({
    inputRange: [
      0,
      Resources.windowSize().width / 2,
      Resources.windowSize().width,
    ],
    outputRange: [measuredText1Layout.width, 90, measuredText2Layout.width],
    extrapolate: 'clamp',
  })

  scrollX.addListener((e) => {
    const offset = 30
    const x = e.value
    scrollXRef.current = x
    if (
      parseInt(x.toString()) >=
      parseInt(Resources.windowSize().width.toString()) - offset
    ) {
      setTab(1)
    } else if (x <= 0 + offset) {
      setTab(0)
    } else {
    }
  })

  useFocusEffect(
    useCallback(() => {
      Api.assetList(true, true).then((list) => {
        setAssetList(list)
      })
    }, [selectedTab])
  )

  const searchBarMarginTop = tab2ScrollY.interpolate({
    inputRange: [0, 32],
    outputRange: [0, -32],
    extrapolate: 'clamp',
  })

  return (
    <View
      style={{
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      <Animated.ScrollView
        ref={(sv: any) => {
          scrollView.current = sv
        }}
        scrollEnabled={!chartLongPressed}
        horizontal={true}
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        showsVerticalScrollIndicator={false}
      >
        <MainTab1
          navigation={props.navigation}
          route={props.route}
          selectedTab={selectedTab}
          setChartLongPressed={(b: boolean) => {
            if (scrollXRef.current == 0) {
              setChartLongPressed(b)
            }
          }}
          chartLongPressed={chartLongPressed}
        />
        <MainTab2
          navigation={props.navigation}
          selectedTab={selectedTab}
          tab2ScrollY={tab2ScrollY}
          assetList={assetList}
        />

        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            overflow: 'hidden',
            width: '100%',
            height: 52 + safeInsetTop,
          }}
        >
          {Platform.OS === 'android' ? (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: Resources.Colors.darkBackground,
                opacity: 1,
              }}
            />
          ) : (
            <BlurView style={{ width: '100%', height: '100%' }} />
          )}
        </View>
        <View
          style={{
            position: 'absolute',
            left: Resources.windowSize().width,
            top: 0,
            overflow: 'hidden',
            width: '100%',
            height: 150 + safeInsetTop,
          }}
        >
          {Platform.OS === 'android' ? (
            <View
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: Resources.Colors.darkBackground,
                opacity: 1,
              }}
            />
          ) : (
            <BlurView style={{ width: '100%', height: '100%' }} />
          )}
        </View>
        <Animated.View
          style={{
            transform: [{ translateY: searchBarMarginTop }],
            position: 'absolute',
            top: 52 + safeInsetTop,
            left: Resources.windowSize().width,
            width: Resources.windowSize().width,
          }}
        >
          <RectButton
            style={{
              marginTop: 48,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: Resources.Colors.darkGreyFour,
              borderRadius: 16,
              height: 64,
              marginLeft: 24,
              marginRight: 24,
            }}
            onPress={() => {
              setShowSearchView(true)
            }}
          >
            <Image
              style={{ width: 14, height: 14, marginLeft: 16 }}
              source={Resources.Images.iconSearch}
            />
            <Text
              style={{
                marginLeft: 6,
                fontFamily: Resources.Fonts.book,
                fontSize: 14,
                letterSpacing: -0.5,
                color: Resources.Colors.greyishBrown,
              }}
            >
              {translations.mainView.searchPlaceholder}
            </Text>
          </RectButton>
        </Animated.View>
      </Animated.ScrollView>

      <Header
        selectedTab={selectedTab}
        setMeasuredText1Layout={setMeasuredText1Layout}
        setMeasuredText2Layout={setMeasuredText2Layout}
        setTab={(index: number) => {
          if (scrollView.current) {
            const x = index != 0 ? Resources.windowSize().width : 0
            scrollView.current.scrollTo({
              x: x,
              y: 0,
              animated: true,
            })
          }
        }}
        walletPressed={() => {
          props.navigation.push('WalletStack')
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          left: 24,
          transform: [
            { translateX: headerIndicatorLeft },
            {
              scaleX: headerIndicatorWidth,
            },
          ],
          top:
            Platform.OS === 'android' ? safeInsetTop + 45 : safeInsetTop + 42,
          width: 1,
          height: 2,
          backgroundColor: Resources.Colors.brightTeal,
        }}
      />

      {showSearchView ? (
        <Search
          onDismissPressed={() => {
            setShowSearchView(false)
          }}
          onItemPressed={(symbol) => {
            props.navigation.push('InvestedDetail', { symbol: symbol })
          }}
        />
      ) : (
        <View />
      )}
    </View>
  )
}

function Header(props: {
  selectedTab: number
  setTab: (t: number) => void
  walletPressed: () => void
  setMeasuredText1Layout: any
  setMeasuredText2Layout: any
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        width: '100%',
        top: 0,
        paddingTop: 19 + safeInsetTop,
        height: 52 + safeInsetTop,
        flexDirection: 'row',
      }}
    >
      <TouchableOpacity
        onPress={() => {
          props.setTab(0)
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            marginLeft: 24,
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.2,
            color:
              props.selectedTab == 0
                ? Resources.Colors.brightTeal
                : Resources.Colors.greyishBrown,
          }}
          onLayout={(e) => {
            props.setMeasuredText1Layout({
              x: e.nativeEvent.layout.x,
              width: e.nativeEvent.layout.width,
            })
          }}
        >
          {translations.mainView.portfolio}
        </Text>
        <View style={{ height: 5 }} />
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginLeft: 18 }}
        onPress={() => {
          props.setTab(1)
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.2,
            color:
              props.selectedTab == 1
                ? Resources.Colors.brightTeal
                : Resources.Colors.greyishBrown,
          }}
          onLayout={(e) => {
            props.setMeasuredText2Layout({
              x: e.nativeEvent.layout.x,
              width: e.nativeEvent.layout.width,
            })
          }}
        >
          {translations.mainView.invest}
        </Text>
        <View style={{ height: 5 }} />
      </TouchableOpacity>

      <ThrottleButton
        type='RectButton'
        style={{
          position: 'absolute',
          right: 15,
          top: 9 + safeInsetTop,
          width: 36,
          height: 36,
        }}
        onPress={() => {
          props.walletPressed()
        }}
      >
        <Image
          source={Resources.Images.iconWalletW}
          style={{
            marginLeft: 9,
            marginTop: 9,
            width: 18,
            height: 18,
          }}
        ></Image>
      </ThrottleButton>
    </View>
  )
}
