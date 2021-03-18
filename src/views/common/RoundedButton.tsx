import React from 'react'
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native'
import * as Resources from '../../common/Resources'
import ThrottleButton from '../../component/ThrottleButton'

const RoundedButton = ({
  type,
  title,
  height,
  style,
  textStyle,
  outline,
  onPress,
}: {
  type?: 'TouchableOpacity' | 'RectButton'
  title: string
  height: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
  outline?: boolean
  onPress: () => void
}) => {
  const buttonStyle = outline ? roundedButtonOutlineStyle : roundedButtonStyle
  return (
    <ThrottleButton
      type={type ?? 'TouchableOpacity'}
      style={[style, { height }]}
      onPress={() => onPress()}
    >
      <View
        style={[
          style,
          {
            height,
            borderRadius: height / 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
          buttonStyle.container,
        ]}
      >
        <Text style={[buttonStyle.title, textStyle]}>{title}</Text>
      </View>
    </ThrottleButton>
  )
}
const roundedButtonStyle = {
  container: {
    borderWidth: 2,
    borderColor: Resources.Colors.brightTeal,
    backgroundColor: Resources.Colors.brightTeal,
  },
  title: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 18,
    letterSpacing: -0.5,
    color: Resources.Colors.black,
  },
}
const roundedButtonOutlineStyle = {
  container: {
    borderWidth: 2,
    borderColor: Resources.Colors.brightTeal,
    backgroundColor: Resources.Colors.darkBackground,
  },
  title: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 18,
    letterSpacing: -0.5,
    color: Resources.Colors.brightTeal,
  },
}

export default RoundedButton
