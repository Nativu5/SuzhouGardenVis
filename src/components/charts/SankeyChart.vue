<script setup lang="ts">
/**
 * 桑基图组件
 * 用于展示流向关系
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: string; // 源节点名称
  target: string; // 目标节点名称
  value: number; // 流量值
}

interface Props {
  title?: string;
  nodes: SankeyNode[];
  links: SankeyLink[];
  height?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  height: '500px',
  loading: false,
});

const emit = defineEmits<{
  linkClick: [link: SankeyLink];
  nodeClick: [node: SankeyNode];
}>();

// 生成 ECharts 配置
const chartOption = computed<EChartsOption>(() => {
  const option: EChartsOption = {
    title: props.title
      ? {
          text: props.title,
          left: 'center',
        }
      : undefined,
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}<br/>数量: ${params.data.value}`;
        } else {
          return `${params.name}<br/>总计: ${params.value}`;
        }
      },
    },
    series: [
      {
        type: 'sankey',
        data: props.nodes,
        links: props.links,
        emphasis: {
          focus: 'adjacency',
        },
        lineStyle: {
          color: 'gradient',
          curveness: 0.5,
        },
        label: {
          fontSize: 11,
          color: '#374151',
        },
        left: 50,
        right: 150,
        top: props.title ? 60 : 30,
        bottom: 30,
      },
    ],
  };

  return option;
});

// 处理图表点击事件
const handleChartClick = (params: any) => {
  if (params.dataType === 'edge') {
    emit('linkClick', params.data as SankeyLink);
  } else if (params.dataType === 'node') {
    emit('nodeClick', params.data as SankeyNode);
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
