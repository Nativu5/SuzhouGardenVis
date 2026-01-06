<script setup lang="ts">
/**
 * 分层柱状图组件
 * 用于展示多系列堆叠的柱状图
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface SeriesData {
  name: string; // 系列名称（如：国家级、省级等）
  data: number[]; // 数据值数组
  color?: string; // 可选的自定义颜色
}

interface Props {
  title?: string;
  categories: string[]; // X轴分类（如：各区县名称）
  series: SeriesData[]; // 多个系列数据
  xAxisName?: string;
  yAxisName?: string;
  height?: string;
  loading?: boolean;
  horizontal?: boolean; // 是否水平显示
  showLegend?: boolean; // 是否显示图例
  tooltipFormatter?: (params: any) => string; // 自定义tooltip格式化函数
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
  horizontal: false,
  showLegend: true,
});

const emit = defineEmits<{
  barClick: [params: { category: string; series: string; value: number }];
}>();

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  // 不旋转 X 轴标签；不新增 grid（避免下方留白过多）
  const xAxisNameGap = 22;
  const axisLabelMargin = 8;

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
      formatter: props.tooltipFormatter,
    },
    legend: props.showLegend
      ? {
          data: props.series.map((s) => s.name),
          top: props.title ? 35 : 10,
          type: 'scroll',
        }
      : undefined,
    // 与 ScatterChart 的左右留白对齐
    grid: {
      left: '10%',
      right: '10%',
      top: props.title ? (props.showLegend ? 85 : 60) : props.showLegend ? 60 : 40,
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
          nameLocation: 'middle',
          nameGap: xAxisNameGap,
          data: props.categories,
          name: props.xAxisName,
          axisLabel: {
            interval: 0,
            rotate: 0,
            margin: axisLabelMargin,
          },
        },
    yAxis: props.horizontal
      ? {
          type: 'category',
          data: props.categories,
          name: props.yAxisName,
        }
      : {
          type: 'value',
          name: props.yAxisName,
        },
    series: props.series.map(
      (s) =>
        ({
          name: s.name,
          type: 'bar',
          stack: 'total',
          data: s.data,
          itemStyle: s.color
            ? {
                color: s.color,
              }
            : undefined,
          emphasis: {
            focus: 'series',
          },
          label: {
            show: false,
          },
        }) as any,
    ),
  };

  return option;
});

// 处理图表点击事件
const handleChartClick = (params: any) => {
  if (params.componentType === 'series' && params.dataIndex !== undefined) {
    const category = props.categories[params.dataIndex];
    if (category) {
      emit('barClick', {
        category,
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
