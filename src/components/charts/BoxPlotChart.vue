<script setup lang="ts">
/**
 * 箱线图组件
 * 用于展示数据分布和离散程度
 */

import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from '@/config/echarts'

interface BoxPlotRawData {
  category: string
  values: number[]
}

interface Props {
  title?: string
  data: BoxPlotRawData[]
  xAxisName?: string
  yAxisName?: string
  height?: string
  loading?: boolean
  yAxisType?: 'value' | 'log'  // Y轴类型：数值或对数
  tooltipFormatter?: (params: any) => string  // 自定义tooltip格式化函数
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
  yAxisType: 'value'
})

// 计算箱线图统计数据
const processedData = computed(() => {
  const categories = props.data.map(d => d.category)

  // 计算每个类别的箱线图统计值
  const boxData = props.data.map(item => {
    const values = item.values.filter(v => !isNaN(v) && v !== null && v !== undefined).sort((a, b) => a - b)

    if (values.length === 0) {
      return [0, 0, 0, 0, 0]
    }

    const min = values[0]
    const max = values[values.length - 1]
    const q1Index = Math.floor(values.length * 0.25)
    const q2Index = Math.floor(values.length * 0.5)
    const q3Index = Math.floor(values.length * 0.75)

    const q1 = values[q1Index] || min
    const median = values[q2Index] || min
    const q3 = values[q3Index] || max

    return [min, q1, median, q3, max]
  })

  // 准备离群点数据
  const outliers = props.data.flatMap((item, catIndex) => {
    const values = item.values.filter(v => !isNaN(v) && v !== null && v !== undefined).sort((a, b) => a - b)

    if (values.length === 0) return []

    const q1Index = Math.floor(values.length * 0.25)
    const q3Index = Math.floor(values.length * 0.75)
    const q1 = values[q1Index] ?? values[0] ?? 0
    const q3 = values[q3Index] ?? values[values.length - 1] ?? 0
    const iqr = q3 - q1
    const lowerBound = q1 - 1.5 * iqr
    const upperBound = q3 + 1.5 * iqr

    return values
      .filter(v => v < lowerBound || v > upperBound)
      .map(v => [catIndex, v])
  })

  return {
    categories,
    boxData,
    outliers
  }
})

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const option: EChartsOption = {
    title: props.title ? {
      text: props.title,
      left: 'center'
    } : undefined,
    tooltip: {
      trigger: 'item',
      formatter: props.tooltipFormatter || ((params: any) => {
        if (params.componentSubType === 'boxplot') {
          const data = params.data as number[]
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${params.name}</div>
              <div>最大值: ${(data[4] ?? 0).toLocaleString()}</div>
              <div>上四分位: ${(data[3] ?? 0).toLocaleString()}</div>
              <div>中位数: ${(data[2] ?? 0).toLocaleString()}</div>
              <div>下四分位: ${(data[1] ?? 0).toLocaleString()}</div>
              <div>最小值: ${(data[0] ?? 0).toLocaleString()}</div>
            </div>
          `
        } else if (params.componentSubType === 'scatter') {
          return `
            <div style="padding: 4px;">
              <div style="font-weight: 600; margin-bottom: 4px;">离群点</div>
              <div>值: ${params.data[1].toLocaleString()}</div>
            </div>
          `
        }
        return ''
      })
    },
    grid: {
      left: '10%',
      right: '10%',
      top: props.title ? 80 : 60,
      bottom: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: processedData.value.categories,
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: 35,
      boundaryGap: true,
      axisLabel: {
        interval: 0,
        rotate: processedData.value.categories.length > 6 ? 45 : 0
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: props.yAxisType === 'log' ? 'log' : 'value',
      name: props.yAxisName,
      nameLocation: 'middle',
      nameGap: 60,
      logBase: props.yAxisType === 'log' ? 10 : undefined,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#E5E7EB'
        }
      }
    },
    series: [
      {
        type: 'boxplot',
        data: processedData.value.boxData as any,
        itemStyle: {
          color: '#91CC75',
          borderColor: '#5AA65F'
        },
        emphasis: {
          itemStyle: {
            borderColor: '#111827',
            borderWidth: 2
          }
        }
      },
      {
        type: 'scatter',
        data: processedData.value.outliers as any,
        itemStyle: {
          color: '#EE6666',
          opacity: 0.6
        },
        symbolSize: 6
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
