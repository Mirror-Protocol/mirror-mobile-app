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
    .then((fetchedRemotely) => {
      if (fetchedRemotely) {
        // console.log('fetch success')
      } else {
        // console.log('fetch failed')
      }
    })
    .catch((reason) => console.error(reason))
}

export function getRemoteConfig(key: RemoteConfigKey) {
  return remoteConfig().getValue(key)
}
