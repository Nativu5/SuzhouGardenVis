<script setup lang="ts">
/**
 * Treemap 图组件
 * 用于展示层级结构与面积占比
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';

interface TreemapMeta {
  nodeType?: 'era' | 'garden' | 'others';
  era?: string;
  district?: string;
  count?: number;
  percentage?: string;
}

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  itemStyle?: { color?: string };
  meta?: TreemapMeta;
}

interface Props {
  title?: string;
  data: TreemapNode[];
  height?: string;
  loading?: boolean;
  colorPalette?: string[];
  tooltipFormatter?: (params: any) => string;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  height: '400px',
  loading: false,
  colorPalette: () => [],
  tooltipFormatter: undefined,
});

const formatArea = (value: number) => `${Math.round(value).toLocaleString()} ㎡`;

const formatUpperLabel = (params: any) => {
  const meta: TreemapMeta = params?.data?.meta || {};
  if (meta.nodeType !== 'era') {
    return params.name || '';
  }
  if (meta.percentage) {
    return `${params.name} (${meta.percentage})`;
  }
  return params.name || '';
};

const defaultTooltipFormatter = (params: any) => {
  const data = params?.data || {};
  const meta: TreemapMeta = data.meta || {};
  const areaText = formatArea(typeof data.value === 'number' ? data.value : 0);

  if (meta.nodeType === 'era') {
    return `
      <div style="padding: 4px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
        <div>总面积: ${areaText}</div>
        <div>园林数量: ${meta.count ?? 0}</div>
        ${meta.percentage ? `<div>占总面积: ${meta.percentage}</div>` : ''}
      </div>
    `;
  }

  if (meta.nodeType === 'garden') {
    return `
      <div style="padding: 4px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
        <div>朝代: ${meta.era || '未知'}</div>
        ${meta.district ? `<div>区县: ${meta.district}</div>` : ''}
        <div>面积: ${areaText}</div>
        ${meta.percentage ? `<div>占该朝代: ${meta.percentage}</div>` : ''}
      </div>
    `;
  }

  if (meta.nodeType === 'others') {
    return `
      <div style="padding: 4px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
        <div>朝代: ${meta.era || '未知'}</div>
        <div>其他园林: ${meta.count ?? 0} 座</div>
        <div>面积合计: ${areaText}</div>
        ${meta.percentage ? `<div>占该朝代: ${meta.percentage}</div>` : ''}
      </div>
    `;
  }

  return `
    <div style="padding: 4px;">
      <div style="font-weight: 600; margin-bottom: 4px;">${data.name || ''}</div>
      <div>面积: ${areaText}</div>
    </div>
  `;
};

const chartOption = computed<EChartsOption>(() => {
  if (!props.data || props.data.length === 0) {
    return {
      title: props.title
        ? {
            text: props.title,
            left: 'center',
            top: 10,
            textStyle: { fontSize: 16, fontWeight: 'bold' },
          }
        : undefined,
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: '暂无数据', fontSize: 14, fill: '#999' },
      },
    };
  }

  const topOffset = props.title ? 70 : 20;

  return {
    title: props.title
      ? {
          text: props.title,
          left: 'center',
          top: 10,
        }
      : undefined,
    tooltip: {
      formatter: props.tooltipFormatter || defaultTooltipFormatter,
    },
    series: [
      {
        type: 'treemap',
        data: props.data,
        top: topOffset,
        left: 12,
        right: 12,
        bottom: 12,
        leafDepth: 2,
        roam: false,
        nodeClick: false,
        breadcrumb: {
          show: false,
        },
        label: {
          show: true,
          formatter: (params: any) => {
            const meta: TreemapMeta | undefined = params.data?.meta;
            if (!meta || meta.nodeType === 'era') return '';
            return params.name;
          },
          fontSize: 11,
          color: '#111827',
          overflow: 'truncate',
        },
        itemStyle: {
          borderColor: '#FFFFFF',
          borderWidth: 1,
          gapWidth: 2,
        },
        levels: [
          {
            itemStyle: {
              borderWidth: 0,
              gapWidth: 0,
            },
          },
          {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#E5E7EB',
              gapWidth: 8,
            },
            upperLabel: {
              show: true,
              height: 24,
              color: '#111827',
              fontSize: 12,
              fontWeight: 600,
              formatter: formatUpperLabel,
            },
          },
          {
            colorSaturation: [0.35, 0.7],
            itemStyle: {
              borderWidth: 1,
              gapWidth: 2,
            },
          },
        ],
        color: props.colorPalette.length > 0 ? props.colorPalette : undefined,
      } as any,
    ],
  };
});
</script>

<template>
  <BaseChart :option="chartOption" :height="props.height" :loading="props.loading" />
</template>
