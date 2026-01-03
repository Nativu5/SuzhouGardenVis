<!--
  筛选标签组件
  显示当前生效的筛选条件，支持快速清除单个或全部筛选
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useGardenStore } from '@/stores/gardenStore'

const gardenStore = useGardenStore()

// 筛选标签接口
interface FilterTag {
  key: string
  label: string
  value: string
  onRemove: () => void
}

// 生成筛选标签列表
const filterTags = computed<FilterTag[]>(() => {
  const tags: FilterTag[] = []
  const filters = gardenStore.filters

  // 搜索关键词
  if (filters.searchKeyword) {
    tags.push({
      key: 'search',
      label: '搜索',
      value: filters.searchKeyword,
      onRemove: () => gardenStore.updateFilters({ searchKeyword: undefined })
    })
  }

  // 区县
  if (filters.districts && filters.districts.length > 0) {
    filters.districts.forEach((district, index) => {
      tags.push({
        key: `district-${index}`,
        label: '区县',
        value: district,
        onRemove: () => {
          const newDistricts = filters.districts!.filter(d => d !== district)
          gardenStore.updateFilters({ districts: newDistricts.length > 0 ? newDistricts : undefined })
        }
      })
    })
  }

  // 开放情况
  if (filters.openStatus && filters.openStatus.length > 0) {
    filters.openStatus.forEach((status, index) => {
      tags.push({
        key: `openStatus-${index}`,
        label: '开放情况',
        value: status,
        onRemove: () => {
          const newStatus = filters.openStatus!.filter(s => s !== status)
          gardenStore.updateFilters({ openStatus: newStatus.length > 0 ? newStatus : undefined })
        }
      })
    })
  }

  // 文保单位级别
  if (filters.heritageLevels && filters.heritageLevels.length > 0) {
    filters.heritageLevels.forEach((level, index) => {
      tags.push({
        key: `heritageLevel-${index}`,
        label: '文保级别',
        value: level,
        onRemove: () => {
          const newLevels = filters.heritageLevels!.filter(l => l !== level)
          gardenStore.updateFilters({ heritageLevels: newLevels.length > 0 ? newLevels : undefined })
        }
      })
    })
  }

  // 权属性质
  if (filters.ownershipTypes && filters.ownershipTypes.length > 0) {
    filters.ownershipTypes.forEach((type, index) => {
      tags.push({
        key: `ownershipType-${index}`,
        label: '权属性质',
        value: type,
        onRemove: () => {
          const newTypes = filters.ownershipTypes!.filter(t => t !== type)
          gardenStore.updateFilters({ ownershipTypes: newTypes.length > 0 ? newTypes : undefined })
        }
      })
    })
  }

  // 当前用途
  if (filters.currentUses && filters.currentUses.length > 0) {
    filters.currentUses.forEach((use, index) => {
      tags.push({
        key: `currentUse-${index}`,
        label: '当前用途',
        value: use,
        onRemove: () => {
          const newUses = filters.currentUses!.filter(u => u !== use)
          gardenStore.updateFilters({ currentUses: newUses.length > 0 ? newUses : undefined })
        }
      })
    })
  }

  // 世界遗产
  if (filters.isWorldHeritage !== null && filters.isWorldHeritage !== undefined) {
    tags.push({
      key: 'worldHeritage',
      label: '世界遗产',
      value: filters.isWorldHeritage ? '是' : '否',
      onRemove: () => gardenStore.updateFilters({ isWorldHeritage: null })
    })
  }

  // 年代分类
  if (filters.eraCategories && filters.eraCategories.length > 0) {
    filters.eraCategories.forEach((category, index) => {
      tags.push({
        key: `eraCategory-${index}`,
        label: '年代分类',
        value: category,
        onRemove: () => {
          const newCategories = filters.eraCategories!.filter(c => c !== category)
          gardenStore.updateFilters({ eraCategories: newCategories.length > 0 ? newCategories : undefined })
        }
      })
    })
  }

  // 建造年代
  if (filters.constructionPeriods && filters.constructionPeriods.length > 0) {
    filters.constructionPeriods.forEach((period, index) => {
      tags.push({
        key: `constructionPeriod-${index}`,
        label: '建造年代',
        value: period,
        onRemove: () => {
          const newPeriods = filters.constructionPeriods!.filter(p => p !== period)
          gardenStore.updateFilters({ constructionPeriods: newPeriods.length > 0 ? newPeriods : undefined })
        }
      })
    })
  }

  // 公布批次
  if (filters.publicationBatches && filters.publicationBatches.length > 0) {
    filters.publicationBatches.forEach((batch, index) => {
      tags.push({
        key: `publicationBatch-${index}`,
        label: '公布批次',
        value: batch,
        onRemove: () => {
          const newBatches = filters.publicationBatches!.filter(b => b !== batch)
          gardenStore.updateFilters({ publicationBatches: newBatches.length > 0 ? newBatches : undefined })
        }
      })
    })
  }

  // 面积区间
  if (filters.areaRanges && filters.areaRanges.length > 0) {
    filters.areaRanges.forEach((range, index) => {
      tags.push({
        key: `areaRange-${index}`,
        label: '面积区间',
        value: `${range}㎡`,
        onRemove: () => {
          const newRanges = filters.areaRanges!.filter(r => r !== range)
          gardenStore.updateFilters({ areaRanges: newRanges.length > 0 ? newRanges : undefined })
        }
      })
    })
  }

  // 面积范围（最小值/最大值）
  if (filters.areaMin !== undefined && filters.areaMin !== null) {
    tags.push({
      key: 'areaMin',
      label: '最小面积',
      value: `≥${filters.areaMin}㎡`,
      onRemove: () => gardenStore.updateFilters({ areaMin: undefined })
    })
  }

  if (filters.areaMax !== undefined && filters.areaMax !== null) {
    tags.push({
      key: 'areaMax',
      label: '最大面积',
      value: `≤${filters.areaMax}㎡`,
      onRemove: () => gardenStore.updateFilters({ areaMax: undefined })
    })
  }

  return tags
})

// 是否有筛选条件
const hasFilters = computed(() => filterTags.value.length > 0)

// 清空所有筛选
function clearAllFilters() {
  gardenStore.clearFilters()
}
</script>

<template>
  <div v-if="hasFilters" class="filter-tags">
    <!-- 标题与清空按钮 -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-medium text-gray-600">当前筛选条件</span>
      <button
        type="button"
        @click="clearAllFilters"
        class="text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        清空全部
      </button>
    </div>

    <!-- 标签列表 -->
    <div class="flex flex-wrap gap-2">
      <div
        v-for="tag in filterTags"
        :key="tag.key"
        class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
      >
        <span class="font-medium">{{ tag.label }}:</span>
        <span>{{ tag.value }}</span>
        <button
          type="button"
          @click="tag.onRemove"
          class="ml-1 text-blue-600 hover:text-blue-900"
          aria-label="移除筛选条件"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
