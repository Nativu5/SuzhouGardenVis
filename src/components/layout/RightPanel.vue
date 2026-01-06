<!--
  右侧详情区组件（仅探索模式显示）
  - 空状态提示
  - 区域统计视图
  - 园林详情视图
-->
<script setup lang="ts">
import { useGardenStore } from '@/stores/gardenStore';
import { computed } from 'vue';
import GardenImageGallery from '@/components/detail/GardenImageGallery.vue';
import RadarChart from '@/components/charts/RadarChart.vue';

const gardenStore = useGardenStore();

// 判断是否有选中的园林
const hasSelectedGarden = computed(() => !!gardenStore.selectedGarden);

// 判断是否有选中的区县
const hasSelectedDistrict = computed(() => !!gardenStore.selectedDistrict);

// 选中区县的园林列表
const districtGardens = computed(() => {
  if (!gardenStore.selectedDistrict) return [];
  return gardenStore.getGardensByDistrict(gardenStore.selectedDistrict);
});

// 选中区县的统计数据（用于雷达图）
const selectedDistrictStats = computed(() => {
  if (!gardenStore.selectedDistrict) return null;
  return gardenStore.districtStatistics.find((d) => d.name === gardenStore.selectedDistrict);
});

// 判断是否有筛选条件生效
const hasActiveFilters = computed(() => {
  const filters = gardenStore.filters;
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

// 处理关闭详情
const handleClose = () => {
  gardenStore.clearSelection();
};
</script>

<template>
  <aside class="flex w-96 flex-col overflow-hidden border-l border-gray-200 bg-white">
    <!-- 空状态 -->
    <div
      v-if="!hasSelectedGarden && !hasSelectedDistrict"
      class="flex flex-1 items-center justify-center p-6"
    >
      <div class="text-center text-gray-400">
        <svg class="mx-auto mb-4 h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="mb-1 text-sm font-medium">未选择园林或区域</p>
        <p class="text-xs">点击地图上的点位或区域查看详情</p>
      </div>
    </div>

    <!-- 区域统计视图 -->
    <div v-else-if="hasSelectedDistrict" class="flex flex-1 flex-col overflow-hidden">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 class="text-lg font-bold text-gray-900">{{ gardenStore.selectedDistrict }} 区域统计</h3>
        <button
          class="p-1 text-gray-400 transition-colors hover:text-gray-600"
          @click="handleClose"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 区域统计指标 -->
      <div class="border-b border-gray-200 bg-gray-50 p-4">
        <!-- 有筛选条件时：只显示满足条件的园林数量 -->
        <div v-if="hasActiveFilters" class="rounded-lg bg-white p-4">
          <p class="mb-1 text-xs text-gray-500">满足筛选条件的园林</p>
          <p class="text-2xl font-bold text-primary-600">{{ districtGardens.length }}</p>
        </div>

        <!-- 无筛选条件时：显示园林数量和开放数量 -->
        <div v-else class="grid grid-cols-2 gap-3">
          <div class="rounded-lg bg-white p-3">
            <p class="mb-1 text-xs text-gray-500">园林数量</p>
            <p class="text-2xl font-bold text-gray-900">{{ districtGardens.length }}</p>
          </div>
          <div class="rounded-lg bg-white p-3">
            <p class="mb-1 text-xs text-gray-500">开放数量</p>
            <p class="text-2xl font-bold text-green-600">
              {{ districtGardens.filter((g) => g.openStatus === '开放').length }}
            </p>
          </div>
        </div>
      </div>

      <!-- 区域雷达图 -->
      <div v-if="selectedDistrictStats" class="border-b border-gray-200 bg-white p-4">
        <h4 class="mb-3 text-sm font-semibold text-gray-700">
          区域综合指标
          <span v-if="hasActiveFilters" class="ml-2 text-xs font-normal text-gray-500">
            （基于筛选结果）
          </span>
        </h4>
        <RadarChart :data="selectedDistrictStats" height="280px" />
      </div>

      <!-- 园林列表 -->
      <div class="flex-1 overflow-y-auto p-4">
        <h4 class="mb-3 text-sm font-semibold text-gray-700">区域内园林</h4>
        <div class="space-y-2">
          <div
            v-for="garden in districtGardens"
            :key="garden.name"
            class="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-sm"
            @click="gardenStore.selectGarden(garden)"
          >
            <p class="mb-2 text-sm font-medium text-gray-900">{{ garden.name }}</p>
            <div class="flex flex-wrap gap-1.5 text-xs">
              <!-- 开放情况 -->
              <span
                :class="[
                  'rounded px-2 py-0.5',
                  garden.openStatus === '开放'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600',
                ]"
              >
                {{ garden.openStatus }}
              </span>
              <!-- 保护等级 -->
              <span
                :class="[
                  'rounded px-2 py-0.5',
                  garden.heritageLevel === '全国'
                    ? 'bg-red-100 text-red-700'
                    : garden.heritageLevel === '省级'
                      ? 'bg-orange-100 text-orange-700'
                      : garden.heritageLevel === '市级'
                        ? 'bg-yellow-100 text-yellow-700'
                        : garden.heritageLevel === '县级'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600',
                ]"
              >
                {{ garden.heritageLevel }}
              </span>
              <!-- 权属性质 -->
              <span class="rounded bg-purple-100 px-2 py-0.5 text-purple-700">
                {{ garden.ownershipType }}
              </span>
              <!-- 当前用途 -->
              <span class="rounded bg-cyan-100 px-2 py-0.5 text-cyan-700">
                {{ garden.currentUse }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 园林详情视图 -->
    <div v-else-if="hasSelectedGarden" class="flex flex-1 flex-col overflow-hidden">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between border-b border-gray-200 p-4">
        <h3 class="text-lg font-bold text-gray-900">园林详情</h3>
        <button
          class="p-1 text-gray-400 transition-colors hover:text-gray-600"
          @click="handleClose"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 详情内容 -->
      <div class="flex-1 space-y-4 overflow-y-auto p-4">
        <!-- 园林名称 -->
        <div>
          <h4 class="mb-1 text-xl font-bold text-gray-900">
            {{ gardenStore.selectedGarden?.name }}
          </h4>
          <p class="text-sm text-gray-600">
            {{ gardenStore.selectedGarden?.district }}
          </p>
        </div>

        <!-- 图片展示 -->
        <GardenImageGallery
          v-if="gardenStore.selectedGarden"
          :garden-name="gardenStore.selectedGarden.name"
        />

        <!-- 基础信息 -->
        <div class="space-y-3">
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">地址</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.address }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">建造年代</span>
            <span class="text-sm text-gray-900">{{
              gardenStore.selectedGarden?.constructionPeriod
            }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">面积</span>
            <span class="text-sm text-gray-900"
              >{{ gardenStore.selectedGarden?.area.toLocaleString() }} ㎡</span
            >
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">文保级别</span>
            <span class="text-sm text-gray-900">{{
              gardenStore.selectedGarden?.heritageLevel
            }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">权属性质</span>
            <span class="text-sm text-gray-900">{{
              gardenStore.selectedGarden?.ownershipType
            }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">管理单位</span>
            <span class="text-sm text-gray-900">{{
              gardenStore.selectedGarden?.managementUnit
            }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">保护状况</span>
            <span class="text-sm text-gray-900">{{
              gardenStore.selectedGarden?.protectionStatus
            }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">开放情况</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.openStatus }}</span>
          </div>
          <div class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">当前用途</span>
            <span class="text-sm text-gray-900">{{ gardenStore.selectedGarden?.currentUse }}</span>
          </div>
          <div v-if="gardenStore.selectedGarden?.isWorldHeritage" class="flex items-start">
            <span class="w-24 flex-shrink-0 text-sm font-medium text-gray-500">世界遗产</span>
            <span class="text-sm font-bold text-blue-600">是</span>
          </div>
        </div>

        <!-- 描述 -->
        <div v-if="gardenStore.selectedGarden?.description" class="border-t border-gray-200 pt-3">
          <h5 class="mb-2 text-sm font-semibold text-gray-700">描述</h5>
          <p class="text-sm leading-relaxed text-gray-600">
            {{ gardenStore.selectedGarden.description }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>
