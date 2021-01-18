import React, { useContext, useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import * as Resources from '../../../common/Resources'
import * as Api from '../../../common/Apis/Api'
import { ScrollView } from 'react-native-gesture-handler'
import { NavigationView } from '../../common/NavigationView'
import { ConfigContext } from '../../../common/provider/ConfigProvider'

export function PrivacyView(props: { navigation: any }) {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const [json, setJson] = useState(null as any)

  useEffect(() => {
    Api.getPrivacy().then((agreement) => {
      setJson(agreement.data)
    })
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
          {translations.privacyView.privacyAndTerms}
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
            height: 1,
            backgroundColor: Resources.Colors.dummydown,
          }}
        />
        {json != null ? (
          <View>
            {json.contents.map((item: any, index: number) => {
              return <ItemView key={index} item={item} />
            })}
          </View>
        ) : (
          <View />
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      <NavigationView navigation={props.navigation} />
    </View>
  )
}

function ItemView(props: {
  item: {
    expandable: boolean
    content: string
    list: []
  }
}) {
  return (
    <View style={{ marginTop: 32 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          style={{
            flex: 1,
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            letterSpacing: -0.3,
            color: Resources.Colors.veryLightPinkTwo,
          }}
        >
          {props.item.content}
        </Text>
      </View>
      <View>
        {props.item.list.map((item: any, index: number) => {
          return (
            <Text
              key={index}
              style={{
                marginLeft: (item.depth - 1) * 20,
                marginTop: 15,
                fontFamily: Resources.Fonts.book,
                fontSize: 12,
                lineHeight: 16,
                textDecorationLine: item.underline ? 'underline' : 'none',
                letterSpacing: -0.3,
                color: Resources.Colors.brownishGrey,
              }}
            >
              {item.content}
            </Text>
          )
        })}
      </View>
    </View>
  )
}
