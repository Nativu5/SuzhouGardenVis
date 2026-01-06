<script setup lang="ts">
/**
 * 矩阵热力图组件
 * 用于展示二维分类数据的热力分布
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface MatrixData {
  xCategory: string;
  yCategory: string;
  value: number;
  percentage?: string; // 可选的占比文本
}

interface Props {
  title?: string;
  data: MatrixData[];
  xCategories: string[];
  yCategories: string[];
  xAxisName?: string;
  yAxisName?: string;
  height?: string;
  loading?: boolean;
  showLabel?: boolean; // 是否在单元格内显示数值
  tooltipFormatter?: (params: any) => string; // 自定义tooltip格式化函数
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px',
  loading: false,
  showLabel: true,
});

const emit = defineEmits<{
  cellClick: [data: MatrixData];
}>();

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  // 转换数据为ECharts热力图所需格式 [xIndex, yIndex, value]
  const seriesData = props.data.map((item) => {
    const xIndex = props.xCategories.indexOf(item.xCategory);
    const yIndex = props.yCategories.indexOf(item.yCategory);
    return {
      value: [xIndex, yIndex, item.value],
      rawData: item,
    };
  });

  // 计算最大值，用于颜色映射
  const maxValue = Math.max(...props.data.map((d) => d.value), 1);

  const option: EChartsOption = {
    title: props.title
      ? {
          text: props.title,
          left: 'center',
        }
      : undefined,
    tooltip: {
      position: 'top',
      formatter:
        props.tooltipFormatter ||
        ((params: any) => {
          const rawData = params.data.rawData as MatrixData;
          let html = `
          <div style="padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 4px;">
              ${rawData.xCategory} × ${rawData.yCategory}
            </div>
            <div>数量: ${rawData.value}</div>
        `;
          if (rawData.percentage) {
            html += `<div>占比: ${rawData.percentage}</div>`;
          }
          html += `</div>`;
          return html;
        }),
    },
    grid: {
      left: '15%',
      right: '10%',
      top: props.title ? 80 : 60,
      bottom: 80,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: props.xCategories,
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: 35,
      splitArea: {
        show: true,
      },
      axisLabel: {
        interval: 0,
        rotate: props.xCategories.length > 8 ? 45 : 0,
        margin: 12,
      },
    },
    yAxis: {
      type: 'category',
      data: props.yCategories,
      name: props.yAxisName,
      nameLocation: 'middle',
      nameGap: 60,
      splitArea: {
        show: true,
      },
      axisLabel: {
        interval: 0,
      },
    },
    visualMap: {
      min: 0,
      max: maxValue,
      calculable: true,
      orient: 'vertical',
      right: 12,
      top: 'middle',
      itemWidth: 12,
      itemHeight: 120,
      inRange: {
        color: ['#E0F0E3', '#91CC75', '#5AA65F', '#3D8B40', '#2A6B2D'],
      },
      text: ['高', '低'],
      textStyle: {
        color: '#6B7280',
      },
    },
    series: [
      {
        type: 'heatmap',
        data: seriesData,
        label: {
          show: props.showLabel && props.data.length <= 100,
          formatter: (params: any) => {
            return params.data.rawData.value;
          },
        },
        emphasis: {
          itemStyle: {
            borderColor: '#111827',
            borderWidth: 2,
          },
        },
      },
    ],
  };

  return option;
});

// 处理图表点击事件
const handleChartClick = (params: any) => {
  if (params.componentType === 'series' && params.data?.rawData) {
    emit('cellClick', params.data.rawData);
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
