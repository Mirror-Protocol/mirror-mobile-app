import React, { useCallback, useContext, useState } from 'react'
import { Text, View, Image } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Api from '../../common/Apis/Api'
import {
  RectButton,
  ScrollView,
  TouchableOpacity,
} from 'react-native-gesture-handler'
import { PasscodeMode } from '../common/PinSecurityView'
import { useFocusEffect } from '@react-navigation/native'
import { ConfigContext } from '../../common/provider/ConfigProvider'

export function AgreeView(props: { navigation: any; route: any }) {
  function passPressed() {
    const param = {
      email: props.route.params.email,
      typeOfLogin: props.route.params.typeOfLogin,
      verifier: props.route.params.verifier,
      privateKey: props.route.params.privateKey,
      mode: PasscodeMode.Set,
    }
    props.navigation.navigate('PinSecurityView', param)
  }

  if (props.route.params.agreePass) {
    passPressed()
    return (
      <View
        style={{ flex: 1, backgroundColor: Resources.Colors.darkBackground }}
      />
    )
  }

  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const [json, setJson] = useState(null as any)

  useFocusEffect(
    useCallback(() => {
      Api.getPrivacy().then((agreement) => {
        setJson(agreement.data)
      })
    }, [])
  )

  return (
    <View
      style={{
        backgroundColor: Resources.Colors.brightTeal,
        flex: 1,
        paddingTop: safeInsetTop,
      }}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={{
            flexDirection: 'row',
            marginLeft: 24,
            marginRight: 18,
            marginTop: 10,
          }}
        >
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={{
              width: 36,
              height: 36,

              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => {
              props.navigation.pop()
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: Resources.Colors.darkGreyThree,
                borderRadius: 12,
              }}
            >
              <Image
                source={Resources.Images.btnCloseG10}
                style={{ width: 10, height: 10 }}
              />
            </View>
          </TouchableOpacity>
        </View>
        {json != null ? (
          <View
            style={{
              marginTop: 36,
              paddingLeft: 22,
              paddingRight: 22,
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.bold,
                fontSize: 24,
                letterSpacing: -0.5,
                color: Resources.Colors.black,
              }}
            >
              {json.title1}
            </Text>
            <Text
              style={{
                marginTop: 4,
                marginBottom: 24,
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
                lineHeight: 16,
                color: Resources.Colors.black,
              }}
            >
              {json.title2}
            </Text>

            {json.contents.map((item: any, index: number) => {
              return <ItemView key={index} item={item} />
            })}

            <FooterView text={json.agree} passPressed={passPressed} />
          </View>
        ) : (
          <View />
        )}
      </ScrollView>
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
  const expandable = props.item.expandable ? props.item.expandable : false
  const [isExpand, setExpand] = useState(false)

  if (!expandable) {
    return (
      <View style={{ marginTop: 32 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={{
              flex: 1,
              fontFamily: Resources.Fonts.medium,
              fontSize: 12,
              letterSpacing: -0.3,
              color: Resources.Colors.black,
            }}
          >
            {props.item.content}
          </Text>
        </View>
        <View>
          {props.item.list.map((item: any, index: number) => {
            return (
              <ItemText
                key={index}
                depth={item.depth}
                underline={item.underline}
                content={item.content}
              />
            )
          })}
        </View>
      </View>
    )
  } else {
    return (
      <View style={{ marginTop: 32 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 12,
          }}
        >
          <RectButton
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 36,
            }}
            onPress={() => {
              setExpand(!isExpand)
            }}
          >
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 12,
                letterSpacing: -0.3,
                color: Resources.Colors.black,
              }}
            >
              {props.item.content}
            </Text>

            <Image
              source={Resources.Images.btnExpandOpenB}
              style={{
                marginLeft: 3,
                width: 8,
                height: 6,
                transform: [{ rotateX: isExpand ? '180deg' : '0deg' }],
              }}
            />
          </RectButton>
        </View>
        {isExpand ? (
          <View>
            {props.item.list.map((item: any, index: number) => {
              return (
                <ItemText
                  key={index}
                  depth={item.depth}
                  underline={item.underline}
                  content={item.content}
                />
              )
            })}
          </View>
        ) : (
          <View />
        )}
      </View>
    )
  }
}

function ItemText(props: {
  depth: number
  underline: boolean
  content: string
}) {
  return (
    <Text
      style={{
        marginLeft: (props.depth - 1) * 20,
        marginTop: 15,
        fontFamily: Resources.Fonts.book,
        fontSize: 12,
        lineHeight: 16,
        textDecorationLine: props.underline ? 'underline' : 'none',
        letterSpacing: -0.3,
        color: Resources.Colors.darkGreenBlue,
      }}
    >
      {props.content}
    </Text>
  )
}

function FooterView(props: { text: string; passPressed: () => void }) {
  const { translations } = useContext(ConfigContext)
  const [agreed, setAgreed] = useState(false)

  return (
    <View style={{ marginTop: 80 }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}
        onPress={() => {
          setAgreed(!agreed)
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 7,
            backgroundColor: Resources.Colors.aquamarine,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            style={{
              width: 12,
              height: 12,
              opacity: agreed ? 1 : 0.2,
            }}
            source={Resources.Images.iconCheckB}
          />
        </View>

        <Text
          style={{
            flex: 1,
            marginLeft: 8,
            fontFamily: Resources.Fonts.medium,
            fontSize: 12,
            lineHeight: 14,
            letterSpacing: -0.3,
            color: agreed ? Resources.Colors.black : Resources.Colors.sea,
          }}
        >
          {props.text}
        </Text>
      </TouchableOpacity>

      <RectButton
        enabled={agreed}
        style={{
          marginTop: 28,
          marginBottom: 20 + Resources.getSafeLayoutInsets().bottom,
          height: 48,
          borderRadius: 24,
          backgroundColor: agreed
            ? Resources.Colors.darkGreyThree
            : Resources.Colors.aquamarine,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPress={props.passPressed}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.5,
            color: agreed ? Resources.Colors.brightTeal : Resources.Colors.sea,
          }}
        >
          {translations.agreeView.button}
        </Text>
      </RectButton>
    </View>
  )
}
