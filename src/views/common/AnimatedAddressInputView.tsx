import React, { useRef, useState, useEffect } from 'react'
import { Text, View, Animated } from 'react-native'
import { RectButton, TextInput } from 'react-native-gesture-handler'
import * as Resources from '../../common/Resources'

export function AnimatedAddressInputView(props: {
  onLayout: (e: any) => void
  value: any
  onChangeText: (text: string) => void
  focusChanged?: (focused: boolean) => void
  placeholder: string
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
          {
            minHeight: 64,
            borderRadius: 16,
            backgroundColor: bgColor,
          },
        ]}
        onPress={() => {
          props.setPreventEvent && props.setPreventEvent()
          if (field.current != null) {
            field.current.focus()
          }
        }}
      >
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
        </Animated.Text>
        {focused ? (
          <PasteButton
            onPressed={() => {
              Resources.pasteClipboard().then((value) => {
                onChangeText(value)
              })
            }}
          />
        ) : (
          <View />
        )}
        <View style={{ marginTop: 34, flexDirection: 'row' }}>
          <TextInput
            ref={(v) => {
              field.current = v
            }}
            autoFocus={false}
            onContentSizeChange={(e) => {}}
            autoCorrect={false}
            autoCompleteType='off'
            returnKeyType='done'
            blurOnSubmit={true}
            onFocus={() => {
              onFocusChanged(true)
            }}
            maxLength={100}
            keyboardAppearance='dark'
            keyboardType='default'
            // numberOfLines={3}
            multiline={true}
            style={{
              marginLeft: 24,
              marginRight: 24,
              marginBottom: 16,
              textAlign: 'left',
              color: Resources.Colors.veryLightPink,
              fontSize: 14,
              letterSpacing: -0.2,
              includeFontPadding: false,
              padding: 0,
              paddingTop: 0,
              paddingRight: 0,
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
        </View>
      </RectButton>
      <View style={{ height: 17 }} />
    </View>
  )
}

function PasteButton(props: { onPressed: () => void }) {
  return (
    <RectButton
      style={{
        position: 'absolute',
        height: 24,
        top: 12,
        right: 24,
      }}
      onPress={props.onPressed}
    >
      <Text
        style={{
          fontSize: 12,
          letterSpacing: -0.2,
          fontFamily: Resources.Fonts.book,
          color: Resources.Colors.brightTeal,
        }}
      >
        {'Paste'}
      </Text>
    </RectButton>
  )
}
