<script setup lang="ts">
/**
 * 柱状图组件
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface ChartData {
  name: string;
  value: number;
}

interface Props {
  title?: string;
  data: ChartData[];
  colors?: string[];
  xAxisName?: string;
  yAxisName?: string;
  height?: string;
  loading?: boolean;
  horizontal?: boolean; // 是否水平显示（横向柱状图）
  tooltipFormatter?: (params: any) => string; // 自定义tooltip格式化函数
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
  horizontal: false,
});

const emit = defineEmits<{
  barClick: [data: ChartData];
}>();

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const categories = props.data.map((item) => item.name);
  const values = props.data.map((item) => item.value);

  // 不旋转 X 轴标签；不新增 grid（避免下方留白过多）
  const xAxisNameGap = 22;
  const axisLabelMargin = 8;

  const option: EChartsOption = {
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
      formatter: props.tooltipFormatter,
    },
    // 与 ScatterChart 的左右留白对齐
    grid: {
      left: '10%',
      right: '10%',
      top: props.title ? 60 : 40,
      bottom: '10%',
      containLabel: true,
    },
    xAxis: props.horizontal
      ? {
          type: 'value',
          name: props.xAxisName,
          nameLocation: 'middle',
          nameGap: xAxisNameGap,
        }
      : {
          type: 'category',
          data: categories,
          name: props.xAxisName,
          nameLocation: 'middle',
          nameGap: xAxisNameGap,
          axisLabel: {
            interval: 0,
            rotate: 0,
            margin: axisLabelMargin,
          },
        },
    yAxis: props.horizontal
      ? {
          type: 'category',
          data: categories,
          name: props.yAxisName,
          axisLabel: {
            interval: 0,
          },
        }
      : {
          type: 'value',
          name: props.yAxisName,
        },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: props.colors
          ? ({
              color: (params: any) => {
                const index = params.dataIndex;
                if (props.colors && index !== undefined && index < props.colors.length) {
                  return props.colors[index];
                }
                return '#5470C6';
              },
            } as any)
          : undefined,
        label: {
          show: props.data.length <= 15,
          position: props.horizontal ? 'right' : 'top',
          formatter: '{c}',
        },
      },
    ],
  };

  return option;
});

// 处理图表点击事件
const handleChartClick = (params: any) => {
  if (params.componentType === 'series' && params.dataIndex !== undefined) {
    const clickedData = props.data[params.dataIndex];
    if (clickedData) {
      emit('barClick', clickedData);
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
