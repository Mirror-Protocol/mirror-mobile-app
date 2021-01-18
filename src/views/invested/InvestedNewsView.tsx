import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import * as Resources from '../../common/Resources'
import { NavigationView } from '../common/NavigationView'
import WebView from 'react-native-webview'

export function InvestedNewsView(props: { route: any; navigation: any }) {
  const safeInsetTop = Resources.getSafeLayoutInsets().top

  const [url, setUrl] = useState('')
  useEffect(() => {
    if (props.route.params && props.route.params.url) {
      setUrl(props.route.params.url)
    }
  }, [])

  return (
    <View
      style={{
        paddingTop: safeInsetTop,
        backgroundColor: Resources.Colors.darkBackground,
        flex: 1,
      }}
    >
      {url != '' ? (
        <WebView source={{ uri: url }} style={{ marginTop: 52 }} />
      ) : (
        <View />
      )}

      <NavigationView navigation={props.navigation} />
    </View>
  )
}
