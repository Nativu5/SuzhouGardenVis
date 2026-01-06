<!--
  布尔筛选器组件
  三态选择：全部（null）、是（true）、否（false）
  用于世界遗产筛选
-->
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  label: string; // 筛选器标签
  modelValue: boolean | null; // 选中的值（v-model）
  trueLabel?: string; // true 的显示文本
  falseLabel?: string; // false 的显示文本
  allLabel?: string; // null 的显示文本
}

const props = withDefaults(defineProps<Props>(), {
  trueLabel: '是',
  falseLabel: '否',
  allLabel: '全部',
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean | null];
}>();

// 当前选项
const currentOption = computed(() => {
  if (props.modelValue === null) return 'all';
  return props.modelValue ? 'true' : 'false';
});

// 选择选项
function selectOption(option: string) {
  let value: boolean | null;

  switch (option) {
    case 'true':
      value = true;
      break;
    case 'false':
      value = false;
      break;
    default:
      value = null;
  }

  emit('update:modelValue', value);
}
</script>

<template>
  <div class="boolean-filter">
    <label class="mb-2 block text-sm font-medium text-gray-700">
      {{ label }}
    </label>

    <div class="flex items-center space-x-2">
      <button
        v-for="option in [
          { key: 'all', label: allLabel },
          { key: 'true', label: trueLabel },
          { key: 'false', label: falseLabel },
        ]"
        :key="option.key"
        type="button"
        class="flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
        :class="{
          'bg-blue-600 text-white': currentOption === option.key,
          'bg-gray-100 text-gray-700 hover:bg-gray-200': currentOption !== option.key,
        }"
        @click="selectOption(option.key)"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
