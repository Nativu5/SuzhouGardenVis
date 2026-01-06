<script setup lang="ts">
/**
 * 直方图组件
 * 用于展示区间分布，支持分层显示
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface SeriesData {
  name: string; // 系列名称（如：开放、不开放）
  data: number[]; // 数据值数组
  color?: string; // 可选的自定义颜色
}

interface Props {
  title?: string;
  intervals: string[]; // 区间标签（如：< 1000, 1000-5000）
  series: SeriesData[]; // 多个系列数据（支持分层）
  xAxisName?: string;
  yAxisName?: string;
  height?: string;
  loading?: boolean;
  showLegend?: boolean;
  stacked?: boolean; // 是否堆叠显示
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  xAxisName: undefined,
  yAxisName: undefined,
  height: '400px',
  loading: false,
  showLegend: true,
  stacked: true,
});

const emit = defineEmits<{
  intervalClick: [params: { interval: string; series: string; value: number }];
}>();

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const option: any = {
    title: props.title
      ? {
          text: props.title,
          left: 'center',
        }
      : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    legend: props.showLegend
      ? {
          data: props.series.map((s) => s.name),
          top: props.title ? 35 : 10,
          type: 'scroll',
        }
      : undefined,
    xAxis: {
      type: 'category',
      data: props.intervals,
      name: props.xAxisName,
      axisLabel: {
        interval: 0,
        rotate: props.intervals.length > 6 ? 30 : 0,
      },
    },
    yAxis: {
      type: 'value',
      name: props.yAxisName,
    },
    series: props.series.map(
      (s) =>
        ({
          name: s.name,
          type: 'bar',
          stack: props.stacked ? 'total' : undefined,
          data: s.data,
          itemStyle: s.color
            ? {
                color: s.color,
              }
            : undefined,
          emphasis: {
            focus: 'series',
          },
          barMaxWidth: 60,
        }) as any,
    ),
  };

  return option;
});

// 处理图表点击事件
const handleChartClick = (params: any) => {
  if (params.componentType === 'series' && params.dataIndex !== undefined) {
    const interval = props.intervals[params.dataIndex];
    if (interval) {
      emit('intervalClick', {
        interval,
        series: params.seriesName,
        value: params.value,
      });
    }
  }
};
</script>

<template>
  <BaseChart
    :option="chartOption"
    :height="props.height"
    :loading="props.loading"
    @chart-click="handleChartClick"
  />
</template>
