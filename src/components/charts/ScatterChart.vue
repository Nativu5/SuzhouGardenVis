<script setup lang="ts">
/**
 * 散点/气泡图组件
 * 支持气泡大小、颜色编码、对数坐标轴
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface ScatterData {
  name: string;
  x: number;
  y: number | string; // 支持数值或类别（用于类别Y轴）
  size?: number; // 气泡大小
  color?: string; // 气泡颜色
  category?: string; // 分类（用于图例）
  [key: string]: any; // 其他自定义数据
}

interface Props {
  title?: string;
  data: ScatterData[];
  xAxisName?: string;
  yAxisName?: string;
  xAxisType?: 'value' | 'log'; // X轴类型：数值或对数
  yAxisType?: 'value' | 'log' | 'category'; // Y轴类型
  yCategories?: string[]; // Y轴为类别时的类别列表
  height?: string;
  loading?: boolean;
  sizeRange?: [number, number]; // 气泡大小范围
  showLegend?: boolean; // 是否显示图例
  tooltipFormatter?: (params: any) => string; // 自定义tooltip格式化函数
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  xAxisName: undefined,
  yAxisName: undefined,
  yCategories: undefined,
  tooltipFormatter: undefined,
  height: '400px',
  loading: false,
  xAxisType: 'value',
  yAxisType: 'value',
  sizeRange: () => [10, 60] as [number, number],
  showLegend: true,
});

const emit = defineEmits<{
  pointClick: [data: ScatterData];
}>();

// 按类别分组数据
const groupedData = computed(() => {
  if (!props.data.some((d) => d.category)) {
    return [{ name: '数据', data: props.data }];
  }

  const groups = new Map<string, ScatterData[]>();
  props.data.forEach((item) => {
    const category = item.category || '其他';
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(item);
  });

  return Array.from(groups.entries()).map(([name, data]) => ({ name, data }));
});

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const series = groupedData.value.map((group) => {
    const seriesData = group.data.map((item) => {
      let yValue: number | string = item.y;
      // 如果Y轴是类别类型，转换为索引
      if (props.yAxisType === 'category' && props.yCategories && typeof item.y === 'string') {
        yValue = props.yCategories.indexOf(item.y as string);
      }

      return {
        value: [item.x, yValue, item.size || 10],
        itemStyle: item.color ? { color: item.color } : undefined,
        rawData: item,
      };
    });

    return {
      type: 'scatter',
      name: group.name,
      data: seriesData,
      symbolSize: (data: any) => {
        if (!props.sizeRange) return 10;
        const size = data[2] || 10;
        // 归一化大小
        const maxSize = Math.max(...props.data.map((d) => d.size || 10));
        const minSize = Math.min(...props.data.map((d) => d.size || 10));
        const normalizedSize = maxSize > minSize ? (size - minSize) / (maxSize - minSize) : 0.5;
        return props.sizeRange[0] + normalizedSize * (props.sizeRange[1] - props.sizeRange[0]);
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderColor: '#111827',
          borderWidth: 2,
        },
      },
    };
  });

  const option: EChartsOption = {
    title: props.title
      ? {
        text: props.title,
        left: 'center',
      }
      : undefined,
    tooltip: {
      trigger: 'item',
      formatter:
        props.tooltipFormatter ||
        ((params: any) => {
          const rawData = params.data.rawData as ScatterData;
          let html = `
          <div style="padding: 4px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${rawData.name}</div>
            <div>${props.xAxisName || 'X'}: ${rawData.x}</div>
            <div>${props.yAxisName || 'Y'}: ${rawData.y}</div>
        `;
          if (rawData.size !== undefined) {
            html += `<div>大小: ${rawData.size}</div>`;
          }
          if (rawData.category) {
            html += `<div>类别: ${rawData.category}</div>`;
          }
          html += `</div>`;
          return html;
        }),
    },
    legend:
      props.showLegend && groupedData.value.length > 1
        ? {
          data: groupedData.value.map((g) => g.name),
          top: props.title ? 40 : 10,
          left: 'center',
        }
        : undefined,
    grid: {
      left: '10%',
      right: '10%',
      top: props.title
        ? props.showLegend && groupedData.value.length > 1
          ? 100
          : 60
        : props.showLegend && groupedData.value.length > 1
          ? 60
          : 40,
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: props.xAxisType === 'log' ? 'log' : 'value',
      name: props.xAxisName,
      nameLocation: 'middle',
      nameGap: 35,
      logBase: props.xAxisType === 'log' ? 10 : undefined,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
          color: '#E5E7EB',
        },
      },
    },
    yAxis:
      props.yAxisType === 'category'
        ? {
          type: 'category',
          data: props.yCategories || [],
          name: props.yAxisName,
          nameLocation: 'middle',
          nameGap: 60,
          axisLabel: {
            interval: 0,
          },
        }
        : {
          type: props.yAxisType === 'log' ? 'log' : 'value',
          name: props.yAxisName,
          nameLocation: 'middle',
          nameGap: 50,
          logBase: props.yAxisType === 'log' ? 10 : undefined,
          splitLine: {
            show: true,
            lineStyle: {
              type: 'dashed',
              color: '#E5E7EB',
            },
          },
        },
    series: series as any,
  };

  return option;
});

// 处理图表点击事件
const handleChartClick = (params: any) => {
  if (params.componentType === 'series' && params.data?.rawData) {
    emit('pointClick', params.data.rawData);
  }
};
</script>

<template>
  <BaseChart :option="chartOption" :height="props.height" :loading="props.loading" @chart-click="handleChartClick" />
</template>
