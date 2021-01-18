import React from 'react'
import { View } from 'react-native'
import * as Resources from '../../common/Resources'
import LottieView from 'lottie-react-native'

export function LoadingView() {
  const width = Resources.windowSize().width
  const height = Resources.windowSize().height

  return (
    <View style={{ position: 'absolute', width: width, height: height }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          backgroundColor: 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <LottieView
          source={Resources.lotties.loading}
          autoPlay={true}
          loop={true}
          onAnimationFinish={() => {}}
          style={{ width: 72, height: 72 }}
        />
      </View>
    </View>
  )
}
