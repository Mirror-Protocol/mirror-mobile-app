import React, { useContext, useEffect, useRef, useState } from 'react'
import { Animated, Easing, Image, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { QueueContext } from '../../common/provider/QueueProvider'

import * as Resources from '../../common/Resources'
import * as Api from '../../common/Apis/Api'
import { ProcessingPopup } from './ProcessingPopup'

export default function QueueButton(props: { currentRouteName?: string }) {
  const { hash, setHash, showTxQueued } = useContext(QueueContext)

  const [showProcessingPopup, setShowProcessingPopup] = useState(false)

  const spinValue = useRef(new Animated.Value(0)).current
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const pollingTimer = useRef<number>()
  const pollingHash = (txhash: string, event?: any) => {
    pollingTimer.current = setTimeout(() => {
      if (txhash === undefined) {
        return
      }
      Api.getTxInfo(txhash)
        .then((txinfo) => {
          if (txinfo === undefined) {
            pollingHash(txhash)
          } else {
            setHash(undefined)
          }
        })
        .catch((error) => {
          setHash(undefined)
        })
    }, 1400)
  }

  useEffect(() => {
    return () => {
      pollingTimer.current && clearTimeout(pollingTimer.current)
    }
  }, [])

  useEffect(() => {
    const spinAnim = Animated.timing(spinValue, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: false,
    })
    Animated.loop(spinAnim).start()

    hash && pollingHash(hash)
  }, [hash])

  return (
    props.currentRouteName !== 'InitialView' &&
    props.currentRouteName !== 'PinSecurityView' &&
    showTxQueued && (
      <>
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 128,
            backgroundColor: 'rgb(44, 44, 46)',
            width: 76,
            height: 52,
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            shadowColor: 'rgb(0, 0, 0)',
            shadowOpacity: 0.5,
          }}
        >
          <TouchableOpacity
            style={{
              height: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              setShowProcessingPopup(true)
            }}
          >
            {hash === undefined ? (
              <Image
                source={Resources.Images.iconQueueComplete}
                style={{ width: 16, height: 16, marginBottom: 5 }}
              />
            ) : (
              <Animated.Image
                source={Resources.Images.iconQueueLoading}
                style={{
                  width: 16,
                  height: 16,
                  marginBottom: 5,
                  transform: [{ rotate: spin }],
                }}
              />
            )}
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 11,
                letterSpacing: -0.3,
                color: 'rgb(234, 234, 234)',
              }}
            >
              {hash === undefined ? `Completed` : `Queued`}
            </Text>
          </TouchableOpacity>
        </View>
        <ProcessingPopup
          showPopup={showProcessingPopup}
          closePopup={() => setShowProcessingPopup(false)}
        />
      </>
    )
  )
}
