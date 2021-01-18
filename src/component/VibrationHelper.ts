import { Platform, Vibration } from 'react-native'

export const DEFAULT_PATTERN = Platform.OS === 'ios' ? [0, 200] : [0, 200]

export const Vibrate = (
  pattern: number | number[] = DEFAULT_PATTERN,
  repeat: boolean | undefined = false
) => {
  Vibration.vibrate(pattern, repeat)
}

export const Cancel = () => {
  Vibration.cancel()
}
