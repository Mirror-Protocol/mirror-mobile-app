import React, { useContext } from 'react'
import {
  Animated,
  Image,
  ImageSourcePropType,
  Platform,
  Text,
  View,
} from 'react-native'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import ThrottleButton from '../../component/ThrottleButton'
import useProgressAnim from './anim/useProgressAnim'
import * as Resources from '../../common/Resources'
import * as Keychain from '../../common/Keychain'
import { PendingData } from '../../hooks/usePending'

function BuyButton(props: {
  navigation: any
  route: any
  topupPressed: () => void
  pendingData: PendingData[]
  titleIcon: ImageSourcePropType
  title: string
  withdraw: boolean
}) {
  const { translations } = useContext(ConfigContext)
  const { progressAnimLeft, progressAnimWidth } = useProgressAnim({ width: 44 })

  const isWithdraw = props.withdraw

  return (
    <View
      style={{
        marginTop: 16,
        marginLeft: 24,
        marginRight: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Resources.Colors.sea,
      }}
    >
      <ThrottleButton
        type={'RectButton'}
        style={{
          height: 54,
          borderRadius: 16,
          backgroundColor: Resources.Colors.darkBackground,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onPress={() => {
          !isWithdraw && props.topupPressed()
        }}
      >
        <Image
          style={{
            marginLeft: 24,
            width: 22,
            height: 22,
          }}
          source={props.titleIcon}
        />
        <Text
          style={[
            {
              marginLeft: 3,
              fontSize: 14,
              fontFamily: Resources.Fonts.medium,
              letterSpacing: -0.35,
              color: Resources.Colors.brightTeal,
              flex: 1,
            },
            Platform.OS === 'android' && { marginBottom: 3 },
          ]}
        >
          {props.title}
        </Text>
        {!isWithdraw && (
          <>
            <Text
              style={[
                {
                  fontSize: 14,
                  fontFamily: Resources.Fonts.medium,
                  letterSpacing: -0.23,
                  color: Resources.Colors.brightTeal,
                },
                Platform.OS === 'android' && { marginBottom: 3 },
              ]}
            >
              {translations.walletSummaryView.buyNow}
            </Text>
            <Image
              style={{
                marginRight: 24,
                width: 6,
                height: 12,
                marginLeft: 6,
              }}
              source={Resources.Images.chevronR11G}
            />
          </>
        )}
      </ThrottleButton>
      {props.pendingData.length > 0 && (
        <View
          style={{
            height: 1,
            marginHorizontal: 24,
            marginBottom: 9,
            backgroundColor: Resources.Colors.sea,
          }}
        />
      )}
      {props.pendingData.map((i, idx) => (
        <ThrottleButton
          type={'TouchableOpacity'}
          key={`walletsummarytab1-pending-${idx}`}
          style={{
            height: 64,
            marginHorizontal: 24,
            marginVertical: 15,
            flexDirection: 'row',
          }}
          onPress={() => {
            if (i.key === 'moonpay') {
              Keychain.getMoonpayLastHistory().then((history) => {
                if (history !== '') {
                  try {
                    props.navigation.push('RampItemDetailView', {
                      item: history,
                      moonpay: true,
                    })
                  } catch {}
                }
              })
            } else {
              // switchain
              Keychain.getSwitchainOffer(i.key).then((offer) => {
                if (offer) {
                  try {
                    props.navigation.push('RampItemDetailView', {
                      item: offer[i.key].order,
                      withdraw: isWithdraw,
                    })
                  } catch {}
                }
              })
            }
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              backgroundColor: isWithdraw ? '#ff00bd3d' : Resources.Colors.dark,
              borderRadius: 32,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
                color: isWithdraw
                  ? 'rgb(255, 140, 235)'
                  : Resources.Colors.brightTeal,
                marginBottom: 6,
              }}
            >
              {isWithdraw ? `Sending` : `Pending`}
            </Text>
            <View
              style={{
                width: 44,
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
                  backgroundColor: isWithdraw
                    ? 'rgb(255, 140, 235)'
                    : Resources.Colors.brightTeal,
                }}
              />
            </View>
          </View>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-end',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              {i.title && (
                <>
                  <Text
                    style={{
                      fontFamily: Resources.Fonts.medium,
                      fontSize: 14,
                      letterSpacing: -0.23,
                      color: Resources.Colors.greyishBrown,
                    }}
                  >
                    {i.title}
                  </Text>
                  <View
                    style={{
                      width: 1,
                      height: 8,
                      marginHorizontal: 7,
                      backgroundColor: 'rgb(67, 67, 67)',
                    }}
                  />
                </>
              )}
              <Text
                style={{
                  fontFamily: Resources.Fonts.medium,
                  fontSize: 14,
                  letterSpacing: -0.2,
                  color: Resources.Colors.greyishBrown,
                }}
              >
                {i.from}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignSelf: 'flex-end',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontFamily: Resources.Fonts.medium,
                  fontSize: 14,
                  letterSpacing: -0.35,
                  color: Resources.Colors.veryLightPink,
                }}
              >
                {i.to}
              </Text>
            </View>
          </View>
        </ThrottleButton>
      ))}
      {props.pendingData.length > 0 && <View style={{ marginBottom: 9 }} />}
    </View>
  )
}

export default BuyButton
