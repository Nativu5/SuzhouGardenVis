<script setup lang="ts">
/**
 * 叙事场景3：开放可达与权属/用途
 * 解释开放性差异的结构性因素，识别权属与用途对可达性的影响
 */

import { computed } from 'vue';
import { useGardenStore } from '@/stores/gardenStore';
import StackedBarChart from '@/components/charts/StackedBarChart.vue';
import SankeyChart from '@/components/charts/SankeyChart.vue';
import ScatterChart from '@/components/charts/ScatterChart.vue';
import MetricCard from './MetricCard.vue';
import {
  groupByOwnershipAndOpenStatus,
  groupByCurrentUseAndOpenStatus,
  groupByDistrictAndOpenStatus,
} from '@/utils/chartDataProcessor';
import { getOpenStatusColor, getDistrictColor } from '@/config/theme';

const store = useGardenStore();

// 使用过滤后的数据
const data = computed(() => store.filteredData);

// 未开放园林列表
const closedGardens = computed(() => {
  return data.value
    .filter((item) => item.openStatus === '不开放')
    .sort((a, b) => a.district.localeCompare(b.district));
});

// 权属性质→开放情况桑基图数据
const ownershipOpenSankeyData = computed(() => {
  return groupByOwnershipAndOpenStatus(data.value);
});

// 当前用途×开放情况分层统计
const useOpenData = computed(() => {
  const result = groupByCurrentUseAndOpenStatus(data.value);
  return {
    categories: result.categories,
    series: result.series.map((s) => ({
      ...s,
      color: getOpenStatusColor(s.name),
    })),
  };
});

// 区县×开放情况分层统计
const districtOpenData = computed(() => {
  const result = groupByDistrictAndOpenStatus(data.value);
  return {
    categories: result.categories,
    series: result.series.map((s) => ({
      ...s,
      color: getOpenStatusColor(s.name),
    })),
  };
});

// 区县公平性散点图数据
const districtFairnessScatter = computed(() => {
  const scatterData = store.districtStatistics
    .filter((district) => district.gardenCount > 0)
    .map((district) => {
      return {
        name: district.name,
        x: district.openRate, // 开放率（%）
        y: district.openGardenPerCapita, // 人均开放园林数（个/万人）
        size: district.gardenCount, // 园林总数
        color: getDistrictColor(district.name),
        category: district.name,
      };
    });

  return scatterData;
});

// KPI 指标
const metrics = computed(() => {
  const totalCount = data.value.length;
  const openCount = data.value.filter((item) => item.openStatus === '开放').length;
  const openRate = totalCount > 0 ? ((openCount / totalCount) * 100).toFixed(1) : '0';
  const closedCount = closedGardens.value.length;

  return {
    totalCount,
    openCount,
    openRate: `${openRate}%`,
    closedCount,
  };
});

/**
 * Tooltip formatters
 */

// 判断是否有筛选条件生效
const hasActiveFilters = computed(() => {
  const filters = store.filters;
  return !!(
    filters.searchKeyword ||
    (filters.districts && filters.districts.length > 0) ||
    (filters.openStatus && filters.openStatus.length > 0) ||
    (filters.heritageLevels && filters.heritageLevels.length > 0) ||
    (filters.ownershipTypes && filters.ownershipTypes.length > 0) ||
    (filters.currentUses && filters.currentUses.length > 0) ||
    (filters.isWorldHeritage !== null && filters.isWorldHeritage !== undefined) ||
    (filters.constructionPeriods && filters.constructionPeriods.length > 0) ||
    (filters.eraCategories && filters.eraCategories.length > 0) ||
    (filters.publicationBatches && filters.publicationBatches.length > 0) ||
    (filters.areaRanges && filters.areaRanges.length > 0) ||
    (filters.areaMin !== undefined && filters.areaMin !== null) ||
    (filters.areaMax !== undefined && filters.areaMax !== null)
  );
});

// 区县公平性散点图tooltip
const fairnessScatterTooltipFormatter = (params: any) => {
  if (!params || !params.data?.rawData) return '';
  const item = params.data.rawData;

  const filterHint = hasActiveFilters.value
    ? `（基于筛选的${data.value.length}座园林）`
    : `（基于全部${store.rawData.length}座园林）`;

  return `
    <div style="padding: 8px; min-width: 200px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${item.name}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151;">
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">开放率：</span>
          <span style="font-weight: 600; color: #10B981;">${item.x.toFixed(1)}%</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">人均开放园林：</span>
          <span style="font-weight: 600; color: #5470C6;">${item.y.toFixed(2)} 个/万人</span>
        </div>
        <div style="margin-bottom: 3px;">
          <span style="color: #6B7280;">园林总数：</span>
          <span style="font-weight: 600; color: #FAC858;">${item.size} 座</span>
        </div>
      </div>
      <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #F3F4F6; font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `;
};

// 区县开放情况分层tooltip
const districtOpenTooltipFormatter = (params: any) => {
  if (!params || params.length === 0) return '';

  const districtName = params[0].name;
  let totalCount = 0;
  let openCount = 0;
  let details = '';

  // 汇总该区县的开放情况
  params.forEach((param: any) => {
    const statusName = param.seriesName;
    const count = param.value;
    totalCount += count;

    if (statusName === '开放') {
      openCount = count;
    }

    const color = getOpenStatusColor(statusName);
    details += `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
        <span style="display: flex; align-items: center;">
          <span style="display: inline-block; width: 10px; height: 10px; background-color: ${color}; border-radius: 50%; margin-right: 6px;"></span>
          <span style="color: #6B7280;">${statusName}：</span>
        </span>
        <span style="font-weight: 600; color: #374151; margin-left: 8px;">${count} 座</span>
      </div>
    `;
  });

  const openRate = totalCount > 0 ? ((openCount / totalCount) * 100).toFixed(1) : '0';
  const filterHint = hasActiveFilters.value
    ? `（基于筛选的${data.value.length}座园林）`
    : `（基于全部${store.rawData.length}座园林）`;

  return `
    <div style="padding: 8px; min-width: 200px;">
      <div style="font-weight: 600; font-size: 14px; color: #111827; margin-bottom: 6px; border-bottom: 1px solid #E5E7EB; padding-bottom: 4px;">
        ${districtName}
      </div>
      <div style="font-size: 13px; line-height: 1.6; color: #374151; margin-bottom: 6px;">
        ${details}
      </div>
      <div style="padding: 6px 0; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 13px;">
          <span style="color: #6B7280;">总计：</span>
          <span style="font-weight: 700; color: #111827;">${totalCount} 座</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 2px;">
          <span style="color: #6B7280;">开放率：</span>
          <span style="font-weight: 600; color: ${parseFloat(openRate) >= 50 ? '#10B981' : '#F59E0B'};">${openRate}%</span>
        </div>
      </div>
      <div style="font-size: 11px; color: #9CA3AF;">
        ${filterHint}
      </div>
    </div>
  `;
};
</script>

<template>
  <div class="narrative-scene-3 p-6">
    <!-- 场景标题与核心观点 -->
    <div class="mb-6">
      <h2 class="mb-2 text-2xl font-bold text-gray-900">开放可达与制度结构</h2>
      <div class="mb-4 text-sm text-gray-600">
        <strong>核心观点：</strong
        >开放差异主要由权属与用途结构驱动，并在区县层面表现为人均可达性的显著不均衡。
      </div>

      <!-- 阅读路径提示 -->
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <strong>阅读路径：</strong>
        先看"权属→开放"桑基图与"当前用途×开放"了解结构，再看"区县公平性散点"理解空间不均衡，最后查"未开放园林清单"
      </div>
    </div>

    <!-- 关键结论条 -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <div class="bg-linear-to-r rounded-lg border border-blue-200 from-blue-50 to-blue-100 p-4">
        <div class="mb-1 text-xs font-medium text-blue-600">权属差异</div>
        <div class="text-lg font-bold text-blue-800">国有园林开放率显著高于私有/企业</div>
        <div class="mt-1 text-xs text-blue-600">结构性差异明显</div>
      </div>
      <div class="bg-linear-to-r rounded-lg border border-rose-200 from-rose-50 to-rose-100 p-4">
        <div class="mb-1 text-xs font-medium text-rose-600">用途限制</div>
        <div class="text-lg font-bold text-rose-800">私人用途几乎不开放</div>
        <div class="mt-1 text-xs text-rose-600">公共可达性受用途结构限制</div>
      </div>
      <div
        class="bg-linear-to-r rounded-lg border border-emerald-200 from-emerald-50 to-emerald-100 p-4"
      >
        <div class="mb-1 text-xs font-medium text-emerald-600">空间公平</div>
        <div class="text-lg font-bold text-emerald-800">区县间人均可达性差异显著</div>
        <div class="mt-1 text-xs text-emerald-600">核心区远高于外围区县</div>
      </div>
    </div>

    <!-- KPI 指标卡 -->
    <div class="mb-6 grid grid-cols-4 gap-4">
      <MetricCard title="园林总数" :value="metrics.totalCount" unit="座" />
      <MetricCard title="开放园林" :value="metrics.openCount" unit="座" />
      <MetricCard title="开放率" :value="metrics.openRate" />
      <MetricCard title="未开放园林" :value="metrics.closedCount" unit="座" />
    </div>

    <!-- 图表网格 -->
    <div class="mb-6 grid grid-cols-2 gap-6">
      <!-- 权属性质→开放情况桑基图 -->
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <SankeyChart
          title="权属性质→开放情况"
          :nodes="ownershipOpenSankeyData.nodes"
          :links="ownershipOpenSankeyData.links"
          height="450px"
        />
        <div class="mt-2 text-xs text-gray-500">
          注：展示权属性质到开放情况的流向，线条粗细表示数量
        </div>
      </div>

      <!-- 当前用途×开放情况分层柱状图 -->
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <StackedBarChart
          title="当前用途×开放情况"
          :categories="useOpenData.categories"
          :series="useOpenData.series"
          x-axis-name="当前用途"
          y-axis-name="园林数量"
          height="450px"
        />
        <div class="mt-2 text-xs text-gray-500">
          注：私人用途几乎不开放，游览服务开放率高；颜色=开放情况
        </div>
      </div>

      <!-- 区县×开放情况分层柱状图 -->
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <StackedBarChart
          title="区县×开放情况"
          :categories="districtOpenData.categories"
          :series="districtOpenData.series"
          x-axis-name="区县"
          y-axis-name="园林数量"
          height="400px"
          :tooltip-formatter="districtOpenTooltipFormatter"
        />
        <div class="mt-2 text-xs text-gray-500">注：展示各区县开放情况构成；颜色=开放情况</div>
      </div>

      <!-- 区县公平性散点图 -->
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <ScatterChart
          title="区县公平性散点图"
          :data="districtFairnessScatter"
          x-axis-name="开放率 (%)"
          y-axis-name="人均开放园林 (个/万人)"
          height="400px"
          :show-legend="false"
          :tooltip-formatter="fairnessScatterTooltipFormatter"
        />
        <div class="mt-2 text-xs text-gray-500">
          注：X=开放率，Y=人均开放园林数，气泡大小=园林总数
        </div>
      </div>
    </div>

    <!-- 未开放园林清单表格 -->
    <div class="rounded-lg border border-gray-200 bg-white p-4">
      <h3 class="mb-4 text-lg font-semibold text-gray-900">未开放园林清单</h3>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                名称
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                区县
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                权属性质
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                当前用途
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                文保级别
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                面积 (㎡)
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="garden in closedGardens" :key="garden.name" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm font-medium text-gray-900">
                {{ garden.name }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.district }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.ownershipType }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.currentUse }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.heritageLevel }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                {{ garden.area.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="closedGardens.length === 0" class="py-8 text-center text-gray-500">
        暂无未开放园林数据
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  font-size: 0.875rem;
}
</style>
