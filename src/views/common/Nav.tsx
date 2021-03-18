import React from 'react'
import { useContext } from 'react'
import { Text, View } from 'react-native'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Utils from '../../common/Utils'
import * as Resources from '../../common/Resources'
import { NavigationView } from './NavigationView'
import ThrottleButton from '../../component/ThrottleButton'

function Nav(props: {
  navigation: any
  focused: number
  symbol: string
  nextEnable: boolean
  nextPressed: () => void
}) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
      }}
    >
      <NavigationView navigation={props.navigation} />

      {props.focused > 0 ? (
        <Text
          style={{
            width: '100%',
            textAlign: 'center',
            top: safeInsetTop + 22,
            position: 'absolute',
            fontFamily: Resources.Fonts.medium,
            fontSize: 14,
            color: Resources.Colors.white,
          }}
        >
          {translations.withdrawView.withdraw +
            ' ' +
            Utils.getDenom(props.symbol)}
        </Text>
      ) : (
        <View />
      )}

      <View
        style={{
          flexDirection: 'row',
          marginLeft: '50%',
          width: '50%',
        }}
      >
        <View style={{ flex: 1 }} />
        <ThrottleButton
          type='RectButton'
          style={{
            height: 36,
            marginTop: 11 + safeInsetTop,
            marginRight: 24,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={8}
          onPress={() => {
            props.nextPressed()
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 14,
              letterSpacing: -0.2,
              color: props.nextEnable
                ? Resources.Colors.brightTeal
                : Resources.Colors.greyishBrown,
            }}
          >
            {translations.withdrawView.next}
          </Text>
        </ThrottleButton>
      </View>
    </View>
  )
}

export default Nav
