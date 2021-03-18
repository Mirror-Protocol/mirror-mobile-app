import React, { useRef, useState, useEffect, ReactElement } from 'react'
import { Text, View, Animated, KeyboardTypeOptions } from 'react-native'
import { RectButton, TextInput } from 'react-native-gesture-handler'
import * as Resources from '../../common/Resources'

export function AnimatedInputView(props: {
  onLayout: (e: any) => void
  value: any
  onChangeText: (text: string) => void
  focusChanged?: (focused: boolean) => void
  maxLength: number
  keyboardType: KeyboardTypeOptions
  numberOfLines: number
  suffixTitle: string
  placeholder: string
  placeholderSub?: string
  placeHolderElement?: ReactElement
  autoFocus: boolean
  style: any
  setPreventEvent?: () => void
}) {
  const duration = 200
  const placeholderTop = useRef(new Animated.Value(14)).current
  const fontSize = useRef(new Animated.Value(14)).current
  const [placeholderColor, setPlaceholderColor] = useState(
    Resources.Colors.veryLightPink
  )

  const [focused, setFocused] = useState(false)
  const [value, setValue] = useState('')

  if (value != props.value) {
    setValue(props.value)
  }

  useEffect(() => {
    if (!focused && value == '') {
      doAnimate(false, (f) => {})
    } else if (!focused && value != undefined && value != '') {
      doAnimate(true, (f) => {})
    }
  }, [value])

  useEffect(() => {
    if (props.focusChanged != undefined) {
      props.focusChanged(focused)
    }
  }, [focused])

  function onFocusChanged(isFocus: boolean) {
    setFocused(isFocus)

    if (value != '') {
      const color = isFocus
        ? Resources.Colors.greyishBrown
        : Resources.Colors.veryLightPink
      setPlaceholderColor(color)
    } else {
      if (!isFocus) {
        setPlaceholderColor(Resources.Colors.veryLightPink)
      }

      doAnimate(isFocus, (f) => {
        if (f) {
          setPlaceholderColor(Resources.Colors.greyishBrown)
        }
      })
    }
  }

  function doAnimate(f: boolean, callback: (f: boolean) => void) {
    Animated.parallel([
      Animated.timing(placeholderTop, {
        toValue: f ? 12 : 25,
        duration: duration,
        useNativeDriver: false,
      }),
      Animated.timing(fontSize, {
        toValue: f ? 12 : 14,
        duration: duration,
        useNativeDriver: false,
      }),
    ]).start(() => {
      callback(f)
    })
  }

  function onChangeText(text: string) {
    props.onChangeText(text)
  }

  const bgColor = focused
    ? Resources.Colors.darkGreyThree
    : Resources.Colors.darkGreyTwo
  const heightStyle =
    props.numberOfLines == 1 ? { height: 64 } : { minHeight: 64 }
  const suffixPaddingRight = props.suffixTitle == '' ? 0 : 11

  let field = useRef(null as any)

  return (
    <View
      onLayout={(e) => {
        props.onLayout(e)
      }}
    >
      <RectButton
        style={[
          props.style,
          heightStyle,
          { borderRadius: 16, backgroundColor: bgColor },
        ]}
        onPress={() => {
          props.setPreventEvent && props.setPreventEvent()
          if (field.current != null) {
            field.current.focus()
          }
        }}
      >
        {/* placeholder */}
        <Animated.Text
          style={{
            position: 'absolute',
            paddingLeft: 4,
            paddingRight: 4,
            left: 20,
            top: placeholderTop,
            fontSize: fontSize,
            color: placeholderColor,
            fontFamily: Resources.Fonts.book,
          }}
        >
          {props.placeholder}
          {props.placeholderSub && !focused && (
            <>
              <View style={{ width: 5 }} />
              <Animated.Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 12,
                  letterSpacing: -0.14,
                  color: Resources.Colors.greyishBrown,
                }}
              >
                {props.placeholderSub}
              </Animated.Text>
            </>
          )}
        </Animated.Text>

        <View style={{ marginTop: 34, flexDirection: 'row' }}>
          <TextInput
            ref={(v) => {
              field.current = v
            }}
            autoFocus={props.autoFocus}
            onContentSizeChange={(e) => {}}
            autoCorrect={false}
            autoCompleteType='off'
            returnKeyType='done'
            blurOnSubmit={true}
            onFocus={() => {
              onFocusChanged(true)
            }}
            maxLength={props.maxLength}
            keyboardAppearance='dark'
            keyboardType={props.keyboardType}
            numberOfLines={props.numberOfLines}
            multiline={true}
            style={{
              marginLeft: 24,
              marginBottom: 16,
              textAlign: 'left',
              color: Resources.Colors.veryLightPink,
              fontSize: 14,
              letterSpacing: -0.2,
              includeFontPadding: false,
              padding: 0,
              paddingTop: 0,
              paddingRight: suffixPaddingRight,
              textAlignVertical: 'center',
              fontFamily: Resources.Fonts.book,
              flex: 1,
            }}
            onChangeText={onChangeText}
            onEndEditing={() => {
              onFocusChanged(false)
            }}
            value={value}
          />
          {focused ? (
            <Text
              style={{
                marginTop: 3,
                marginRight: 24,
                fontSize: 10,
                fontFamily: Resources.Fonts.book,
                color: Resources.Colors.veryLightPink,
              }}
            >
              {props.suffixTitle}
            </Text>
          ) : (
            <View />
          )}
        </View>
      </RectButton>
      <View style={{ height: 17 }} />
    </View>
  )
}
