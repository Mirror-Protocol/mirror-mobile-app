import React from 'react'
import { Image, StyleProp, View, ViewStyle } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import * as Resources from '../common/Resources'

const BtnBack = (props: {
  style?: StyleProp<ViewStyle>
  onPress: () => void
}) => {
  return (
    <View style={{ flexDirection: 'row' }}>
      <TouchableOpacity onPress={props.onPress}>
        <Image
          source={Resources.Images.btnBackW}
          style={{
            width: 10,
            height: 18,
            marginVertical: 19,
            marginHorizontal: 24,
          }}
        />
      </TouchableOpacity>
    </View>
  )
}

export default BtnBack
