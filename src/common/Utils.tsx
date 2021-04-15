import { CommonActions } from '@react-navigation/native'
import BigNumber from 'bignumber.js'
import { Linking } from 'react-native'
import ReactNativeHapticFeedback from 'react-native-haptic-feedback'
import { currencies } from './Currencies'

const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function haptic() {
  const options = {
    enableVibrateFallback: true,
    ignoreAndroidSystemSettings: false,
  }

  ReactNativeHapticFeedback.trigger('impactMedium', options)
}

export function hexToArray(_value: string): number[] {
  let value = _value
  if (value.length % 2 != 0) {
    throw new Error('hex string length must be 2n')
  }

  if (value.toLowerCase().startsWith('0x')) {
    value = value.replace('0x', '')
  }

  let pkArray: number[] = []
  for (var i = 0; i < value.length / 2; i++) {
    const hex = value[i * 2] + value[i * 2 + 1]
    pkArray.push(parseInt(hex, 16))
  }

  return pkArray
}

export function getDenom(udenom: string): string {
  if (udenom.startsWith('u')) {
    return getDenomWithoutMasset(udenom)
  } else if (
    (udenom.startsWith('m') || udenom.startsWith('u')) &&
    udenom.length > 1
  ) {
    var s = udenom.toLowerCase()
    s = s.substring(0, 1) + s.substring(1, s.length).toUpperCase()
    return s
  }

  return udenom
}

export function getDenomWithoutMasset(udenom: string): string {
  const invalid = !udenom || !udenom.startsWith('u')
  const unit = udenom.slice(1).toUpperCase()
  return invalid
    ? ''
    : unit === 'LUNA'
    ? 'Luna'
    : currencies.includes(unit)
    ? unit.slice(0, 2) + 'T'
    : unit
}

export function getDenomImageWithoutMasset(udenom: string): string {
  const denom = getDenomWithoutMasset(udenom)
  const convDenom = denom.charAt(0).toUpperCase() + denom.toLowerCase().slice(1)

  const uri = `https://mirror.finance/assets/logos/logo${convDenom}.png`

  return uri
}

export function getCutNumber(n: BigNumber, precision: number): BigNumber {
  const str = getFormatted(n, precision, false)
  return new BigNumber(str)
}

export function getFormatted(
  number: BigNumber,
  precision: number,
  withComma: boolean = true
): string {
  if (withComma) {
    const fmt = {
      prefix: '',
      decimalSeparator: '.',
      groupSeparator: ',',
      groupSize: 3,
      secondaryGroupSize: 0,
      fractionGroupSeparator: ' ',
      fractionGroupSize: 0,
      suffix: '',
    }
    BigNumber.config({ FORMAT: fmt })

    const decimalPriceStr = number.toString()
    const seperatePriceStrs: string[] = decimalPriceStr.split('.')

    const integerStr = new BigNumber(seperatePriceStrs[0]).toFormat()
    if (precision > 0) {
      let s = '0000000000'
      if (seperatePriceStrs[1] != undefined) {
        s = seperatePriceStrs[1] + '0000000000'
      }

      return integerStr + '.' + s.substring(0, precision)
    } else {
      return integerStr
    }
  } else {
    const decimalPriceStr = number.toFixed(precision, BigNumber.ROUND_DOWN)
    return decimalPriceStr
  }
}

export function textInputFilter(
  text: String,
  precision: number = 6,
  maxValue: BigNumber = new BigNumber(1e500)
): string {
  const allowd = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.']
  const refined = text.split(',').join('')

  if (refined.length > 0 && refined[0] === '.') {
    return '0'
  }

  for (let i = 0; i < refined.length; i++) {
    if (!allowd.includes(refined.charAt(i))) {
      return ''
    }
  }

  const parsed = parseFloat(refined)
  if (parsed == undefined || isNaN(parsed)) {
    return ''
  } else {
    let balance = refined
    const max = BigNumber.max(maxValue, 0)
    if (new BigNumber(parsed).isGreaterThan(max)) {
      balance = max.toString()
    }

    const split = balance.toString().split('.')
    const split0 = parseInt(split[0]).toString()

    balance = split0.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    if (split.length == 2) {
      balance += '.'

      if (split[1] != '') {
        const split1 = split[1]
        balance += split1.substring(0, precision)
      }
    }
    return balance
  }
}

export function getDateFormat1(date: Date): string {
  return (
    months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear()
  )
}

export function getDateFormat2(timestamp: number): string {
  const date = new Date(timestamp)

  const hour = get2Digit24Hour(date)
  const minutes = get2DigitMinutes(date)

  return hour + ':' + minutes
}

export function getDateFormat3(date: Date): string {
  const hour = get2Digit24Hour(date)
  const minutes = get2DigitMinutes(date)

  return (
    months[date.getMonth()] +
    ' ' +
    date.getDate() +
    ', ' +
    date.getFullYear() +
    ', ' +
    hour +
    ':' +
    minutes
  )
}

export function getDateFormat4(timestamp: number): string {
  const date = new Date(timestamp)

  const hour = get2Digit24Hour(date)
  const minutes = get2DigitMinutes(date)

  const day = date.getDay()
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return hour + ':' + minutes + ' ' + days[day]
}

export function getDateFormat5(timestamp: number): string {
  const date = new Date(timestamp)
  const hour = get2Digit24Hour(date)
  const minutes = get2DigitMinutes(date)

  return (
    hour + ':' + minutes + ' ' + months[date.getMonth()] + ' ' + date.getDate()
  )
}

function get2Digit24Hour(date: Date) {
  const h = date.getHours()
  const hour = h < 10 ? '0' + h : h
  return hour
}

function get2DigitMinutes(date: Date) {
  const m = date.getMinutes()
  const minutes = m < 10 ? '0' + m : m
  return minutes
}

export function gotoMain(navigation: any) {
  navigation.dispatch(
    CommonActions.reset({
      index: 1,
      routes: [{ name: 'MainStack' }],
    })
  )
}

export function encodeQueryData(data: Object) {
  return Object.entries(data)
    .map((pair) => pair.map(encodeURIComponent).join('='))
    .join('&')
}

export function stringNumberWithComma(n: string) {
  if (n === undefined) return 0.0
  const parts = n.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

export function stringNumberWithoutComma(n: string) {
  return n.replace(/,/g, '')
}

export function contactUs() {
  const supportEmail = 'support@mirrorwallet.com'
  try {
    Linking.openURL(`mailto:${supportEmail}`)
  } catch (e) {}
}
