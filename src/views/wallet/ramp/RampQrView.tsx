import React, { useContext } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import { NotificationContext } from '../../../common/provider/NotificationProvider'
import { Share, Text, View } from 'react-native'
import * as Resources from '../../../common/Resources'
import QRCode from 'react-native-qrcode-svg'
import RoundedButton from '../../common/RoundedButton'
import RampNavHeader from './RampNavHeader'

const onShare = async (address: string) => {
  try {
    const result = await Share.share({
      message: address,
    })
    switch (result.action) {
      case Share.sharedAction:
        // do nothing
        break
      case Share.dismissedAction:
        // do nothing
        break
    }
  } catch (e) {}
}

const RampQrView = (props: { navigation: any; route: any }) => {
  const insets = useSafeAreaInsets()
  const { showNotification } = useContext(NotificationContext)
  const { translations } = useContext(ConfigContext)

  const address = props.route.params.address
  const denom = props.route.params.denom

  return (
    <>
      <View
        style={{
          flex: 1,
          backgroundColor: Resources.Colors.darkBackground,
          paddingHorizontal: 24,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.bold,
              fontSize: 14,
              lineHeight: 20,
              letterSpacing: -0.3,
              color: Resources.Colors.brightTeal,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            {`Deposit ${denom} to the address\nbelow to receive UST`}
          </Text>

          {/** QR */}
          <View
            style={{
              width: 239,
              borderRadius: 24,
              backgroundColor: Resources.Colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 36,
              marginBottom: 24,
            }}
          >
            {address !== '' && (
              <QRCode
                value={address}
                size={148}
                color='black'
                backgroundColor='white'
              />
            )}
            <View
              style={{
                width: 188,
                height: 1,
                marginTop: 33,
                marginBottom: 22,
                backgroundColor: 'rgb(235, 235, 235)',
              }}
            />
            <Text
              style={{
                fontFamily: Resources.Fonts.book,
                fontSize: 14,
                lineHeight: 20,
                letterSpacing: -0.2,
                marginHorizontal: 24,
                color: Resources.Colors.darkGreyTwo,
                textAlign: 'center',
              }}
            >
              {address}
            </Text>
          </View>
        </View>
        <View
          style={{ flexDirection: 'row', paddingBottom: insets.bottom + 40 }}
        >
          <RoundedButton
            type={'RectButton'}
            style={{ flex: 1 }}
            title={'Share'}
            height={48}
            outline={true}
            onPress={() => {
              onShare(address)
            }}
          />
          <View style={{ width: 9 }} />
          <RoundedButton
            type={'RectButton'}
            style={{ flex: 1 }}
            title={'Copy'}
            height={48}
            outline={false}
            onPress={() => {
              Resources.setClipboard(address)
              showNotification(
                translations.addressPopupView.copied,
                Resources.Colors.brightTeal
              )
            }}
          />
        </View>
      </View>
      <RampNavHeader navigation={props.navigation} showBack={false} />
    </>
  )
}

export default RampQrView
