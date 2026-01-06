<!--
  范围筛选器组件
  用于数值范围筛选（如面积）
-->
<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  label: string; // 筛选器标签
  min?: number | null; // 最小值
  max?: number | null; // 最大值
  minPlaceholder?: string; // 最小值占位符
  maxPlaceholder?: string; // 最大值占位符
  unit?: string; // 单位
}

const props = withDefaults(defineProps<Props>(), {
  minPlaceholder: '最小值',
  maxPlaceholder: '最大值',
  unit: '',
});

const emit = defineEmits<{
  'update:min': [value: number | null];
  'update:max': [value: number | null];
}>();

// 内部状态
const minValue = ref<string>(props.min?.toString() || '');
const maxValue = ref<string>(props.max?.toString() || '');

// 监听 props 变化
watch(
  () => props.min,
  (newVal) => {
    minValue.value = newVal?.toString() || '';
  },
);

watch(
  () => props.max,
  (newVal) => {
    maxValue.value = newVal?.toString() || '';
  },
);

// 更新最小值
function updateMin(value: string) {
  minValue.value = value;
  const num = parseFloat(value);
  emit('update:min', isNaN(num) ? null : num);
}

// 更新最大值
function updateMax(value: string) {
  maxValue.value = value;
  const num = parseFloat(value);
  emit('update:max', isNaN(num) ? null : num);
}

// 清空
function clear() {
  minValue.value = '';
  maxValue.value = '';
  emit('update:min', null);
  emit('update:max', null);
}
</script>

<template>
  <div class="range-filter">
    <div class="mb-2 flex items-center justify-between">
      <label class="block text-sm font-medium text-gray-700">
        {{ label }}
      </label>
      <button
        v-if="minValue || maxValue"
        type="button"
        class="text-xs text-blue-600 hover:text-blue-800"
        @click="clear"
      >
        清空
      </button>
    </div>

    <div class="flex items-center space-x-2">
      <div class="relative flex-1">
        <input
          type="number"
          :value="minValue"
          :placeholder="minPlaceholder"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="updateMin(($event.target as HTMLInputElement).value)"
        />
        <span v-if="unit" class="absolute right-3 top-2 text-xs text-gray-400">
          {{ unit }}
        </span>
      </div>

      <span class="text-gray-400">-</span>

      <div class="relative flex-1">
        <input
          type="number"
          :value="maxValue"
          :placeholder="maxPlaceholder"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="updateMax(($event.target as HTMLInputElement).value)"
        />
        <span v-if="unit" class="absolute right-3 top-2 text-xs text-gray-400">
          {{ unit }}
        </span>
      </div>
    </div>
  </div>
</template>
