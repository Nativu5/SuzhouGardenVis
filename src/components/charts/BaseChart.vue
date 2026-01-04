<script setup lang="ts">
/**
 * ECharts 基础容器组件
 * 提供统一的图表初始化、响应式、主题和销毁逻辑
 */

import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import echarts from '@/config/echarts'
import type { EChartsOption } from '@/config/echarts'
import { ECHARTS_THEME } from '@/config/theme'

interface Props {
  option: EChartsOption
  height?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false
})

const emit = defineEmits<{
  chartClick: [params: any]
}>()

const chartRef = ref<HTMLDivElement>()
let chartInstance: echarts.ECharts | null = null

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return

  // 如果已存在实例，先销毁
  if (chartInstance) {
    chartInstance.dispose()
  }

  // 创建新实例
  chartInstance = echarts.init(chartRef.value)

  // 应用主题配置
  const mergedOption = {
    ...ECHARTS_THEME,
    ...props.option
  }

  chartInstance.setOption(mergedOption)

  // 绑定点击事件
  chartInstance.on('click', (params) => {
    emit('chartClick', params)
  })
}

// 更新图表配置
const updateChart = () => {
  if (!chartInstance) return

  const mergedOption = {
    ...ECHARTS_THEME,
    ...props.option
  }

  chartInstance.setOption(mergedOption, { notMerge: true })
}

// 窗口大小改变时重新渲染
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 监听配置变化
watch(
  () => props.option,
  () => {
    nextTick(() => {
      updateChart()
    })
  },
  { deep: true }
)

// 监听加载状态
watch(
  () => props.loading,
  (loading) => {
    if (!chartInstance) return
    if (loading) {
      chartInstance.showLoading()
    } else {
      chartInstance.hideLoading()
    }
  }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)

  if (props.loading) {
    chartInstance?.showLoading()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<template>
  <div class="base-chart">
    <div ref="chartRef" :style="{ height: props.height, width: '100%' }"></div>
  </div>
</template>

<style scoped>
.base-chart {
  width: 100%;
}
</style>
