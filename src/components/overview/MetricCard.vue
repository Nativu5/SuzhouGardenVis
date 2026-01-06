<script setup lang="ts">
/**
 * KPI 指标卡片组件
 * 用于展示关键数据指标
 */

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  description?: string;
  icon?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <div
    class="metric-card rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
  >
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="mb-1 text-sm text-gray-600">{{ props.title }}</div>
        <div class="flex items-baseline gap-1">
          <div class="text-2xl font-semibold text-gray-900">
            {{ props.value }}
          </div>
          <div v-if="props.unit" class="text-sm text-gray-500">
            {{ props.unit }}
          </div>
        </div>
        <div v-if="props.description" class="mt-2 text-xs text-gray-500">
          {{ props.description }}
        </div>
      </div>
      <div v-if="props.icon" class="text-2xl opacity-50">
        {{ props.icon }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.metric-card {
  min-height: 100px;
}
</style>
