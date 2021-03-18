import React from 'react'
import {
  Animated,
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { RectButton } from 'react-native-gesture-handler'
import * as Resources from '../../../common/Resources'
import useProgressAnim from '../../common/anim/useProgressAnim'

const Pending = ({ withdraw }: { withdraw?: boolean }) => {
  const { progressAnimLeft, progressAnimWidth } = useProgressAnim({ width: 40 })

  return (
    <>
      <Text
        style={{
          fontFamily: Resources.Fonts.medium,
          fontSize: 10,
          letterSpacing: -0.25,
          color: withdraw ? 'rgb(255, 140, 235)' : Resources.Colors.brightTeal,
          marginBottom: 6,
        }}
      >
        {withdraw ? `Sending` : `Pending`}
      </Text>
      <View
        style={{
          width: 40,
          height: 2,
          borderRadius: 1.5,
          backgroundColor: Resources.Colors.darkBackground,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            left: progressAnimLeft,
            width: progressAnimWidth,
            height: 2,
            backgroundColor: withdraw
              ? 'rgb(255, 140, 235)'
              : Resources.Colors.brightTeal,
          }}
        />
      </View>
    </>
  )
}

const RampItem = ({
  logo,
  logoStyle,
  title,
  subTitle,
  pending,
  withdraw,
  onPress,
}: {
  logo: ImageSourcePropType
  logoStyle?: StyleProp<ImageStyle>
  title: string
  subTitle: string
  pending?: boolean
  withdraw?: boolean
  onPress: () => void
}) => {
  return (
    <RectButton
      style={{ flexDirection: 'row' }}
      onPress={() => !pending && onPress()}
    >
      <View
        style={[
          pending
            ? withdraw
              ? styles.pendingWithdrawContainer
              : styles.pendingContainer
            : styles.iconContainer,
        ]}
      >
        {pending ? (
          <Pending withdraw={withdraw} />
        ) : (
          <Image source={logo} style={[{ width: 34, height: 34 }, logoStyle]} />
        )}
      </View>
      <View style={styles.titleContainer}>
        <Text
          style={[
            styles.titleText,
            pending && { color: Resources.Colors.greyishBrown },
          ]}
        >
          {title}
        </Text>
        <Text style={styles.subTitleText}>{subTitle}</Text>
      </View>
      <View style={{ justifyContent: 'center', marginRight: 30 }}>
        <Image
          source={Resources.Images.chevronR11G}
          style={[{ width: 6, height: 12 }, pending && { opacity: 0.4 }]}
        />
      </View>
    </RectButton>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Resources.Colors.darkGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgb(31,59,54)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pendingWithdrawContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ff00bd3d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  titleContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 18,
    letterSpacing: -0.3,
    color: Resources.Colors.veryLightPink,
    marginBottom: 6,
  },
  subTitleText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 12,
    letterSpacing: -0.3,
    color: Resources.Colors.greyishBrown,
  },
})

export default RampItem
