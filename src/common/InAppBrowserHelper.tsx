import InAppBrowser, {
  InAppBrowserOptions,
} from 'react-native-inappbrowser-reborn'
import { Linking } from 'react-native'

const options: InAppBrowserOptions = {
  dismissButtonStyle: 'cancel',
  preferredBarTintColor: 'black',
  preferredControlTintColor: 'white',
  readerMode: false,
  animated: true,
  modalPresentationStyle: 'fullScreen',
  modalEnabled: true,
  enableBarCollapsing: false,

  showTitle: true,
  toolbarColor: 'black',
  secondaryToolbarColor: 'black',
  enableUrlBarHiding: true,
  enableDefaultShare: false,
  forceCloseOnRedirection: false,
  showInRecents: true,
  headers: {
    'my-custom-header': 'my custom header value',
  },
}

export async function launchBrowser(url: string) {
  try {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open(url, {
        ...options,
        dismissButtonStyle: 'done',
      })
      return result as { type: string; url: string }
    } else {
      Linking.openURL(url)
    }
  } catch (error) {
    console.error(error)
  } finally {
  }
}

export async function launchAuth(url: string) {
  try {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.openAuth(url, 'mirrorapp://torusauth', {
        ...options,
        dismissButtonStyle: 'cancel',
      })
      return result as { type: string; url: string }
    } else {
      Linking.openURL(url)
    }
  } catch (error) {
    console.error(error)
  } finally {
  }
}
