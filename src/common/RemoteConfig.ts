import remoteConfig from '@react-native-firebase/remote-config'

export enum RemoteConfigKey {
  newOnboarding = 'new_onboarding',
}

export function initRemoteConfig() {
  remoteConfig()
    .setDefaults({
      [RemoteConfigKey.newOnboarding]: true,
    })
    .then(() => remoteConfig().fetchAndActivate())
    .catch((reason) => console.error(reason))
}

export function getRemoteConfig(key: RemoteConfigKey) {
  return remoteConfig().getValue(key)
}
