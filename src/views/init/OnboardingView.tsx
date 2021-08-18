import { useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
  ImageSourcePropType,
  StyleSheet,
  Linking,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Swiper from 'react-native-swiper'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import * as Resources from '../../common/Resources'
import * as Keychain from '../../common/Keychain'
import * as Config from '../../common/Apis/Config'
import remoteConfig from '@react-native-firebase/remote-config'
import { getRemoteConfig, RemoteConfigKey } from '../../common/RemoteConfig'

const dotPosition = 298

export const OnboardingView = () => {
  useEffect(() => {
    if (Platform.OS === 'ios') {
      Keychain.reset()
    }
  }, [])

  return (
    <>
      <SwiperView />
      <SkipButton />
    </>
  )
}

interface SlideContentProps {
  text: string
  style: 'normal' | 'bold' | 'link'
  link?: string
}

interface SlideProps {
  imageSource: ImageSourcePropType
  title: String
  content: SlideContentProps[]
  setSlideContentY: (y: number) => void
}

const SkipButton = () => {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const { translations } = useContext(ConfigContext)

  return (
    <TouchableOpacity
      style={{
        width: Dimensions.get('window').width,
        backgroundColor: Resources.Colors.black,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
      }}
      onPress={() => {
        navigation.navigate('InitialView', { disableLogoAnim: true })
      }}
    >
      <View style={{ height: 60, justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 18,
            letterSpacing: -0.5,
            color: Resources.Colors.brightTeal,
          }}
        >
          {translations.onboardingView.createAccount}
        </Text>
      </View>
      {Platform.OS === 'ios' && <View style={{ height: insets.bottom }} />}
    </TouchableOpacity>
  )
}

const swiperActiveDot = () => (
  <View
    style={{
      width: 12,
      height: 4,
      borderRadius: 2.5,
      marginHorizontal: 2,
      backgroundColor: Resources.Colors.darkGreyThree,
    }}
  />
)
const swiperDot = () => (
  <View
    style={{
      width: 4,
      height: 4,
      borderRadius: 2.5,
      marginHorizontal: 2,
      backgroundColor: Resources.Colors.darkGreyThree,
      opacity: 0.24,
    }}
  />
)

const SwiperView = () => {
  const insets = useSafeAreaInsets()
  const { translations } = useContext(ConfigContext)

  const [slideContentY, setSlideContentY] = useState(0)
  const [newOnboarding, setNewOnboarding] = useState(false)

  // Remote config - onboarding A/B test
  useEffect(() => {
    const v = getRemoteConfig(RemoteConfigKey.newOnboarding)
    console.log('newOnboarding', v, v.asBoolean())
    setNewOnboarding(v.asBoolean())
  }, [])

  const w = Dimensions.get('window').width
  const h = Dimensions.get('window').height

  const OnboardingV1 = () => (
    <Swiper
      style={{ backgroundColor: 'rgb(0, 237, 199)' }}
      showsButtons={false}
      autoplay={false}
      loop={false}
      paginationStyle={{
        justifyContent: 'flex-start',
        margin: 0,
        padding: 0,
        left: 24,
        top:
          Platform.OS === 'ios'
            ? undefined
            : slideContentY - slideContentY / 32,
        bottom: Platform.OS === 'ios' ? 212 : h,
      }}
      activeDot={swiperActiveDot()}
      dot={swiperDot()}
    >
      <View style={{ flex: 1 }}>
        <Slide
          imageSource={Resources.Images.onboarding01}
          title={translations.onboardingView.title1}
          content={[
            { text: translations.onboardingView.content1_1, style: 'normal' },
            { text: translations.onboardingView.content1_2, style: 'bold' },
            { text: translations.onboardingView.content1_3, style: 'normal' },
          ]}
          setSlideContentY={setSlideContentY}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Slide
          imageSource={Resources.Images.onboarding02}
          title={translations.onboardingView.title2}
          content={[
            { text: translations.onboardingView.content2, style: 'normal' },
          ]}
          setSlideContentY={setSlideContentY}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Slide
          imageSource={Resources.Images.onboarding03}
          title={translations.onboardingView.title3}
          content={[
            { text: translations.onboardingView.content3_1, style: 'normal' },
            {
              text: translations.onboardingView.content3_2,
              style: 'link',
              link: Config.protocolDocumentation,
            },
            { text: translations.onboardingView.content3_3, style: 'normal' },
          ]}
          setSlideContentY={setSlideContentY}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Slide
          imageSource={Resources.Images.onboarding04}
          title={translations.onboardingView.title4}
          content={[
            { text: translations.onboardingView.content4, style: 'normal' },
          ]}
          setSlideContentY={setSlideContentY}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Slide
          imageSource={Resources.Images.onboarding05}
          title={translations.onboardingView.title5}
          content={[
            { text: translations.onboardingView.content5, style: 'normal' },
          ]}
          setSlideContentY={setSlideContentY}
        />
      </View>
    </Swiper>
  )

  const OnboardingV2 = () => {
    const contentStyle = StyleSheet.create({
      normal: {
        fontFamily: Resources.Fonts.book,
        fontSize: 14,
        letterSpacing: -0.3,
        lineHeight: 21,
        color: Resources.Colors.darkGreyThree,
        fontWeight: 'normal',
        textDecorationLine: 'none',
      },
      bold: {
        fontFamily: Resources.Fonts.book,
        fontSize: 14,
        letterSpacing: -0.3,
        lineHeight: 21,
        color: Resources.Colors.darkGreyThree,
        fontWeight: 'bold',
        textDecorationLine: 'none',
      },
    })

    return (
      <Swiper
        style={{ backgroundColor: 'rgb(0, 237, 199)' }}
        showsButtons={false}
        autoplay={false}
        loop={false}
        paginationStyle={{
          justifyContent: 'flex-start',
          margin: 0,
          padding: 0,
          left: 24,
          top:
            Platform.OS === 'ios'
              ? undefined
              : slideContentY - slideContentY / 32,
          bottom: Platform.OS === 'ios' ? dotPosition - 44 : h,
        }}
        activeDot={swiperActiveDot()}
        dot={swiperDot()}
      >
        <View style={{ flex: 1 }}>
          <SlideV2
            imageSource={Resources.Images.onboarding2_01}
            title={`Trade Mirror Assets`}
            content={
              <Text style={contentStyle.normal}>
                {`Mirror Assets are tokens that track the price of real-world assets, but do`}
                <Text style={contentStyle.bold}>{` "NOT" `}</Text>
                {`confer any share rights of the underlying assets.`}
              </Text>
            }
            setSlideContentY={setSlideContentY}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SlideV2
            imageSource={Resources.Images.onboarding2_02}
            title={`Why Mirror Assets?`}
            content={
              <Text style={contentStyle.normal}>
                {`Mirror Assets can be traded:\n`}
                <Text style={contentStyle.bold}>{`- 24/7`}</Text>
                {` : trade regardless of market hours\n`}
                <Text
                  style={contentStyle.bold}
                >{`- at fractional shares`}</Text>
                {` : no need to purchase an entire share\n`}
                <Text
                  style={contentStyle.bold}
                >{`- without an order book`}</Text>
                {` : immediate order execution\n`}
              </Text>
            }
            setSlideContentY={setSlideContentY}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SlideV2
            imageSource={Resources.Images.onboarding2_03}
            title={`Get UST`}
            content={
              <Text style={contentStyle.normal}>
                {`Fund your wallet with UST, a USD-pegged stablecoin, to start investing in Mirror Assets.\nYou can cash out by transferring your funds to an exchange account.`}
              </Text>
            }
            setSlideContentY={setSlideContentY}
          />
        </View>
      </Swiper>
    )
  }

  return <>{newOnboarding ? <OnboardingV2 /> : <OnboardingV1 />}</>
}

const SlideV2 = ({
  imageSource,
  title,
  content,
  setSlideContentY,
}: {
  imageSource: ImageSourcePropType
  title: String
  content: JSX.Element | Array<JSX.Element>
  setSlideContentY: (y: number) => void
}) => {
  const insets = useSafeAreaInsets()

  const w = Dimensions.get('window').width
  const h = Dimensions.get('window').height

  const [titlePosY, setTitlePosY] = useState(0)

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: Resources.Colors.brightTeal,
        marginHorizontal: 24,
        marginBottom: 60,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          height: titlePosY,
        }}
      >
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          top: h - dotPosition,
        }}
        onLayout={({ nativeEvent }) => {
          const { y } = nativeEvent.layout
          setTitlePosY(y)
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 24,
            letterSpacing: -0.5,
            color: Resources.Colors.darkGreyThree,
          }}
        >
          {title}
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          top: h - (dotPosition - 64),
        }}
        onLayout={(e) => {
          const { y } = e.nativeEvent.layout
          setSlideContentY(y)
        }}
      >
        {content}
      </View>
    </View>
  )
}

const Slide = ({
  imageSource,
  title,
  content,
  setSlideContentY,
}: SlideProps) => {
  const insets = useSafeAreaInsets()

  const w = Dimensions.get('window').width
  const h = Dimensions.get('window').height

  const contentStyle = StyleSheet.create({
    normal: {
      fontFamily: Resources.Fonts.book,
      fontSize: 14,
      letterSpacing: -0.3,
      color: Resources.Colors.darkGreyThree,
      fontWeight: 'normal',
      textDecorationLine: 'none',
    },
    bold: {
      fontFamily: Resources.Fonts.book,
      fontSize: 14,
      letterSpacing: -0.3,
      color: Resources.Colors.darkGreyThree,
      fontWeight: 'bold',
      textDecorationLine: 'none',
    },
    link: {
      fontFamily: Resources.Fonts.book,
      fontSize: 12,
      letterSpacing: -0.3,
      color: Resources.Colors.darkGreyThree,
      fontWeight: 'normal',
      textDecorationLine: 'underline',
    },
  })
  const getContentStyle = (style: 'normal' | 'bold' | 'link') => {
    switch (style) {
      case 'normal':
        return contentStyle.normal
      case 'bold':
        return contentStyle.bold
      case 'link':
        return contentStyle.link
    }
  }
  const makeContent = (idx: number, content: SlideContentProps[]): any => {
    if (idx >= content.length) return null

    return content[idx].style !== 'link' ? (
      <>
        <Text style={getContentStyle(content[idx].style)}>
          {content[idx].text}
          {makeContent(idx + 1, content)}
        </Text>
      </>
    ) : (
      <>
        <TouchableOpacity
          onPress={() => {
            Linking.openURL(content[idx].link!)
          }}
        >
          <Text style={[getContentStyle(content[idx].style), { bottom: -2 }]}>
            {content[idx].text}
          </Text>
        </TouchableOpacity>
        {makeContent(idx + 1, content)}
      </>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.brightTeal,
        marginHorizontal: 24,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: insets.top,
          width: '100%',
          height: h - 254 - insets.top,
        }}
      >
        <Image
          source={imageSource}
          style={{
            width: '100%',
            height: '100%',
            resizeMode: 'contain',
          }}
        />
      </View>

      <View
        style={{
          position: 'absolute',
          top: h - 254,
        }}
      >
        <Text
          style={{
            fontFamily: Resources.Fonts.medium,
            fontSize: 24,
            letterSpacing: -0.5,
            color: Resources.Colors.darkGreyThree,
          }}
        >
          {title}
        </Text>
      </View>

      <View
        style={{
          position: 'absolute',
          top: h - 190,
        }}
        onLayout={(e) => {
          const { y } = e.nativeEvent.layout
          setSlideContentY(y)
        }}
      >
        {makeContent(0, content)}
      </View>
    </View>
  )
}
