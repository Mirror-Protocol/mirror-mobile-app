import React, { useEffect, useRef, useState } from 'react'
import { Text, View, Animated, StyleSheet } from 'react-native'
import * as Resources from '../../common/Resources'
import { ProcessingType } from './ProcessingView'

export function AnimatedTextView(props: {
  type: ProcessingType
  complete: boolean
  amount: string
  symbol: string
}) {
  const styles = StyleSheet.create({
    amount: {
      fontFamily: Resources.Fonts.bold,
      fontSize: 84,
      letterSpacing: -1.5,
    },
    denom: {
      fontFamily: Resources.Fonts.bold,
      fontSize: 18,
    },
  })

  const bgTextColor =
    props.type == ProcessingType.Sell
      ? Resources.Colors.darkGrey
      : Resources.Colors.aquamarine
  const animatedTextColor =
    props.type == ProcessingType.Sell
      ? Resources.Colors.brightTeal
      : Resources.Colors.black
  const verticalBarColor =
    props.type == ProcessingType.Sell
      ? Resources.Colors.darkGrey
      : Resources.Colors.black

  const [measuredBgViewWidth, setMeasuredBgViewWidth] = useState(0)
  const [measuredTextWidth, setMeasuredTextWidth] = useState(0)
  const [measuredTextHeight, setMeasuredTextHeight] = useState(0)
  const [measuredSymbolWidth, setMeasuredSymbolWidth] = useState(0)
  const [verticalLineShow, setVerticalLineShow] = useState(true)

  const [startAnimation, setStartAnimation] = useState(false)

  const duration = 7000
  const animatedWidth = useRef(new Animated.Value(0)).current
  const anim = Animated.sequence([
    Animated.timing(animatedWidth, {
      toValue: measuredTextWidth + measuredSymbolWidth,
      duration: duration,
      useNativeDriver: false,
    }),
    Animated.timing(animatedWidth, {
      toValue: 0,
      duration: 0,
      useNativeDriver: false,
    }),
  ])

  function progressStart() {
    console.log('progress start')
    Animated.loop(anim).start()
    setStartAnimation(true)
  }

  function progressStop() {
    console.log('progress stop')
    anim.stop()
    Animated.timing(animatedWidth, {
      toValue: measuredTextWidth + measuredSymbolWidth,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setVerticalLineShow(false)
      setStartAnimation(false)
    })
  }

  useEffect(() => {
    console.log('props.complete', props.complete)
    if (startAnimation === true && props.complete) {
      progressStop()
    }
  }, [startAnimation, props.complete])

  useEffect(() => {
    if (
      measuredTextWidth !== 0 &&
      measuredSymbolWidth !== 0 &&
      startAnimation === false
    ) {
      progressStart()
    }
  }, [measuredTextWidth, measuredSymbolWidth])

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        onLayout={(e) => {
          setMeasuredBgViewWidth(e.nativeEvent.layout.width)
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit={true}
          style={[
            styles.amount,
            {
              maxWidth: measuredBgViewWidth - measuredSymbolWidth,
              color: bgTextColor,
            },
          ]}
          onLayout={(e) => {
            setMeasuredTextWidth(e.nativeEvent.layout.width)
            setMeasuredTextHeight(e.nativeEvent.layout.height)
          }}
        >
          {props.amount}
        </Text>
        <Text
          style={[
            styles.denom,
            {
              marginBottom: measuredTextHeight * 0.18,
              color: bgTextColor,
            },
          ]}
          onLayout={(e) => {
            if (measuredSymbolWidth == 0) {
              setMeasuredSymbolWidth(e.nativeEvent.layout.width)
            }
          }}
        >
          {props.symbol}
        </Text>
      </View>
      <View
        style={{
          position: 'absolute',
          left:
            (measuredBgViewWidth - measuredTextWidth - measuredSymbolWidth) / 2,
        }}
      >
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            width: animatedWidth,
            overflow: 'hidden',
          }}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit={true}
            style={[
              styles.amount,
              {
                width: measuredTextWidth,
                color: animatedTextColor,
              },
            ]}
          >
            {props.amount}
          </Text>
          <Text
            style={[
              styles.denom,
              {
                marginBottom: measuredTextHeight * 0.18,
                width: measuredSymbolWidth,
                color: animatedTextColor,
              },
            ]}
          >
            {props.symbol}
          </Text>
        </Animated.View>
        {verticalLineShow ? (
          <Animated.View
            style={{
              position: 'absolute',
              marginLeft: animatedWidth,
              top: -12,
              height: measuredTextHeight + 12,
              width: 1,
              backgroundColor: verticalBarColor,
            }}
          />
        ) : (
          <View />
        )}
      </View>
    </View>
  )
}
