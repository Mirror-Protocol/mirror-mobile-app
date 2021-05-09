import React, { ReactElement } from 'react'
import * as Resources from '../../common/Resources'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import QRCodeScanner from 'react-native-qrcode-scanner'
import { BarCodeReadEvent } from 'react-native-camera'

const MARKER_FULL_WIDTH = 260
const MARKER_FULL_HEIGHT = 260
const FRAME_BORDER = 2
const FRAME_WIDTH = 20 + FRAME_BORDER
const FRAME_HEIGHT = 20
const MARKER_WIDTH = MARKER_FULL_WIDTH + FRAME_BORDER * 2

export const RecoverQrView = (props: { navigation: any; route: any }) => {
  const insets = Resources.getSafeLayoutInsets()

  const onSuccess = ({ data }: BarCodeReadEvent): void => {
    console.log(data)
  }

  const Vertical = (): ReactElement => (
    <View style={style.verticalFrameContainer}>
      <View style={style.verticalFrameSubContainer}>
        <View style={style.verticalFrame} />
        <View style={style.verticalFrame} />
      </View>
    </View>
  )

  const Horizontal = (): ReactElement => (
    <View style={style.horizontalFrameContainer}>
      <View style={style.horizontalFrame} />
      <View style={style.horizontalFrame} />
    </View>
  )

  const Header = (): ReactElement => (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: insets.top,
      }}
    >
      <TouchableOpacity
        style={style.backContainer}
        onPress={() => {
          props.navigation.pop()
        }}
      >
        <Image
          source={Resources.Images.btnCloseW12}
          style={{ width: 18, height: 18 }}
        />
      </TouchableOpacity>
    </View>
  )

  const Title = (): ReactElement => (
    <View style={style.titleContainer}>
      <Text style={style.titleText}>{'Scan QR code'}</Text>
    </View>
  )

  return (
    <QRCodeScanner
      reactivate
      reactivateTimeout={2500}
      onRead={onSuccess}
      cameraStyle={{ height: '100%' }}
      showMarker
      customMarker={
        <View style={style.container}>
          <View style={style.verticalContainer} />

          <Title />

          <Vertical />

          <View style={style.markerContainer}>
            <View
              style={[
                style.horizontalContainer,
                { justifyContent: 'flex-end' },
              ]}
            >
              <Horizontal />
            </View>

            <View style={{ alignItems: 'center' }}>
              <View style={style.marker} />
            </View>

            <View
              style={[
                style.horizontalContainer,
                { justifyContent: 'flex-start' },
              ]}
            >
              <Horizontal />
            </View>
          </View>

          <Vertical />

          <View style={style.verticalContainer} />
          <Header />
        </View>
      }
    />
  )
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },

  verticalContainer: { flex: 1, backgroundColor: 'rgba(27, 27, 29, 0.6)' },
  horizontalContainer: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    backgroundColor: 'rgba(27, 27, 29, 0.6)',
  },

  markerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  marker: {
    width: MARKER_FULL_WIDTH,
    height: MARKER_FULL_HEIGHT,
    backgroundColor: 'transparent',
  },

  backContainer: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  titleContainer: { backgroundColor: 'rgba(27, 27, 29, 0.6)' },
  titleText: {
    marginBottom: 16,
    fontFamily: Resources.Fonts.medium,
    fontSize: 24,
    letterSpacing: -0.3,
    color: Resources.Colors.veryLightPinkTwo,
    alignSelf: 'center',
  },
  horizontalFrameContainer: {
    width: FRAME_BORDER,
    justifyContent: 'space-between',
  },
  horizontalFrame: {
    width: FRAME_BORDER,
    height: FRAME_HEIGHT,
    backgroundColor: '#fff',
  },

  verticalFrameContainer: {
    width: '100%',
    height: FRAME_BORDER,
    backgroundColor: 'rgba(27, 27, 29, 0.6)',
    alignSelf: 'center',
  },
  verticalFrameSubContainer: {
    flexDirection: 'row',
    width: MARKER_WIDTH,
    height: FRAME_BORDER,
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  verticalFrame: {
    width: FRAME_WIDTH,
    height: FRAME_BORDER,
    backgroundColor: '#fff',
  },
})
