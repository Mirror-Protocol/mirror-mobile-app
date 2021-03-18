import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Resources from '../../../common/Resources'
import RoundedButton from '../../common/RoundedButton'
import RampNavHeader from './RampNavHeader'

const RampErrorView = (props: { navigation: any; route: any }) => {
  const insets = useSafeAreaInsets()
  const message = props.route.params.message

  return (
    <>
      <View style={styles.container}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              marginHorizontal: 44,
              marginBottom: Resources.windowSize().height * 0.083 + 88,
            }}
          >
            <Image
              source={Resources.Images.iconError}
              style={{ width: 96, height: 96 }}
            />
            <Text style={styles.titleText}>{'Error'}</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>
          <View
            style={[
              styles.closeButton,
              {
                marginBottom: insets.bottom + 40,
              },
            ]}
          >
            <RoundedButton
              type={'RectButton'}
              title={'Try Again'}
              height={48}
              onPress={() => {
                props.navigation.popToTop()
              }}
            />
          </View>
        </View>
      </View>
      <RampNavHeader navigation={props.navigation} showBack={false} />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Resources.Colors.darkBackground,
    paddingHorizontal: 24,
  },
  titleText: {
    fontFamily: Resources.Fonts.medium,
    fontSize: 32,
    letterSpacing: -0.5,
    color: Resources.Colors.veryLightPinkTwo,
    marginTop: 48,
  },
  messageText: {
    fontFamily: Resources.Fonts.book,
    fontSize: 14,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: Resources.Colors.veryLightPink,
    marginTop: 10,
  },
  closeButton: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
})

export default RampErrorView
