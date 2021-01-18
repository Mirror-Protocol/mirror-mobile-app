import React, { useRef, useEffect, useState } from 'react'
import { View, Animated, Text, GestureResponderEvent } from 'react-native'
import * as Resources from '../../common/Resources'
import * as Utils from '../../common/Utils'

import { LineChart } from 'react-native-svg-charts'
import * as shape from 'd3-shape'
import { ChartInfo } from './MainTab1'

interface ChartData {
  list: number[]
  simplified: number[]
  lineColor: any
  yMin: number
  yMax: number
}

export function MainChartView(props: {
  data: ChartInfo
  chartLongPressed: boolean
  setChartLongPressed: (e: boolean) => void
  scrollViewScrolling: any
  valueChanged: (v: any) => void
}) {
  const [chartData, setChartData] = useState({
    list: [] as number[],
    simplified: [] as number[],
    lineColor: 'transparent',
    yMin: 0,
    yMax: 0,
  } as ChartData)
  const rawdata = useRef([] as any)
  useEffect(() => {
    setChartData({
      list: props.data.list.map((item) => {
        return item.value.toNumber()
      }),

      simplified: props.data.simplified.map((item) => {
        return item.value.toNumber()
      }),
      lineColor: props.data.rate.isLessThan(0)
        ? Resources.Colors.brightPink
        : Resources.Colors.brightTeal,
      yMin: Math.floor(props.data.minValue.toNumber()),
      yMax: Math.ceil(props.data.maxValue.toNumber()),
    })

    rawdata.current = props.data.list
  }, [props.data])

  const measuredChartWidth = useRef(0)
  const measuredLabelWidth = useRef(100)

  const chartXY = useRef(new Animated.ValueXY()).current
  const chartLabelXY = useRef(new Animated.ValueXY()).current
  const chartLineXY = useRef(new Animated.ValueXY()).current
  const [convertedX, setConvertedX] = useState(-1)

  const lastX = useRef(-100)
  const lastY = useRef(-100)
  chartXY.addListener((e) => {
    if (e.x < 1) {
      return
    }

    if (Math.abs(lastX.current - e.x) <= 1) {
      return
    }

    if (Math.abs(lastY.current - e.y) >= 100) {
      onTouchEnd()
      return
    }

    lastX.current = e.x
    lastY.current = e.y
    setLabel(e.x)
    setLine(e.x)
  })

  function setLabel(x: number) {
    const half = measuredLabelWidth.current / 2
    let newX = 0
    if (x < half) {
      newX = half
    } else if (x > measuredChartWidth.current - half) {
      newX = measuredChartWidth.current - half
    } else {
      newX = x
    }
    chartLabelXY.setValue({ x: newX, y: 0 })
  }

  function setLine(x: number) {
    const xUnit = parseInt(
      (
        x /
        ((measuredChartWidth.current * 1.0) / rawdata.current.length)
      ).toString()
    )

    if (xUnit >= 0 && rawdata.current[xUnit] != undefined) {
      props.valueChanged(rawdata.current[xUnit])
      setConvertedX(xUnit)
    }

    chartLineXY.setValue({ x: x, y: 0 })
  }

  let timer = useRef(null as any)

  let onTouchEndTime: number | undefined = undefined
  function onTouchEnd() {
    clearTimeout(timer.current)
    timer.current = null

    const currentOnTouchEndTime = new Date().getTime()
    if (
      onTouchEndTime !== undefined &&
      onTouchEndTime + 1000000 > currentOnTouchEndTime
    ) {
      return
    }
    onTouchEndTime = currentOnTouchEndTime

    if (props.chartLongPressed) {
      Utils.haptic()
    }
    props.setChartLongPressed(false)
    chartXY.flattenOffset()
  }

  function onTouchStart(e: GestureResponderEvent) {
    if (timer.current == null) {
      const touchXY = {
        x: e.nativeEvent.pageX,
        y: e.nativeEvent.locationY,
      }

      lastX.current = touchXY.x
      lastY.current = touchXY.y
      chartXY.setValue({ x: touchXY.x, y: touchXY.y })
      setLabel(touchXY.x)
      setLine(touchXY.x)

      timer.current = setTimeout(() => {
        if (props.scrollViewScrolling.current) {
          return
        }
        Utils.haptic()
        props.setChartLongPressed(true)
      }, 500)
    }
  }

  return (
    <Animated.View
      onLayout={(e) => {
        measuredChartWidth.current = e.nativeEvent.layout.width
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchMove={Animated.event(
        [
          {
            nativeEvent: {
              locationX: chartXY.x,
              locationY: chartXY.y,
            },
          },
        ],
        { useNativeDriver: false }
      )}
      focusable={true}
    >
      {chartData.list.length == 0 ? (
        <View />
      ) : (
        <View>
          <SimpleChart
            hidden={props.chartLongPressed}
            chartTop={30}
            chartBottom={30}
            chartData={chartData}
          />

          {props.chartLongPressed ? (
            <DetailChart chartTop={30} chartBottom={30} chartData={chartData} />
          ) : (
            <View />
          )}

          {props.chartLongPressed ? (
            <VerticalLine chartLineXY={chartLineXY} />
          ) : (
            <View />
          )}

          {props.chartLongPressed &&
          convertedX >= 0 &&
          convertedX < rawdata.current.length ? (
            <LabelView
              chartLabelXY={chartLabelXY}
              measuredLabelWidth={measuredLabelWidth}
              text={rawdata.current[convertedX].formattedTime}
            />
          ) : (
            <View />
          )}
        </View>
      )}
    </Animated.View>
  )
}

function SimpleChart(props: {
  hidden: boolean
  chartTop: number
  chartBottom: number
  chartData: ChartData
}) {
  return (
    <LineChart
      style={{
        height: '100%',
        opacity: props.hidden ? 0 : 1,
      }}
      yMin={props.chartData.yMin}
      yMax={props.chartData.yMax}
      data={props.chartData.simplified}
      svg={{ stroke: props.chartData.lineColor, strokeWidth: 4 }}
      curve={shape.curveBasis}
      contentInset={{
        top: props.chartTop,
        bottom: props.chartBottom,
      }}
    />
  )
}

function DetailChart(props: {
  chartTop: number
  chartBottom: number
  chartData: ChartData
}) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
      }}
    >
      <LineChart
        style={{ height: '100%' }}
        yMin={props.chartData.yMin}
        yMax={props.chartData.yMax}
        data={props.chartData.list}
        svg={{ stroke: props.chartData.lineColor, strokeWidth: 2.5 }}
        curve={shape.curveBasis}
        contentInset={{
          top: props.chartTop,
          bottom: props.chartBottom,
        }}
      />
    </View>
  )
}

function VerticalLine(props: { chartLineXY: any }) {
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: props.chartLineXY.x,
          top: 0,
          width: 1,
          height: '100%',
          backgroundColor: Resources.Colors.white,
        },
      ]}
    />
  )
}

function LabelView(props: {
  chartLabelXY: any
  text: string
  measuredLabelWidth: any
}) {
  const [width, setWidth] = useState(0)

  return (
    <Animated.View
      style={{
        left: props.chartLabelXY.x,
        transform: [{ translateX: -(width / 2) }],
        position: 'absolute',
        top: -16,
        height: 16,
      }}
    >
      <Text
        style={{
          fontFamily: Resources.Fonts.book,
          fontSize: 12,
          color: Resources.Colors.white,
          textAlign: 'center',
        }}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width)
          props.measuredLabelWidth.current = e.nativeEvent.layout.width
        }}
      >
        {props.text}
      </Text>
    </Animated.View>
  )
}
