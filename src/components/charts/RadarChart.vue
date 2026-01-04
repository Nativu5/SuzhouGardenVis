<!--
  雷达图组件
  用于展示区县的多维度统计数据
-->
<script setup lang="ts">
import { computed } from 'vue'
import BaseChart from './BaseChart.vue'
import type { EChartsOption } from '@/config/echarts'
import type { DistrictStatistics } from '@/types'

interface Props {
  data: DistrictStatistics
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '300px'
})

/**
 * 计算可访问指数
 * 基于人均开放园林数，归一化到 0-100 范围
 * 算法：openGardenPerCapita * 100（假设最佳值为1个/万人）
 */
const accessibilityIndex = computed(() => {
  const index = props.data.openGardenPerCapita * 100
  // 限制在 0-100 范围内
  return Math.min(Math.max(index, 0), 100)
})

/**
 * 归一化数据到 0-100 范围
 * 用于在雷达图中统一展示
 */
const normalizedData = computed(() => {
  // 人口归一化（假设最大人口为 250 万人）
  const normalizedPopulation = Math.min((props.data.population / 250) * 100, 100)

  // 面积归一化（假设最大面积为 2500 平方公里）
  const normalizedArea = Math.min((props.data.area / 2500) * 100, 100)

  // 园林数量归一化（假设最大数量为 50 个）
  const normalizedGardenCount = Math.min((props.data.gardenCount / 50) * 100, 100)

  // 开放率已经是百分比
  const normalizedOpenRate = props.data.openRate

  // 可访问指数已经归一化
  const normalizedAccessibility = accessibilityIndex.value

  return {
    population: normalizedPopulation,
    area: normalizedArea,
    gardenCount: normalizedGardenCount,
    openRate: normalizedOpenRate,
    accessibility: normalizedAccessibility
  }
})

/**
 * 雷达图配置
 */
const chartOption = computed<EChartsOption>(() => ({
  radar: {
    indicator: [
      { name: '人口', max: 100 },
      { name: '面积', max: 100 },
      { name: '园林数量', max: 100 },
      { name: '开放率', max: 100 },
      { name: '可访问性', max: 100 }
    ],
    shape: 'polygon',
    splitNumber: 4,
    axisName: {
      color: '#374151',
      fontSize: 12,
      fontWeight: 500
    },
    splitLine: {
      lineStyle: {
        color: '#E5E7EB'
      }
    },
    splitArea: {
      areaStyle: {
        color: ['#FAFAFA', '#FFFFFF']
      }
    },
    axisLine: {
      lineStyle: {
        color: '#D1D5DB'
      }
    }
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [
            normalizedData.value.population,
            normalizedData.value.area,
            normalizedData.value.gardenCount,
            normalizedData.value.openRate,
            normalizedData.value.accessibility
          ],
          name: props.data.name,
          areaStyle: {
            color: 'rgba(84, 112, 198, 0.2)'
          },
          lineStyle: {
            color: '#5470C6',
            width: 2
          },
          itemStyle: {
            color: '#5470C6'
          }
        }
      ]
    }
  ],
  tooltip: {
    trigger: 'item',
    formatter: () => {
      return `
        <div style="padding: 4px;">
          <div style="font-weight: 600; margin-bottom: 8px;">${props.data.name}</div>
          <div style="margin-bottom: 4px;">人口: ${props.data.population.toFixed(2)} 万人</div>
          <div style="margin-bottom: 4px;">面积: ${props.data.area.toFixed(2)} km²</div>
          <div style="margin-bottom: 4px;">园林数量: ${props.data.gardenCount} 个</div>
          <div style="margin-bottom: 4px;">开放率: ${props.data.openRate.toFixed(1)}%</div>
          <div style="margin-bottom: 4px;">人均开放园林: ${props.data.openGardenPerCapita.toFixed(2)} 个/万人</div>
          <div>可访问指数: ${accessibilityIndex.value.toFixed(1)}</div>
        </div>
      `
    }
  }
}))
</script>

<template>
  <BaseChart :option="chartOption" :height="height" />
</template>
