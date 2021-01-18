import React, { useContext, useEffect, useState } from 'react'
import { StyleProp, Text, View, ViewStyle } from 'react-native'
import * as Resources from '../../../common/Resources'
import { ScrollView } from 'react-native-gesture-handler'
import { NavigationView } from '../../common/NavigationView'
import { ConfigContext } from '../../../common/provider/ConfigProvider'
import DeviceInfo from 'react-native-device-info'

export function VersionView(props: { navigation: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const [currentVersion, setCurrentVersion] = useState('')

  useEffect(() => {
    setCurrentVersion(DeviceInfo.getVersion())
  }, [])

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: safeInsetTop,
      }}
    >
      <ScrollView
        style={{ paddingLeft: 24, paddingRight: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: 52 }} />
        <Text
          style={{
            marginTop: 55,
            fontFamily: Resources.Fonts.medium,
            fontSize: 32,
            letterSpacing: -0.3,
            color: Resources.Colors.white,
          }}
        >
          {translations.versionView.version}
        </Text>
        <View
          style={{
            marginTop: 32,
            height: 1,
            backgroundColor: Resources.Colors.dummyup,
          }}
        />
        <View
          style={{
            marginBottom: 32,
            height: 1,
            backgroundColor: Resources.Colors.dummydown,
          }}
        />
        <VersionItem
          style={{ marginBottom: 32 }}
          title={translations.versionView.current}
          sub={currentVersion}
        />
        <View style={{ height: 50 }} />
      </ScrollView>
      <NavigationView navigation={props.navigation} />
    </View>
  )
}

function VersionItem(props: {
  style?: StyleProp<ViewStyle>
  title: string
  sub: string
  update?: boolean
}) {
  const { translations } = useContext(ConfigContext)
  return (
    <View
      style={[
        props.style,
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      ]}
    >
      <View style={{ flexDirection: 'column' }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 14,
            letterSpacing: -0.3,
            color: Resources.Colors.brownishGrey,
            marginBottom: 8,
          }}
        >
          {props.title}
        </Text>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            fontSize: 18,
            letterSpacing: -0.3,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.sub}
        </Text>
      </View>
      {props.update && (
        <View
          style={{
            width: 72,
            height: 28,
            borderRadius: 14,
            backgroundColor: Resources.Colors.darkGreyTwo,

            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.3,
              color: Resources.Colors.brightTeal,
            }}
          >
            {translations.versionView.update}
          </Text>
        </View>
      )}
    </View>
  )
}
