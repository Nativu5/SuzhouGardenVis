<!--
  探索模式筛选器集成组件
  包含所有探索模式所需的筛选器
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useGardenStore } from '@/stores/gardenStore';
import {
  getDistrictList,
  getOpenStatusList,
  getHeritageLevelList,
  getOwnershipTypeList,
  getCurrentUseList,
  getConstructionPeriodList,
  getEraCategoryList,
  getPublicationBatchList,
  getAreaRangeList,
} from '@/services/dataLoader';

import MultiSelectFilter from './MultiSelectFilter.vue';
import BooleanFilter from './BooleanFilter.vue';

const gardenStore = useGardenStore();

// 计算所有筛选器的选项列表（基于原始数据）
const districtOptions = computed(() => getDistrictList(gardenStore.rawData));
const openStatusOptions = computed(() => getOpenStatusList(gardenStore.rawData));
const heritageLevelOptions = computed(() => getHeritageLevelList(gardenStore.rawData));
const ownershipTypeOptions = computed(() => getOwnershipTypeList(gardenStore.rawData));
const currentUseOptions = computed(() => getCurrentUseList(gardenStore.rawData));
const constructionPeriodOptions = computed(() => getConstructionPeriodList(gardenStore.rawData));
const eraCategoryOptions = computed(() => getEraCategoryList(gardenStore.rawData));
const publicationBatchOptions = computed(() => getPublicationBatchList(gardenStore.rawData));
const areaRangeOptions = computed(() => getAreaRangeList());

// 筛选器值的计算属性和更新方法
const districts = computed({
  get: () => gardenStore.filters.districts || [],
  set: (value) => gardenStore.updateFilters({ districts: value.length > 0 ? value : undefined }),
});

const openStatus = computed({
  get: () => gardenStore.filters.openStatus || [],
  set: (value) => gardenStore.updateFilters({ openStatus: value.length > 0 ? value : undefined }),
});

const heritageLevels = computed({
  get: () => gardenStore.filters.heritageLevels || [],
  set: (value) =>
    gardenStore.updateFilters({ heritageLevels: value.length > 0 ? value : undefined }),
});

const ownershipTypes = computed({
  get: () => gardenStore.filters.ownershipTypes || [],
  set: (value) =>
    gardenStore.updateFilters({ ownershipTypes: value.length > 0 ? value : undefined }),
});

const currentUses = computed({
  get: () => gardenStore.filters.currentUses || [],
  set: (value) => gardenStore.updateFilters({ currentUses: value.length > 0 ? value : undefined }),
});

const isWorldHeritage = computed({
  get: () => gardenStore.filters.isWorldHeritage ?? null,
  set: (value) => gardenStore.updateFilters({ isWorldHeritage: value }),
});

const constructionPeriods = computed({
  get: () => gardenStore.filters.constructionPeriods || [],
  set: (value) =>
    gardenStore.updateFilters({ constructionPeriods: value.length > 0 ? value : undefined }),
});

const eraCategories = computed({
  get: () => gardenStore.filters.eraCategories || [],
  set: (value) =>
    gardenStore.updateFilters({ eraCategories: value.length > 0 ? value : undefined }),
});

const publicationBatches = computed({
  get: () => gardenStore.filters.publicationBatches || [],
  set: (value) =>
    gardenStore.updateFilters({ publicationBatches: value.length > 0 ? value : undefined }),
});

const areaRanges = computed({
  get: () => gardenStore.filters.areaRanges || [],
  set: (value) => gardenStore.updateFilters({ areaRanges: value.length > 0 ? value : undefined }),
});
</script>

<template>
  <div class="explore-filters space-y-4">
    <!-- 基础筛选 -->
    <div class="space-y-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">基础筛选</h4>

      <MultiSelectFilter
        v-model="districts"
        label="区县"
        :options="districtOptions"
        placeholder="选择区县"
      />

      <MultiSelectFilter
        v-model="openStatus"
        label="开放情况"
        :options="openStatusOptions"
        placeholder="选择开放情况"
      />

      <MultiSelectFilter
        v-model="heritageLevels"
        label="文保单位级别"
        :options="heritageLevelOptions"
        placeholder="选择文保级别"
      />
    </div>

    <!-- 权属与用途 -->
    <div class="space-y-4 border-t border-gray-200 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">权属与用途</h4>

      <MultiSelectFilter
        v-model="ownershipTypes"
        label="权属性质"
        :options="ownershipTypeOptions"
        placeholder="选择权属性质"
      />

      <MultiSelectFilter
        v-model="currentUses"
        label="当前用途"
        :options="currentUseOptions"
        placeholder="选择当前用途"
      />

      <BooleanFilter v-model="isWorldHeritage" label="世界遗产" />
    </div>

    <!-- 时间维度 -->
    <div class="space-y-4 border-t border-gray-200 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">时间维度</h4>

      <MultiSelectFilter
        v-model="eraCategories"
        label="年代分类"
        :options="eraCategoryOptions"
        placeholder="选择年代分类"
      />

      <MultiSelectFilter
        v-model="constructionPeriods"
        label="建造年代"
        :options="constructionPeriodOptions"
        placeholder="选择建造年代"
      />

      <MultiSelectFilter
        v-model="publicationBatches"
        label="公布批次"
        :options="publicationBatchOptions"
        placeholder="选择公布批次"
      />
    </div>

    <!-- 规模筛选 -->
    <div class="space-y-4 border-t border-gray-200 pt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wider text-gray-500">规模筛选</h4>

      <MultiSelectFilter
        v-model="areaRanges"
        label="面积区间"
        :options="areaRangeOptions"
        placeholder="选择面积区间"
      />
    </div>
  </div>
</template>
