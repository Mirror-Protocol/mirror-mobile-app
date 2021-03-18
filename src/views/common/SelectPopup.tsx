import React, { useEffect, useRef } from 'react'
import { useState } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import {
  RectButton,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Resources from '../../common/Resources'
import ThrottleButton from '../../component/ThrottleButton'
import { PasscodeMode } from './PinSecurityView'
import RoundedButton from './RoundedButton'

export type SelectItem = {
  label: string
  value: string
  logo: ImageSourcePropType
}

const DEFAULT_DONE_TEXT = 'Done'
const DEFAULT_CONFIRM_TEXT = 'Confirm'

const SelectPopup = ({
  titleText,
  doneText,
  confirmText,
  list,
  selected,
  setSelected,
  close,
}: {
  titleText: string
  doneText?: string
  confirmText?: string
  list: SelectItem[]
  selected: SelectItem
  setSelected: (item: SelectItem) => void
  close: () => void
}) => {
  const insets = useSafeAreaInsets()
  const [selectedItem, setSelectedItem] = useState(selected)

  const [popupHeight, setPopupHeight] = useState(Resources.windowSize().height)

  const duration = 200
  const bgOpacity = useRef(new Animated.Value(0)).current
  const windowBottom = useRef(new Animated.Value(-popupHeight)).current

  const showAnim = Animated.parallel([
    Animated.timing(bgOpacity, {
      toValue: 0.9,
      duration: duration,
      useNativeDriver: false,
    }),
    Animated.timing(windowBottom, {
      toValue: 0,
      duration: duration,
      useNativeDriver: false,
    }),
  ])
  const hideAnim = Animated.parallel([
    Animated.timing(bgOpacity, {
      toValue: 0,
      duration: duration,
      useNativeDriver: false,
    }),
    Animated.timing(windowBottom, {
      toValue: -popupHeight,
      duration: duration,
      useNativeDriver: false,
    }),
  ])

  const dismiss = () => hideAnim.start(() => close())

  useEffect(() => {
    showAnim.start()
  }, [])

  return (
    <View style={selectPopupStyle.container}>
      <Animated.View
        style={[
          selectPopupStyle.background,
          {
            opacity: bgOpacity,
          },
        ]}
      />
      <View style={{ flex: 1 }}>
        <RectButton
          style={{
            flex: 1,
          }}
          onPress={() => dismiss()}
        />
      </View>
      <Animated.View
        style={{
          position: 'absolute',
          width: '100%',
          bottom: windowBottom,
        }}
        onLayout={(e) => setPopupHeight(e.nativeEvent.layout.height)}
      >
        <View style={selectPopupStyle.headerContainer}>
          <Text style={selectPopupStyle.headerTitleText}>{titleText}</Text>
          <TouchableOpacity style={{ padding: 8 }} onPress={() => dismiss()}>
            <Text style={selectPopupStyle.headerDoneText}>
              {doneText ?? DEFAULT_DONE_TEXT}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={selectPopupStyle.itemContainer}>
          {list.map((item, index) =>
            Item(item, index, selectedItem, setSelectedItem)
          )}
        </View>
        <View
          style={[
            selectPopupStyle.confirmContainer,
            {
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <RoundedButton
            type={'TouchableOpacity'}
            style={{ width: 124 }}
            textStyle={selectPopupStyle.confirmText}
            title={confirmText ?? DEFAULT_CONFIRM_TEXT}
            height={34}
            onPress={() => {
              setSelected(selectedItem)
              dismiss()
            }}
          />
        </View>
      </Animated.View>
    </View>
  )
}

const selectPopupStyle = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
  },
  background: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Resources.Colors.darkGreyFour,
  },
  headerContainer: {
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: Resources.Colors.darkGreyTwo,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 12,
    letterSpacing: -0.2,
    color: '#fff',
  },
  headerDoneText: {
    fontFamily: Resources.Fonts.book,
    fontSize: 12,
    letterSpacing: -0.2,
    color: Resources.Colors.brightTeal,
  },
  itemContainer: {
    backgroundColor: Resources.Colors.darkBackground,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  confirmContainer: {
    backgroundColor: Resources.Colors.darkBackground,
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 14,
    letterSpacing: -0.3,
    color: 'rgb(37, 37, 37)',
  },
})

const Item = (
  item: SelectItem,
  index: number,
  selectedValue: SelectItem,
  setSelectedValue: (item: SelectItem) => void
) => {
  return (
    <View key={`${item}-${index}`} style={itemStyle.itemContainer}>
      <TouchableOpacity
        style={itemStyle.buttonContainer}
        hitSlop={{ left: 16, top: 16, right: 16, bottom: 16 }}
        onPress={() => {
          setSelectedValue(item)
        }}
      >
        <Text
          style={[
            itemStyle.itemText,
            {
              fontFamily:
                item.value === selectedValue.value
                  ? Resources.Fonts.medium
                  : Resources.Fonts.book,
              color:
                item.value === selectedValue.value
                  ? Resources.Colors.brightTeal
                  : Resources.Colors.veryLightPink,
            },
          ]}
        >
          {item.label}
        </Text>
        <View
          style={[
            itemStyle.itemCheck,
            {
              backgroundColor:
                item.value === selectedValue.value
                  ? Resources.Colors.brightTeal
                  : Resources.Colors.darkGrey,
            },
          ]}
        >
          {item.value === selectedValue.value && (
            <Image
              source={Resources.Images.iconCheckB}
              style={{ width: 12, height: 12 }}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  )
}

const itemStyle = StyleSheet.create({
  itemContainer: {},
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  itemText: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  itemCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default SelectPopup
