import React, { useContext, useEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { RectButton, ScrollView } from 'react-native-gesture-handler'
import { Coin } from '@terra-money/terra.js'
import { StackActions } from '@react-navigation/native'
import { ConfigContext } from '../../common/provider/ConfigProvider'
import BigNumber from 'bignumber.js'
import ThrottleButton from '../../component/ThrottleButton'
import * as Resources from '../../common/Resources'
import * as Keychain from '../../common/Keychain'
import * as Utils from '../../common/Utils'
import BtnBack from '../../component/BtnBack'

export const SelectWalletView = (props: { navigation: any; route: any }) => {
  const { translations } = useContext(ConfigContext)
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const addr118 = props.route.params.keys[118].mnemonicKey.accAddress
  const addr330 = props.route.params.keys[330].mnemonicKey.accAddress

  const [selectedWallet, setSelectedWallet] = useState(0)

  const assets118 = props.route.params.keys[118].assets

  const is118Balance =
    assets118.balance !== undefined && assets118.balance.length > 0
  const is118Delegations =
    assets118.delegations !== undefined && assets118.delegations.length > 0
  const is118UnbondingDelegations =
    assets118.unbondingDelegations !== undefined &&
    assets118.unbondingDelegations.length > 0
  const is118VestingSchedules =
    assets118.vestingSchedules !== undefined &&
    assets118.vestingSchedules.length > 0

  const [empty118] = useState<boolean>(
    is118Balance ||
      is118Delegations ||
      is118UnbondingDelegations ||
      is118VestingSchedules
  )

  useEffect(() => {
    !empty118 && selectWallet(330)
  }, [empty118])

  const selectWallet = async (bip: number) => {
    const wallet = props.route.params.keys[bip].mnemonicKey

    const isHaveAddress = await Keychain.isHaveUserAddress(wallet.accAddress)
    const authParams = {
      accessToken: '',
      email: '',
      privateKey: Utils.toHexString(
        props.route.params.keys[bip].mnemonicKey.privateKey
      ),
      typeOfLogin: '',
      verifier: '',
    }

    props.navigation.dispatch({
      ...StackActions.replace('InitialStack', {
        screen: 'AgreeView',
        params: { ...authParams, agreePass: isHaveAddress },
      }),
    })
  }

  const BipButton = ({ bip, addr }: { bip: number; addr: string }) => (
    <RectButton onPress={() => setSelectedWallet(bip)}>
      <View
        style={{
          backgroundColor: Resources.Colors.darkGreyTwo,
          borderRadius: 24,
          marginHorizontal: 24,
          margin: 6,
          padding: 24,
          borderWidth: 1,
          borderColor:
            selectedWallet === bip
              ? Resources.Colors.brightTeal
              : Resources.Colors.darkGreyTwo,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 7,
          }}
        >
          <Image
            source={Resources.Images.iconWalletG18}
            style={{
              width: 14,
              height: 14,
              marginRight: 6,
              opacity: selectedWallet === bip ? 1 : 0.5,
            }}
          />
          <Text
            style={{
              fontFamily: Resources.Fonts.book,
              color: Resources.Colors.brownishGrey,
              fontSize: 12,
              letterSpacing: -0.17,
            }}
          >
            {`BIP ${bip}`}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: Resources.Fonts.book,
            color: Resources.Colors.veryLightPinkTwo,
            fontSize: 18,
            lineHeight: 22,
            letterSpacing: -0.3,
          }}
        >
          {addr}
        </Text>
        {
          <>
            <View style={{ marginVertical: 24 }}>
              <View
                style={{
                  height: 1,
                  backgroundColor: Resources.Colors.darkGreyThree,
                }}
              />
              <View
                style={{
                  height: 1,
                  backgroundColor: Resources.Colors.darkGrey,
                }}
              />
            </View>
            {props.route.params.keys[bip].assets.balance.map((asset: Coin) => (
              <Text
                style={{
                  fontFamily: Resources.Fonts.book,
                  fontSize: 14,
                  letterSpacing: -0.3,
                  color: Resources.Colors.brownishGrey,
                  marginVertical: 4,
                  alignSelf: 'flex-end',
                }}
              >
                {`${Utils.getFormatted(
                  new BigNumber(asset.amount.toString()).dividedBy(1e6),
                  6,
                  true
                )} ${Utils.getDenom(asset.denom)}`}
              </Text>
            ))}
          </>
        }
      </View>
    </RectButton>
  )

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: Resources.Colors.darkBackground,
        paddingTop: safeInsetTop,
      }}
    >
      <BtnBack onPress={() => props.navigation.pop()} />
      {empty118 && (
        <>
          <ScrollView>
            <Text
              style={{
                fontFamily: Resources.Fonts.medium,
                fontSize: 24,
                letterSpacing: -0.3,
                color: Resources.Colors.veryLightPinkTwo,
                alignSelf: 'center',
                marginTop: 104,
                marginBottom: 40,
              }}
            >
              {'Select address to recover'}
            </Text>
            <BipButton bip={118} addr={addr118} />
            <BipButton bip={330} addr={addr330} />
          </ScrollView>
          <ThrottleButton
            type='RectButton'
            style={[
              styles.confirmButton,
              {
                backgroundColor:
                  selectedWallet !== 0
                    ? Resources.Colors.brightTeal
                    : Resources.Colors.darkGreyTwo,
              },
            ]}
            onPress={() => {
              selectedWallet !== 0 && selectWallet(selectedWallet)
            }}
          >
            <Text
              style={[
                styles.confirmText,
                {
                  color:
                    selectedWallet === 0
                      ? Resources.Colors.black
                      : Resources.Colors.greyishBrown,
                },
              ]}
            >
              {translations.recoverSeedView.confirm}
            </Text>
          </ThrottleButton>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  confirmButton: {
    borderRadius: 30,
    height: 48,
    marginVertical: 40,
    marginHorizontal: 24,

    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontFamily: Resources.Fonts.medium,
    color: Resources.Colors.black,
    fontSize: 18,
    letterSpacing: -0.5,
  },
})
