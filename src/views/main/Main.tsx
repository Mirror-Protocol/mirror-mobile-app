import React, {
  useState,
  useCallback,
  useRef,
  useContext,
  useEffect,
} from 'react'
import { Text, View, Image, Animated, Platform, ScrollView } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Api from '../../common/Apis/Api'
import * as Utils from '../../common/Utils'
import { useFocusEffect } from '@react-navigation/native'
import { TouchableOpacity, RectButton } from 'react-native-gesture-handler'
import { MainTab1 } from './MainTab1'
import { MainTab2 } from './MainTab2'
import { BlurView } from '@react-native-community/blur'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import { Search } from './Search'
import ThrottleButton from '../../component/ThrottleButton'
import { getAssetBalances, readDelistMAssets } from '../../common/Apis/Api'
import {
  checkDoNotShowDelistNotice,
  setDoNotShowDelistNotice,
} from '../../common/Keychain'
import { TransakContext } from '../../common/provider/TransakProvider'

export function Main(props: { navigation: any; route: any }) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom
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

  const transak = useContext(TransakContext)
  useEffect(() => {
    transak.initTransak()
  }, [])

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

  const [myDelistAssets, setMyDelistAssets] = useState<DelistMAssetModel[]>([])
  const [showNotice, setShowNotice] = useState(false)
  const [doNotShowAgain, setDoNotShowAgain] = useState(false)
  useEffect(() => {
    const checkDelistItems = async () => {
      const assetBalances = await getAssetBalances()
      const delistAssets = await readDelistMAssets()

      const findAssets = delistAssets.filter((a) => {
        return assetBalances.find((b) => a.token === b.token)
      })

      if (findAssets.length > 0) {
        const delistTokens = findAssets.map((i) => {
          return i.token
        })
        const doNotShow = await checkDoNotShowDelistNotice(delistTokens)

        if (!doNotShow) {
          setShowNotice(true)
          setMyDelistAssets(findAssets)
        }
      }
    }
    checkDelistItems()
  }, [])

  useFocusEffect(
    useCallback(() => {
      Api.assetList2(true, true).then((list) => {
        setAssetList(list)
      })
    }, [selectedTab])
  )

  const searchBarMarginTop = tab2ScrollY.interpolate({
    inputRange: [0, 32],
    outputRange: [0, -32],
    extrapolate: 'clamp',
  })

  const noticePopup = () => {
    const DelistSymbols = myDelistAssets
      .map((i) => {
        return i.symbol
      })
      .join(', ')

    const DelistItem = ({ symbol, date }: { symbol: string; date: string }) => {
      const convertDate = Utils.getDateFormat1(new Date(date))
      return (
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 16,
            color: Resources.Colors.brightTeal,
            textAlign: 'center',
          }}
        >
          {symbol}
          <Text
            style={{
              fontFamily: Resources.Fonts.book,
              fontSize: 12,
              color: Resources.Colors.brownishGrey,
            }}
          >{` (${convertDate})`}</Text>
        </Text>
      )
    }

    return (
      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: Resources.Colors.darkBackground,
          flexDirection: 'column',
        }}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24 }}
          overScrollMode={'never'}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: 'row',
                marginTop: safeInsetTop + 60,
                marginBottom: 8,
              }}
            >
              <Image
                source={Resources.Images.iconNoticeB}
                style={{ width: 14.8, height: 13, marginRight: 4 }}
              />
              <Text
                style={{
                  fontFamily: Resources.Fonts.medium,
                  fontSize: 14,
                  letterSpacing: -0.04,
                  color: Resources.Colors.brownishGrey,
                  includeFontPadding: false,
                }}
              >
                {`NOTICE`}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 32,
                color: Resources.Colors.veryLightPinkTwo,
                marginBottom: 8,
                includeFontPadding: false,
              }}
            >
              {`Stock Split`}
            </Text>
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 12,
                lineHeight: 18,
                color: Resources.Colors.brownishGrey,
                marginBottom: 24,
                includeFontPadding: false,
              }}
            >
              {`Below asset will be affected by a stock split / merge on the dates below:`}
            </Text>
            <View
              style={{
                borderRadius: 16,
                backgroundColor: Resources.Colors.darkGrey,
                justifyContent: 'center',
                alignContent: 'center',
                marginBottom: 24,
                paddingTop: 24,
                paddingBottom: 9,
              }}
            >
              {myDelistAssets.map((i) => {
                return (
                  <>
                    <DelistItem symbol={i.symbol} date={i.date} />
                    <View style={{ height: 15 }} />
                  </>
                )
              })}
            </View>
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 12,
                lineHeight: 18,
                color: Resources.Colors.brownishGrey,
                marginBottom: 24,
              }}
            >
              {`These assets will be `}
              <Text
                style={{
                  fontFamily: Resources.Fonts.medium,
                  fontSize: 12,
                  lineHeight: 18,
                  color: Resources.Colors.brownishGrey,
                }}
              >{`DELISTED`}</Text>
              {` as soon as the market closes on the last trading day before the stock split / merge.`}
            </Text>
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 16,
                lineHeight: 24,
                color: Resources.Colors.brightTeal,
                marginBottom: 12,
              }}
            >{`You have 2 options:`}</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={{
                  width: 15,
                  fontFamily: Resources.Fonts.book,
                  fontSize: 14,
                  lineHeight: 21,
                  color: Resources.Colors.veryLightPinkTwo,
                }}
              >{`1. `}</Text>
              <Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 14,
                  lineHeight: 21,
                  color: Resources.Colors.veryLightPinkTwo,
                }}
              >
                <Text
                  style={{
                    fontFamily: Resources.Fonts.medium,
                    fontSize: 14,
                    lineHeight: 21,
                    color: Resources.Colors.brightTeal,
                  }}
                >
                  {`Sell`}
                </Text>
                {` ${DelistSymbols} before the split date`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 24 }}>
              <Text
                style={{
                  width: 15,
                  fontFamily: Resources.Fonts.book,
                  fontSize: 14,
                  lineHeight: 21,
                  color: Resources.Colors.veryLightPinkTwo,
                }}
              >{`2. `}</Text>
              <Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 14,
                  lineHeight: 21,
                  color: Resources.Colors.veryLightPinkTwo,
                }}
              >
                <Text
                  style={{
                    fontFamily: Resources.Fonts.medium,
                    fontSize: 14,
                    lineHeight: 21,
                    color: Resources.Colors.brightTeal,
                  }}
                >
                  {`Burn`}
                </Text>
                {` ${DelistSymbols} after the split date at a fixed oracle price`}
              </Text>
            </View>
            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: 'rgb(9, 9, 10)',
              }}
            />
            <View
              style={{
                width: '100%',
                height: 1,
                backgroundColor: 'rgb(40, 40, 42)',
                marginBottom: 24,
              }}
            />
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 14,
                lineHeight: 21,
                color: Resources.Colors.veryLightPinkTwo,
                marginBottom: 16,
              }}
            >
              {`You will be able to repurchase these assets shortly after the stock split`}
            </Text>
          </View>
        </ScrollView>
        <View
          style={{
            height: 114,
            paddingHorizontal: 24,
            marginBottom: safeInsetBottom,
          }}
        >
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 26,
            }}
            onPress={() => {
              setDoNotShowAgain((old) => !old)
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                backgroundColor: doNotShowAgain
                  ? Resources.Colors.brightTeal
                  : Resources.Colors.darkGrey,
                marginRight: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={Resources.Images.iconCheckB}
                style={{ width: 11, height: 8.5 }}
              />
            </View>
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 12,
                lineHeight: 18,
                color: Resources.Colors.brownishGrey,
              }}
            >{`Do not show again`}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              height: 48,
              borderRadius: 31,
              backgroundColor: Resources.Colors.brightTeal,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              if (doNotShowAgain === true) {
                setDoNotShowDelistNotice(
                  myDelistAssets.map((asset) => asset.token)
                )
              }
              setShowNotice(false)
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 18,
                color: Resources.Colors.black,
              }}
            >{`I UNDERSTAND`}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

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
          onItemPressed={(token) => {
            props.navigation.push('InvestedDetail', { token })
          }}
        />
      ) : (
        <View />
      )}
      {showNotice && noticePopup()}
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
