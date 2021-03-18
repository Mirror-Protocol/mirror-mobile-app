import React from 'react'
import { ReactElement } from 'react'
import { View, ViewProps } from 'react-native'

const Separator = (props: ViewProps): ReactElement => (
  <View {...props}>
    <View style={{ height: 1, backgroundColor: 'rgb(9,9,10)' }} />
    <View style={{ height: 1, backgroundColor: 'rgb(40,40,42)' }} />
  </View>
)

export default Separator
