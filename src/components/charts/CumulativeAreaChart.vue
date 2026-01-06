<script setup lang="ts">
/**
 * 累积面积图组件
 * 用于展示园林面积的累积分布，直观体现长尾分布特征
 * 支持按开放情况分组显示多条累积曲线
 * 横轴：单个园林面积（㎡），超过阈值的部分会被压缩显示
 * 纵轴：累积面积占比（%）
 */

import { computed } from 'vue';
import BaseChart from './BaseChart.vue';
import type { EChartsOption } from '@/config/echarts';
import { getOpenStatusColor } from '@/config/theme';

interface CumulativeSeriesData {
  name: string; // 系列名称，如 "全部"、"开放"、"不开放"
  color?: string;
  data: {
    gardenName: string;
    area: number;
    cumulativePercent: number; // 累积面积占全部园林总面积的百分比
  }[];
}

interface Props {
  title?: string;
  seriesData: CumulativeSeriesData[];
  height?: string;
  /** 断轴阈值，超过此值的面积会被压缩显示 */
  breakAxisThreshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: '400px',
  breakAxisThreshold: 53000,
});

// 断轴配置
const BREAK_ZONE_WIDTH = 5000; // 断轴区域宽度（用于显示压缩后的大面积数据）

/**
 * 将真实面积值映射到显示坐标
 * 0 ~ threshold: 线性映射
 * threshold ~ ∞: 压缩映射到 threshold ~ threshold + BREAK_ZONE_WIDTH
 */
const mapAreaToDisplay = (area: number, threshold: number): number => {
  if (area <= threshold) {
    return area;
  }
  // 超过阈值的部分，使用对数压缩映射到断轴区域
  // 压缩公式：threshold + BREAK_ZONE_WIDTH * (1 - 1 / (1 + log10(area / threshold)))
  const ratio = area / threshold;
  const compressed = BREAK_ZONE_WIDTH * (1 - 1 / (1 + Math.log10(ratio)));
  return threshold + compressed;
};

/**
 * 将显示坐标还原为真实面积值（用于 tooltip 和轴标签）
 */
const mapDisplayToArea = (displayValue: number, threshold: number): number => {
  if (displayValue <= threshold) {
    return displayValue;
  }
  // 反向计算
  const compressed = displayValue - threshold;
  const factor = compressed / BREAK_ZONE_WIDTH;
  // 1 - 1/(1 + log10(ratio)) = factor => 1/(1 + log10(ratio)) = 1 - factor => 1 + log10(ratio) = 1/(1-factor)
  // log10(ratio) = 1/(1-factor) - 1 => ratio = 10^(1/(1-factor) - 1)
  if (factor >= 1) {
    return threshold * 1000; // 防止除零，返回一个大值
  }
  const ratio = Math.pow(10, 1 / (1 - factor) - 1);
  return threshold * ratio;
};

const chartOption = computed<EChartsOption>(() => {
  if (props.seriesData.length === 0 || props.seriesData.every((s) => s.data.length === 0)) {
    return {
      title: {
        text: props.title,
        left: 'center',
        top: 10,
        textStyle: { fontSize: 16, fontWeight: 'bold' },
      },
      graphic: {
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: '暂无数据', fontSize: 14, fill: '#999' },
      },
    };
  }

  const threshold = props.breakAxisThreshold;
  const xAxisMax = threshold + BREAK_ZONE_WIDTH;

  // 构建 series 数组，将面积值映射到显示坐标
  const seriesList: any[] = props.seriesData.map((series) => {
    const color = series.color || getOpenStatusColor(series.name) || '#5470C6';

    return {
      name: series.name,
      type: 'line',
      data: series.data.map((item) => ({
        value: [mapAreaToDisplay(item.area, threshold), item.cumulativePercent],
        realArea: item.area, // 保存真实面积用于 tooltip
        gardenName: item.gardenName,
      })),
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: series.name === '全部' ? 3 : 2,
        color: color,
      },
      areaStyle:
        series.name === '全部'
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                  { offset: 1, color: 'rgba(84, 112, 198, 0.05)' },
                ],
              },
            }
          : undefined,
    };
  });

  // 断轴标记图形
  const breakAxisGraphic = {
    type: 'group',
    left: `${((threshold / xAxisMax) * 100).toFixed(1)}%`,
    bottom: 60,
    children: [
      {
        type: 'text',
        style: {
          text: '///',
          fontSize: 14,
          fill: '#999',
          fontWeight: 'bold',
        },
        z: 100,
      },
    ],
  };

  return {
    title: {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: { fontSize: 16, fontWeight: 'bold' },
    },
    legend: {
      top: 35,
      data: props.seriesData.map((s) => s.name),
    },
    graphic: [breakAxisGraphic],
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return '';

        let html = '';
        params.forEach((param: any) => {
          const seriesName = param.seriesName;
          const realArea = param.data.realArea || param.data.value[0];
          const areaPercent = param.data.value[1];
          html += `
                        <div style="margin-bottom: 4px;">
                            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${param.color};margin-right:5px;"></span>
                            <strong>${seriesName}</strong>
                        </div>
                        <div>园林面积：${Math.round(realArea).toLocaleString()} ㎡</div>
                        <div>累积面积占比：${areaPercent.toFixed(1)}%</div>
                    `;
        });
        return html;
      },
    },
    grid: {
      left: 60,
      right: 40,
      top: 80,
      bottom: 60,
    },
    xAxis: {
      type: 'value',
      name: '单园林面积 (㎡)',
      nameLocation: 'middle',
      nameGap: 35,
      nameTextStyle: { fontSize: 12, color: '#666' },
      min: 0,
      max: xAxisMax,
      axisLabel: {
        formatter: (value: number) => {
          if (value <= threshold) {
            return value >= 1000 ? `${value / 1000}k` : String(value);
          } else {
            // 断轴区域的标签：显示真实值
            const realValue = mapDisplayToArea(value, threshold);
            if (realValue >= 10000) {
              return `${Math.round(realValue / 1000)}k`;
            }
            return `${Math.round(realValue / 1000)}k`;
          }
        },
        fontSize: 11,
      },
      // 自定义刻度位置
      splitNumber: 8,
    },
    yAxis: {
      type: 'value',
      name: '累积面积占比 (%)',
      nameLocation: 'middle',
      nameGap: 45,
      nameTextStyle: { fontSize: 12, color: '#666' },
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
        fontSize: 11,
      },
    },
    series: seriesList,
  };
});
</script>

<template>
  <BaseChart :option="chartOption" :height="height" />
</template>
