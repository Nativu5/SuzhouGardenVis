<script setup lang="ts">
/**
 * 柱状图 + 折线图组合图表（双 Y 轴）
 * 用于同时展示两个不同量级的指标，如总面积（柱状图，左轴）和平均面积（折线图，右轴）
 */

import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from '@/config/echarts'

interface ChartData {
  name: string
  value: number
}

interface Props {
  title?: string
  barData: ChartData[]        // 柱状图数据
  lineData: ChartData[]       // 折线图数据
  barName?: string            // 柱状图系列名称
  lineName?: string           // 折线图系列名称
  barColor?: string           // 柱状图颜色
  lineColor?: string          // 折线图颜色
  xAxisName?: string          // X 轴名称
  yAxisLeftName?: string      // 左 Y 轴名称（柱状图）
  yAxisRightName?: string     // 右 Y 轴名称（折线图）
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  barName: '总量',
  lineName: '平均',
  barColor: '#5470C6',
  lineColor: '#EE6666',
  height: '400px',
  loading: false
})

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const categories = props.barData.map(item => item.name)
  const barValues = props.barData.map(item => item.value)
  const lineValues = props.lineData.map(item => item.value)

  const xAxisNameGap = 22
  const axisLabelMargin = 8

  const option: EChartsOption = {
    title: props.title ? {
      text: props.title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: (params: any) => {
        if (!Array.isArray(params) || params.length === 0) return ''
        const category = params[0].name
        let result = `<strong>${category}</strong><br/>`
        params.forEach((p: any) => {
          const marker = `<span style="display:inline-block;margin-right:4px;border-radius:10px;width:10px;height:10px;background-color:${p.color};"></span>`
          result += `${marker}${p.seriesName}: ${p.value.toLocaleString()} ㎡<br/>`
        })
        return result
      }
    },
    legend: {
      data: [props.barName, props.lineName],
      top: props.title ? 30 : 10
    },
    grid: {
      left: '10%',
      right: '10%',
      top: props.title ? 80 : 60,
      bottom: '12%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: xAxisNameGap,
      axisPointer: {
        type: 'shadow'
      },
      axisLabel: {
        interval: 0,
        rotate: 0,
        margin: axisLabelMargin
      }
    },
    yAxis: [
      {
        type: 'value',
        name: props.yAxisLeftName,
        position: 'left',
        axisLine: {
          show: true,
          lineStyle: {
            color: props.barColor
          }
        },
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万'
            }
            return value.toString()
          }
        }
      },
      {
        type: 'value',
        name: props.yAxisRightName,
        position: 'right',
        axisLine: {
          show: true,
          lineStyle: {
            color: props.lineColor
          }
        },
        axisLabel: {
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万'
            }
            return value.toString()
          }
        },
        splitLine: {
          show: false  // 右轴不显示网格线，避免与左轴重叠
        }
      }
    ],
    series: [
      {
        name: props.barName,
        type: 'bar',
        yAxisIndex: 0,
        data: barValues,
        itemStyle: {
          color: props.barColor
        },
        label: {
          show: props.barData.length <= 10,
          position: 'top',
          formatter: (params: any) => {
            const val = params.value
            if (val >= 10000) {
              return (val / 10000).toFixed(1) + '万'
            }
            return val
          }
        }
      },
      {
        name: props.lineName,
        type: 'line',
        yAxisIndex: 1,
        data: lineValues,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: props.lineColor
        },
        lineStyle: {
          width: 2
        },
        label: {
          show: props.lineData.length <= 10,
          position: 'top',
          formatter: (params: any) => {
            const val = params.value
            if (val >= 10000) {
              return (val / 10000).toFixed(1) + '万'
            }
            return val
          }
        }
      }
    ]
  }

  return option
})
</script>

<template>
  <BaseChart
    :option="chartOption"
    :height="props.height"
    :loading="props.loading"
  />
</template>
