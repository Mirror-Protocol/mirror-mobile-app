import React, {
  useState,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react'
import {
  Text,
  View,
  BackHandler,
  Keyboard,
  Animated,
  Image,
  Platform,
} from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'
import * as Api from '../../common/Apis/Api'
import {
  TouchableOpacity,
  TextInput,
  RectButton,
} from 'react-native-gesture-handler'
import { useFocusEffect } from '@react-navigation/native'
import { ConfigContext } from '../../common/provider/ConfigProvider'

export function Search(props: {
  onDismissPressed: () => void
  onItemPressed: (token: string) => void
}) {
  const safeInsetBottom = Resources.getSafeLayoutInsets().bottom

  const [list, setList] = useState([] as GQL_AssetList1[])
  const [filteredList, setFilteredList] = useState([] as GQL_AssetList1[])

  const [keyword, setKeyword] = useState('')

  const [isLoading, setLoading] = useState(true)
  const [keyboardBottom, setKeyboardBottom] = useState(0)

  function backButtonHander() {
    pop()
    return true
  }

  useFocusEffect(
    useCallback(() => {
      load()
        .then((e) => {})
        .catch((error) => {})

      BackHandler.addEventListener('hardwareBackPress', backButtonHander)
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', backButtonHander)
      }
    }, [])
  )

  async function load() {
    setLoading(true)

    const products = await Api.assetList(false)
    setList(products)
    setLoading(false)
  }

  useEffect(() => {
    search()
  }, [keyword])

  useEffect(() => {
    if (!isLoading) {
      search()
    }
  }, [isLoading])

  function search() {
    if (keyword == '') {
      setFilteredList([])
    } else {
      let filtered = list.filter((_item, index) => {
        const item = _item as GQL_AssetList1
        if (item.symbol.toLowerCase() === 'mir' || item.status === 'DELISTED') {
          return false
        }

        if (
          item.symbol.toLowerCase().includes(keyword.toLowerCase()) ||
          item.name.toLowerCase().includes(keyword.toLowerCase())
        ) {
          return true
        } else {
          return false
        }
      })

      setFilteredList(filtered)
    }
  }

  useEffect(() => {
    Keyboard.addListener('keyboardWillShow', keyboardShow)
    return () => {
      Keyboard.removeListener('keyboardWillShow', keyboardShow)
    }
  }, [keyboardShow])

  useEffect(() => {
    Keyboard.addListener('keyboardWillHide', keyboardHide)
    return () => {
      Keyboard.removeListener('keyboardWillHide', keyboardHide)
    }
  }, [keyboardHide])

  function keyboardShow(e: any) {
    setKeyboardBottom(e.endCoordinates.height)
  }

  function keyboardHide(e: any) {
    setKeyboardBottom(0)
  }

  const fieldTopFrom = useRef(-84)
  const fieldTopTo = useRef(0)
  const fieldTopAnim1 = useRef(new Animated.Value(fieldTopTo.current)).current

  const fieldWidthFrom = useRef(Resources.windowSize().width - 99)
  const fieldWidthTo = useRef(Resources.windowSize().width - 48)
  const fieldSizeAnim1 = useRef(new Animated.Value(fieldWidthTo.current))
    .current
  const fieldWidth = fieldSizeAnim1.interpolate({
    inputRange: [fieldWidthFrom.current, fieldWidthTo.current],
    outputRange: [fieldWidthFrom.current, fieldWidthTo.current],
  })

  const fieldSizeAnim = {
    transform: [{ translateY: fieldTopAnim1 }],
  }

  const headerOpacityAnim1 = useRef(new Animated.Value(0)).current
  const headerOpacityAnim = {
    opacity: headerOpacityAnim1,
  }

  const duration = 200

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fieldSizeAnim1, {
          toValue: fieldWidthFrom.current,
          duration: duration,
          useNativeDriver: false,
        }),
        Animated.timing(fieldTopAnim1, {
          toValue: fieldTopFrom.current,
          duration: duration,
          useNativeDriver: false,
        }),
      ]).start(() => {
        Animated.timing(headerOpacityAnim1, {
          toValue: 1,
          duration: duration,
          useNativeDriver: false,
        }).start()
      })
    }, 100)
  }, [])

  function pop() {
    Animated.timing(headerOpacityAnim1, {
      toValue: 0,
      duration: duration,
      useNativeDriver: false,
    }).start(() => {
      Animated.parallel([
        Animated.timing(fieldSizeAnim1, {
          toValue: fieldWidthTo.current,
          duration: duration,
          useNativeDriver: false,
        }),
        Animated.timing(fieldTopAnim1, {
          toValue: fieldTopTo.current,
          duration: duration,
          useNativeDriver: false,
        }),
      ]).start(() => {
        props.onDismissPressed()
      })
    })
  }

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: Resources.windowSize().width,
        height: Resources.windowSize().height,
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      <Header
        headerOpacityAnim={headerOpacityAnim}
        cancelPressed={() => {
          pop()
        }}
      />
      <Field
        keyword={keyword}
        setKeyword={setKeyword}
        fieldSizeAnim={fieldSizeAnim}
        fieldWidth={fieldWidth}
      />

      <Animated.ScrollView
        style={[headerOpacityAnim, { marginBottom: keyboardBottom }]}
      >
        <View style={{ height: 31 }} />

        {filteredList.map((item, index) => {
          return (
            <ItemView
              key={index}
              onItemPressed={props.onItemPressed}
              _item={item}
            />
          )
        })}

        <View style={{ height: safeInsetBottom + 20 }} />
      </Animated.ScrollView>
    </View>
  )
}

function Header(props: { headerOpacityAnim: any; cancelPressed: () => void }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  return (
    <Animated.View
      style={[
        props.headerOpacityAnim,
        {
          paddingTop: safeInsetTop + 16,
          paddingLeft: 24,
          paddingRight: 24,
          flexDirection: 'row',
          height: 104 + safeInsetTop,
          backgroundColor: Resources.Colors.darkGreyTwo,
        },
      ]}
    >
      <View style={{ flex: 1 }} />
      <TouchableOpacity
        style={{
          marginLeft: 12,
          flexDirection: 'row',
          height: 64,
          alignItems: 'center',
        }}
        onPress={() => {
          props.cancelPressed()
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.3,
            color: Resources.Colors.brightTeal,
          }}
        >
          {translations.searchView.cancel}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

function Field(props: {
  keyword: string
  setKeyword: (k: string) => void
  fieldSizeAnim: any
  fieldWidth: any
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top
  let field: any = useRef(null)
  return (
    <Animated.View
      style={[
        props.fieldSizeAnim,
        {
          position: 'absolute',
          left: 24,
          width: props.fieldWidth,
          top: safeInsetTop + 100,
          flexDirection: 'row',
          alignItems: 'center',
          height: 64,
          backgroundColor: Resources.Colors.darkGreyFour,
          borderRadius: 16,
        },
      ]}
    >
      <Image
        style={{ width: 14, height: 14, marginLeft: 16 }}
        source={Resources.Images.iconSearch}
      />
      <RectButton
        style={{
          marginLeft: 6,
          marginRight: 6,
          flex: 1,
          height: 64,
        }}
        onPress={() => {
          if (field.current != null) {
            field.current.focus()
          }
        }}
      >
        <TextInput
          ref={(v) => {
            field.current = v
          }}
          style={{
            width: '100%',
            height: '100%',
            padding: 0,
            margin: 0,
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            letterSpacing: -0.5,
            color: 'white',
          }}
          autoFocus={true}
          onChangeText={props.setKeyword}
          keyboardAppearance={'dark'}
          value={props.keyword}
        />

        <Text
          style={{
            display: props.keyword.length == 0 ? 'flex' : 'none',
            position: 'absolute',
            top: Platform.OS === 'ios' ? 25 : 23,
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            letterSpacing: -0.5,
            color: Resources.Colors.greyishBrown,
          }}
        >
          {translations.searchView.discover}
        </Text>
      </RectButton>
      <TouchableOpacity
        onPress={() => {
          props.setKeyword('')
        }}
      >
        <Image
          style={{
            display: props.keyword.length > 0 ? 'flex' : 'none',
            marginRight: 13,
            width: 16,
            height: 16,
          }}
          source={Resources.Images.iconSearchErase}
        />
      </TouchableOpacity>
    </Animated.View>
  )
}

function ItemView(props: {
  onItemPressed: (token: string) => void
  _item: GQL_AssetList1
}) {
  const item = props._item
  const symbol = item.symbol
  const [noIcon, setNoIcon] = useState(false)
  return (
    <TouchableOpacity
      style={{
        marginLeft: 24,
        marginRight: 24,
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      onPress={() => {
        props.onItemPressed(item.token)
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          backgroundColor: Resources.Colors.darkGreyTwo,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!noIcon ? (
          <Image
            source={{ uri: Api.getAssetIcon(item.symbol) }}
            style={{
              width: 22,
              height: 22,
            }}
            onLoadStart={() => {
              setNoIcon(false)
            }}
            onError={(error) => {
              setNoIcon(true)
            }}
          />
        ) : (
          <View />
        )}

        {noIcon ? (
          <Text
            style={{
              fontFamily: Resources.Fonts.bold,
              fontSize: 10,
              letterSpacing: -0.3,
              color: Resources.Colors.veryLightPinkTwo,
            }}
          >
            {'ETF'}
          </Text>
        ) : (
          <View />
        )}
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text
          style={{
            marginTop: 5,
            color: Resources.Colors.veryLightPinkTwo,
            fontFamily: Resources.Fonts.medium,
            fontSize: 24,
            letterSpacing: -0.3,
          }}
        >
          {Utils.getDenom(symbol)}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode={'tail'}
          style={{
            width: 200,
            marginTop: 2,
            color: Resources.Colors.greyishBrown,
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.4,
          }}
        >
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
